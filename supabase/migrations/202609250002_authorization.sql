begin;
create function private.is_staff(admin_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active
 and (role='admin' or (not admin_only and role='dispatcher')))
 and coalesce(auth.jwt()->>'aal','')='aal2';
$$;

create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(actor,action,record_id,detail)
 values(auth.uid(),tg_table_name||'.'||lower(tg_op),coalesce(new.id,old.id),
 jsonb_build_object('operation',tg_op));
 return coalesce(new,old);
end $$;

create function private.guard_config() returns trigger language plpgsql set search_path='' as $$
declare s jsonb; r jsonb;
begin
 if tg_op='DELETE' then
  if old.state='published' then raise exception 'Published configuration is immutable'; end if;
  return old;
 end if;
 if tg_op='UPDATE' and old.state='published' then raise exception 'Published configuration is immutable'; end if;
 s:=new.settings;
 if new.state='published' then
  if not (s ?& array['customerPriceCents','contractorPayoutCents','maxVentLengthFeet','minimumMarginBps','surcharges','exclusions','qualificationRules','complianceRequirements','zipCodes','paymentPolicy','scope']) then
   raise exception 'Incomplete configuration';
  end if;
  if jsonb_typeof(s->'customerPriceCents')<>'number' or (s->>'customerPriceCents')::numeric<=0
   or (s->>'customerPriceCents')::numeric<>trunc((s->>'customerPriceCents')::numeric)
   or jsonb_typeof(s->'contractorPayoutCents')<>'number' or (s->>'contractorPayoutCents')::numeric<0
   or (s->>'contractorPayoutCents')::numeric<>trunc((s->>'contractorPayoutCents')::numeric)
   or (s->>'maxVentLengthFeet')::numeric<=0
   or (s->>'minimumMarginBps')::numeric not between 0 and 10000
   or jsonb_typeof(s->'surcharges')<>'array' or jsonb_typeof(s->'exclusions')<>'array'
   or jsonb_typeof(s->'qualificationRules')<>'array' or jsonb_typeof(s->'zipCodes')<>'array'
   or jsonb_array_length(s->'zipCodes')=0 or jsonb_typeof(s->'complianceRequirements')<>'array'
   or jsonb_array_length(s->'complianceRequirements')=0 or length(s->>'scope')=0
   or not coalesce((s->'paymentPolicy'->>'mode') in ('collect_at_booking_charge_after_verification','pay_after_verification','charge_at_booking'),false)
   or coalesce(length(s->'paymentPolicy'->>'consentVersion'),0)=0 then raise exception 'Invalid configuration'; end if;
  for r in select value from jsonb_array_elements(s->'complianceRequirements') loop
   if coalesce(r->>'key','') !~ '^[a-z][a-z0-9_]{1,63}$' or jsonb_typeof(r->'required')<>'boolean' then raise exception 'Invalid compliance requirement'; end if;
  end loop;
 end if;
 return new;
end $$;
create trigger config_guard before insert or update or delete on public.service_config_versions for each row execute function private.guard_config();

create function private.snapshot_booking() returns trigger language plpgsql set search_path='' as $$
declare c public.service_config_versions;
begin
 if tg_op='UPDATE' then
  if new.config_version_id<>old.config_version_id or new.terms_snapshot<>old.terms_snapshot
   or new.agreed_total_cents<>old.agreed_total_cents or new.customer_id<>old.customer_id or new.property_id<>old.property_id then
   raise exception 'Accepted booking terms are immutable; use a separately authorized change order';
  end if;
 else
  select * into c from public.service_config_versions where id=new.config_version_id;
  if c.state<>'published' or c.effective_at>now() then raise exception 'Configuration not effective'; end if;
  new.terms_snapshot:=c.settings;
 end if;
 return new;
end $$;
create trigger booking_snapshot before insert or update on public.bookings for each row execute function private.snapshot_booking();

