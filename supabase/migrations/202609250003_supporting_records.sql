begin;
alter table public.jobs drop constraint jobs_booking_id_key;
alter table public.jobs add column original_job_id uuid references public.jobs;
alter table public.jobs add constraint no_self_rework check(original_job_id is null or original_job_id<>id);
create unique index one_primary_job_per_booking on public.jobs(booking_id) where original_job_id is null;
alter table public.payment_methods add column verification_provider text not null default 'stripe' check(verification_provider='stripe');
alter table public.payment_methods add foreign key(verification_provider,verified_event_id) references public.webhook_events(provider,event_id);
-- Phase 1 record foundations only; their product workflows belong to later milestones.
create table public.contractor_applications (
 id uuid primary key default gen_random_uuid(), contractor_id uuid unique references public.contractors,
 contact_email text not null, source text, experience text, own_tools boolean, own_vehicle boolean,
 screening_notes text, created_at timestamptz not null default now()
);
create table public.contractor_agreements (
 id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractors,
 version text not null, signed_at timestamptz not null, document_id uuid not null references public.contractor_documents
);
create table public.contractor_availability (
 id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractors,
 starts_at timestamptz not null, ends_at timestamptz not null, available boolean not null,
 check(ends_at>starts_at)
);
create table public.contractor_rates (
 id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractors,
 service_id uuid not null references public.services, payout_cents integer not null check(payout_cents>=0),
 effective_at timestamptz not null, unique(contractor_id,service_id,effective_at)
);
create table public.quotes (
 id uuid primary key default gen_random_uuid(), lead_id uuid references public.leads,
 customer_id uuid not null references public.customers, config_version_id uuid not null references public.service_config_versions,
 scope text not null, expires_at timestamptz not null, accepted_at timestamptz
);
create table public.quote_items (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.quotes,
 code text not null, description text not null, amount_cents integer not null check(amount_cents>=0)
);
alter table public.bookings add column quote_id uuid references public.quotes;
create table public.crm_notes (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers,
 job_id uuid references public.jobs, author uuid not null references public.profiles, note text not null,
 created_at timestamptz not null default now()
);
create table public.additional_service_requests (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 contractor_id uuid not null references public.contractors, detail text not null,
 quote_id uuid references public.quotes, authorized_at timestamptz
);
create table public.customer_feedback (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 rating integer check(rating between 1 and 5), feedback text, created_at timestamptz not null default now()
);
create table public.contractor_job_scores (
 assignment_id uuid primary key references public.job_assignments, components jsonb not null,
 weights_version text not null, reviewer uuid not null references public.profiles, reviewed_at timestamptz not null default now()
);
create table public.acquisition_spend (
 id uuid primary key default gen_random_uuid(), channel text not null, starts_at date not null, ends_at date not null,
 amount_cents integer not null check(amount_cents>=0), allocation_method text not null, check(ends_at>=starts_at)
);
create table public.launch_reviews (
 id uuid primary key default gen_random_uuid(), completed_job_count integer not null,
 metrics jsonb not null, decision text not null, reviewer uuid not null references public.profiles,
 created_at timestamptz not null default now()
);

do $$ declare t text; begin
 foreach t in array array['contractor_applications','contractor_agreements','contractor_availability','contractor_rates',
 'quotes','quote_items','crm_notes','additional_service_requests','customer_feedback','contractor_job_scores','acquisition_spend','launch_reviews'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;

create or replace function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(actor,action,record_id,detail)
 values(auth.uid(),tg_table_name||'.'||lower(tg_op),coalesce(new.id,old.id),
 jsonb_build_object('before',case when tg_op='INSERT' then null else to_jsonb(old) end,
 'after',case when tg_op='DELETE' then null else to_jsonb(new) end));
 return coalesce(new,old);
end $$;
create trigger audit_job after insert or update or delete on public.jobs for each row execute function private.audit_change();
create trigger audit_issue after insert or update or delete on public.job_issues for each row execute function private.audit_change();
create trigger audit_refund after insert or update or delete on public.refunds for each row execute function private.audit_change();
create trigger audit_profile after insert or update or delete on public.profiles for each row execute function private.audit_change();
create trigger audit_contractor after insert or update or delete on public.contractors for each row execute function private.audit_change();

-- Lock the contractor row for both compliance edits and assignment decisions.
-- This serializes revocation against a simultaneous offer/acceptance.
create function private.lock_compliance_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.contractor_id<>old.contractor_id then raise exception 'Compliance owner is immutable'; end if;
 perform 1 from public.contractors where id=coalesce(new.contractor_id,old.contractor_id) for update;
 if tg_op<>'DELETE' and new.document_id is not null and not exists(
  select 1 from public.contractor_documents where id=new.document_id and contractor_id=new.contractor_id
 ) then raise exception 'Compliance document owner mismatch'; end if;
 return coalesce(new,old);
end $$;
create trigger compliance_owner before insert or update or delete on public.contractor_compliance for each row execute function private.lock_compliance_owner();
revoke all on function private.lock_compliance_owner() from public,anon,authenticated;
commit;
