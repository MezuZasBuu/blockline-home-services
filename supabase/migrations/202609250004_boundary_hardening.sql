begin;
-- Database validation is required because authenticated admins can call RPCs directly.
create function private.validate_published_settings() returns trigger language plpgsql set search_path='' as $$
declare s jsonb:=new.settings; k text; item jsonb; seen text[]:='{}'; code text;
begin
 if new.state<>'published' then return new; end if;
 foreach k in array array['customerPriceCents','contractorPayoutCents','maxVentLengthFeet','minimumMarginBps'] loop
  if coalesce(jsonb_typeof(s->k),'null')<>'number' then raise exception 'Configuration requires numeric %',k; end if;
 end loop;
 if (s->>'minimumMarginBps')::numeric<>trunc((s->>'minimumMarginBps')::numeric)
  or (s->>'customerPriceCents')::numeric>100000000 or (s->>'contractorPayoutCents')::numeric>100000000
  or (s->>'maxVentLengthFeet')::numeric>10000 then raise exception 'Configuration numeric value out of bounds'; end if;
 if coalesce(jsonb_typeof(s->'scope'),'null')<>'string' or length(s->>'scope')>2000 then raise exception 'Invalid scope'; end if;
 foreach k in array array['surcharges','exclusions','qualificationRules','complianceRequirements','zipCodes'] loop
  if coalesce(jsonb_typeof(s->k),'null')<>'array' then raise exception 'Configuration requires array %',k; end if;
 end loop;
 for item in select value from jsonb_array_elements(s->'zipCodes') loop
  if jsonb_typeof(item)<>'string' or (item#>>'{}')!~'^[0-9]{5}$' then raise exception 'Invalid ZIP'; end if;
 end loop;
 for item in select value from jsonb_array_elements(s->'exclusions') loop
  if jsonb_typeof(item)<>'string' or length(item#>>'{}') not between 1 and 500 then raise exception 'Invalid exclusion'; end if;
 end loop;
 for item in select value from jsonb_array_elements(s->'complianceRequirements') loop
  code:=item->>'key';
  if coalesce(jsonb_typeof(item->'required'),'null')<>'boolean'
   or coalesce(jsonb_typeof(item->'label'),'null')<>'string'
   or coalesce(length(item->>'label'),0) not between 1 and 200
   or coalesce(code,'')!~'^[a-z][a-z0-9_]{1,63}$' or code=any(seen) then raise exception 'Invalid compliance requirement'; end if;
  seen:=array_append(seen,code);
 end loop;
 seen:='{}';
 for item in select value from jsonb_array_elements(s->'surcharges') loop
  code:=item->>'code';
  if coalesce(code,'')!~'^[a-z][a-z0-9_]{1,63}$' or code=any(seen)
   or coalesce(jsonb_typeof(item->'amountCents'),'null')<>'number'
   or coalesce(jsonb_typeof(item->'label'),'null')<>'string' then raise exception 'Invalid surcharge'; end if;
  if (item->>'amountCents')::numeric not between 0 and 100000000
   or (item->>'amountCents')::numeric<>trunc((item->>'amountCents')::numeric) then raise exception 'Invalid surcharge amount'; end if;
  seen:=array_append(seen,code);
 end loop;
 for item in select value from jsonb_array_elements(s->'qualificationRules') loop
  if not coalesce(item->>'field'=any(array['ventLengthFeet','termination','stacked','access','blockage','propertyType','unknown']),false)
   or not coalesce(item->>'operator'=any(array['equals','greater_than','unknown']),false)
   or not coalesce(item->>'outcome'=any(array['surcharge','manual_review','excluded']),false)
   or not coalesce(jsonb_typeof(item->'value')=any(array['string','number','boolean']),false)
   or (item->>'outcome'='surcharge' and not coalesce(item->>'surchargeCode'=any(seen),false)) then raise exception 'Invalid qualification rule'; end if;
 end loop;
 if coalesce(jsonb_typeof(s->'paymentPolicy'),'null')<>'object'
  or coalesce(jsonb_typeof(s->'paymentPolicy'->'consentVersion'),'null')<>'string' then raise exception 'Invalid payment policy'; end if;
 return new;
end $$;
create trigger settings_validation before insert or update on public.service_config_versions for each row execute function private.validate_published_settings();

create function private.assignment_account_gate() returns trigger language plpgsql security definer set search_path='' as $$
declare j public.jobs;
begin
 if new.status not in ('offered','accepted') then return new; end if;
 if not exists(select 1 from public.contractors c join public.profiles p on p.id=c.profile_id
   where c.id=new.contractor_id and p.active and p.role='contractor') then raise exception 'Contractor account unavailable'; end if;
 select * into j from public.jobs where id=new.job_id;
 if exists(select 1 from public.contractor_availability where contractor_id=new.contractor_id and not available
  and starts_at<j.window_end and ends_at>j.window_start) then raise exception 'Contractor unavailable'; end if;
 return new;
end $$;
create trigger assignment_account before insert or update on public.job_assignments for each row execute function private.assignment_account_gate();

-- Confirmation is a single staff action. Neither acceptance alone nor confirmation
-- before acceptance can disclose customer identity.
create or replace function public.confirm_assignment(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_staff() then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.job_assignments a set confirmed_at=now(),access_until=j.window_end
 from public.jobs j where a.id=p_id and a.job_id=j.id and a.status='accepted';
 if not found then raise exception 'Accepted assignment unavailable'; end if;
end $$;
revoke all on function private.validate_published_settings(),private.assignment_account_gate() from public,anon,authenticated;
commit;