-- Requirements are the union of accepted terms and current policy: later changes
-- cannot silently weaken a historical requirement, and new safety requirements apply.
create function private.assert_eligible(p_job uuid,p_contractor uuid) returns void
language plpgsql security definer set search_path='' as $$
declare j public.jobs; b public.bookings; c public.contractors; s uuid; current_settings jsonb; req text; z text;
begin
 select * into j from public.jobs where id=p_job;
 select * into b from public.bookings where id=j.booking_id;
 select * into c from public.contractors where id=p_contractor for update;
 select service_id into s from public.service_config_versions where id=b.config_version_id;
 select zip into z from public.properties where id=b.property_id;
 if j.id is null or c.id is null or j.status in ('completed','cancelled') or c.status not in ('trial','active','probation')
  or not(s=any(c.service_ids)) or not(z=any(c.zip_codes)) then raise exception 'Contractor not eligible'; end if;
 select settings into current_settings from public.service_config_versions
 where service_id=s and state='published' and effective_at<=now() order by effective_at desc limit 1;
 for req in
  select distinct value->>'key' from jsonb_array_elements(
   coalesce(b.terms_snapshot->'complianceRequirements','[]') || coalesce(current_settings->'complianceRequirements','[]'))
  where value->>'required'='true'
 loop
  if not exists(select 1 from public.contractor_compliance where contractor_id=p_contractor and requirement_key=req
    and status='verified' and valid_from<=least(now(),j.window_start) and valid_until>greatest(now(),j.window_end)) then
   raise exception 'Required compliance missing or expired: %',req;
  end if;
 end loop;
end $$;

create function private.guard_assignment() returns trigger language plpgsql security definer set search_path='' as $$
declare j public.jobs;
begin
 if new.status in ('offered','accepted') then
  perform private.assert_eligible(new.job_id,new.contractor_id);
 end if;
 if tg_op='UPDATE' and (new.job_id<>old.job_id or new.contractor_id<>old.contractor_id or new.payout_cents<>old.payout_cents) then
  raise exception 'Assignment identity and payout are immutable';
 end if;
 if new.status='accepted' then
  select * into j from public.jobs where id=new.job_id for update;
  if exists(select 1 from public.job_assignments a join public.jobs other on other.id=a.job_id
   where a.contractor_id=new.contractor_id and a.status='accepted' and a.id<>new.id
   and other.status not in ('completed','cancelled') and other.window_start<j.window_end and other.window_end>j.window_start) then
   raise exception 'Conflicting appointment';
  end if;
 end if;
 return new;
end $$;
create trigger assignment_gate before insert or update on public.job_assignments for each row execute function private.guard_assignment();

create function private.guard_reschedule() returns trigger language plpgsql security definer set search_path='' as $$
declare a public.job_assignments;
begin
 if new.window_start<>old.window_start or new.window_end<>old.window_end then
  for a in select * from public.job_assignments where job_id=new.id and status in ('offered','accepted') loop
   perform private.assert_eligible(new.id,a.contractor_id);
   if a.status='accepted' and exists(select 1 from public.job_assignments x join public.jobs j on j.id=x.job_id
     where x.contractor_id=a.contractor_id and x.status='accepted' and x.job_id<>new.id
     and j.status not in ('completed','cancelled') and j.window_start<new.window_end and j.window_end>new.window_start) then
    raise exception 'Conflicting appointment';
   end if;
  end loop;
 end if;
 return new;
end $$;
-- AFTER sees the new appointment dates. Raising rolls the entire update back.
create trigger reschedule_gate after update on public.jobs for each row execute function private.guard_reschedule();

create function public.admin_configurations() returns setof public.service_config_versions
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_staff(true) then raise exception 'Forbidden' using errcode='42501'; end if;
 return query select * from public.service_config_versions order by effective_at desc;
end $$;
create function public.create_configuration(p_service uuid,p_effective_at timestamptz,p_settings jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not private.is_staff(true) then raise exception 'Forbidden' using errcode='42501'; end if;
 perform 1 from public.services where id=p_service for update;
 insert into public.service_config_versions(service_id,version,effective_at,settings,created_by)
 select p_service,coalesce(max(version),0)+1,p_effective_at,p_settings,auth.uid() from public.service_config_versions where service_id=p_service returning id into result;
 return result;
end $$;
create function public.publish_configuration(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_staff(true) then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.service_config_versions set state='published',published_at=now() where id=p_id and state='draft';
 if not found then raise exception 'Draft not found'; end if;
end $$;

create function public.offer_assignment(p_job uuid,p_contractor uuid,p_payout integer,p_deadline timestamptz) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not private.is_staff() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_deadline<=now() then raise exception 'Offer deadline must be future'; end if;
 insert into public.job_assignments(job_id,contractor_id,payout_cents,offered_until)
 values(p_job,p_contractor,p_payout,p_deadline) returning id into result;
 return result;
end $$;
create function public.accept_assignment(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.job_assignments a set status='accepted',accepted_at=now()
 where a.id=p_id and a.status='offered' and offered_until>now()
 and exists(select 1 from public.contractors c join public.profiles p on p.id=c.profile_id
  where c.id=a.contractor_id and p.id=auth.uid() and p.active and p.role='contractor');
 if not found then raise exception 'Offer unavailable' using errcode='42501'; end if;
end $$;
create function public.confirm_assignment(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_staff() then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.job_assignments a set confirmed_at=now(),access_until=j.window_end
 from public.jobs j where a.id=p_id and a.job_id=j.id and a.status='accepted';
 if not found then raise exception 'Accepted assignment unavailable'; end if;
end $$;

-- No base-table SELECT granted to contractors. The only projection is allowlisted.
create function public.contractor_assignment(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.job_assignments; j public.jobs; b public.bookings; result jsonb; identity_allowed boolean:=false;
begin
 select x.* into a from public.job_assignments x join public.contractors c on c.id=x.contractor_id
 join public.profiles p on p.id=c.profile_id where x.id=p_id and p.id=auth.uid() and p.active and p.role='contractor';
 if a.id is null then raise exception 'Assignment unavailable' using errcode='42501'; end if;
 select * into j from public.jobs where id=a.job_id;
 select * into b from public.bookings where id=j.booking_id;
 result:=jsonb_build_object('id',a.id,'status',a.status,'service','Dryer vent cleaning',
 'zip',(select zip from public.properties where id=b.property_id),'windowStart',j.window_start,'windowEnd',j.window_end,
 'scope',b.terms_snapshot->>'scope','conditionCodes',j.condition_codes,'payoutCents',a.payout_cents);
 if a.status='accepted' and a.confirmed_at is not null and a.access_until>now() and j.window_end>now() and j.status not in ('completed','cancelled') then
  begin perform private.assert_eligible(j.id,a.contractor_id); identity_allowed:=true;
  exception when others then identity_allowed:=false; end;
 end if;
 if identity_allowed then
  result:=result || (select jsonb_build_object('customerName',c.name,'phone',c.phone,'address',p.address,'accessNotes',p.access_notes)
  from public.customers c join public.properties p on p.customer_id=c.id where p.id=b.property_id);
 end if;
 return result;
end $$;

-- Only the trusted server can mint/redeem booking-scoped capabilities.
create function public.issue_guest_token(p_booking uuid,p_hash text) returns void
language sql security definer set search_path='' as $$
 insert into private.guest_tokens(token_hash,booking_id,expires_at) values(p_hash,p_booking,now()+interval '30 minutes');
$$;
create function public.exchange_guest_token(p_hash text,p_session_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare b uuid;
begin
 update private.guest_tokens set consumed_at=now() where token_hash=p_hash and consumed_at is null and revoked_at is null and expires_at>now()
 returning booking_id into b;
 if b is null then raise exception 'Link invalid or expired' using errcode='42501'; end if;
 insert into private.guest_sessions(session_hash,token_hash,booking_id,expires_at) values(p_session_hash,p_hash,b,now()+interval '24 hours');
 return b;
end $$;
create function public.guest_appointment(p_session_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b uuid; result jsonb;
begin
 select s.booking_id into b from private.guest_sessions s join private.guest_tokens t on t.token_hash=s.token_hash
 where s.session_hash=p_session_hash and s.revoked_at is null and t.revoked_at is null and s.expires_at>now();
 if b is null then raise exception 'Session invalid' using errcode='42501'; end if;
 select jsonb_build_object('bookingId',x.id,'totalCents',x.agreed_total_cents,'scope',x.terms_snapshot->>'scope',
 'jobStatus',j.status,'windowStart',j.window_start,'windowEnd',j.window_end,'address',p.address)
 into result from public.bookings x join public.properties p on p.id=x.property_id left join public.jobs j on j.booking_id=x.id where x.id=b;
 return result;
end $$;
create function public.revoke_guest_access(p_booking uuid) returns void
language sql security definer set search_path='' as $$
 update private.guest_tokens set revoked_at=now() where booking_id=p_booking;
$$;

do $$ declare t text; begin
 foreach t in array array['service_config_versions','bookings','job_assignments','contractor_compliance','customer_payments','contractor_payouts'] loop
  execute format('create trigger audit_record after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
 end loop;
end $$;
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on all functions in schema public from public,anon,authenticated;
grant execute on function public.admin_configurations(), public.create_configuration(uuid,timestamptz,jsonb), public.publish_configuration(uuid),
 public.offer_assignment(uuid,uuid,integer,timestamptz), public.accept_assignment(uuid),public.confirm_assignment(uuid),public.contractor_assignment(uuid) to authenticated;
grant execute on function public.issue_guest_token(uuid,text),public.exchange_guest_token(text,text),public.guest_appointment(text),public.revoke_guest_access(uuid) to service_role;
commit;
