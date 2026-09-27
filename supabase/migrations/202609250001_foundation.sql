-- Blockline Phase 1. Run with the Supabase migration owner, never a browser key.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('customer','contractor','dispatcher','admin');
create type public.job_status as enum ('booked','awaiting_assignment','scheduled','en_route','in_progress','awaiting_verification','completed','cancelled');
create type public.customer_payment_status as enum ('not_due','due','processing','paid','failed','requires_action','partially_refunded','refunded','disputed');
create type public.payout_status as enum ('pending_requirements','eligible','approved','sent','paid','failed','held');
create type public.issue_status as enum ('open','investigating','resolved','closed');
create type public.review_status as enum ('scheduled','sent','failed','suppressed');
create type public.repeat_status as enum ('due_later','due_soon','overdue','contacted','rebooked','opted_out');

create table public.profiles (
 id uuid primary key references auth.users(id), role public.app_role not null default 'customer',
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.services (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug='dryer-vent-cleaning'),
 name text not null, active boolean not null default false
);
create table public.service_config_versions (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references public.services,
 version integer not null check(version>0), state text not null default 'draft' check(state in ('draft','published')),
 effective_at timestamptz not null, settings jsonb not null check(jsonb_typeof(settings)='object'),
 created_by uuid references public.profiles, created_at timestamptz not null default now(), published_at timestamptz,
 unique(service_id,version), unique(service_id,effective_at),
 check((state='published')=(published_at is not null))
);
create table public.customers (
 id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles,
 name text not null, email text not null, phone text, stripe_customer_id text unique,
 created_at timestamptz not null default now()
);
create table public.properties (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers,
 address text not null, zip text not null check(zip ~ '^[0-9]{5}$'), access_notes text,
 unique(id,customer_id)
);
create table public.leads (
 id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers,
 acquisition_source text not null, stage text not null default 'new', qualification jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers,
 property_id uuid not null, lead_id uuid references public.leads,
 config_version_id uuid not null references public.service_config_versions,
 terms_snapshot jsonb not null, agreed_total_cents integer not null check(agreed_total_cents>=0),
 accepted_terms_at timestamptz not null, qualification jsonb not null default '{}',
 created_at timestamptz not null default now(),
 foreign key(property_id,customer_id) references public.properties(id,customer_id)
);
create table public.contractors (
 id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles,
 business_name text not null, status text not null default 'applicant'
 check(status in ('applicant','screening','conditional','trial','active','probation','suspended','terminated')),
 zip_codes text[] not null default '{}', service_ids uuid[] not null default '{}',
 created_at timestamptz not null default now()
);
create table public.contractor_documents (
 id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractors,
 kind text not null, storage_key text unique not null, created_at timestamptz not null default now()
);
create table public.contractor_compliance (
 id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractors,
 requirement_key text not null, status text not null check(status in ('pending','verified','rejected')),
 valid_from timestamptz not null, valid_until timestamptz not null, verified_at timestamptz,
 verified_by uuid references public.profiles, document_id uuid references public.contractor_documents,
 check(valid_until>valid_from), check(status<>'verified' or (verified_at is not null and document_id is not null)),
 unique(contractor_id,requirement_key)
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings,
 status public.job_status not null default 'awaiting_assignment',
 window_start timestamptz not null, window_end timestamptz not null,
 -- Structured, sanitized conditions only: never customer-submitted free text in offer projections.
 condition_codes text[] not null default '{}', verified_at timestamptz,
 created_at timestamptz not null default now(), check(window_end>window_start)
);
create table public.job_assignments (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 contractor_id uuid not null references public.contractors,
 status text not null default 'offered' check(status in ('offered','accepted','declined','expired','released')),
 payout_cents integer not null check(payout_cents>=0), offered_until timestamptz not null,
 accepted_at timestamptz, confirmed_at timestamptz, access_until timestamptz,
 created_at timestamptz not null default now(),
 check(status<>'accepted' or accepted_at is not null),
 check(confirmed_at is null or (accepted_at is not null and access_until is not null))
);
create unique index one_accepted_assignment on public.job_assignments(job_id) where status='accepted';
create index assignment_lookup on public.job_assignments(contractor_id,job_id);
create table public.job_events (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 actor uuid references public.profiles, kind text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.job_evidence (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 kind text not null check(kind in ('before','after','cleanup','checklist','customer_confirmation','notes')),
 storage_key text, detail jsonb, created_at timestamptz not null default now()
);
create table public.completion_reviews (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 reviewer uuid not null references public.profiles, approved boolean not null, override_reason text,
 created_at timestamptz not null default now()
);
create table public.customer_payments (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings,
 status public.customer_payment_status not null default 'not_due',
 amount_cents integer not null check(amount_cents>=0), currency text not null default 'usd' check(currency='usd'),
 stripe_payment_intent_id text unique, idempotency_key text unique not null,
 created_at timestamptz not null default now()
);
create table public.payment_methods (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings,
 stripe_customer_id text not null, stripe_setup_intent_id text unique,
 stripe_payment_method_id text, status text not null default 'pending' check(status in ('pending','ready','failed','revoked')),
 consent_version text not null, consent_at timestamptz not null,
 verified_event_id text, check(status<>'ready' or (stripe_payment_method_id is not null and verified_event_id is not null))
);
create table public.refunds (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.customer_payments,
 amount_cents integer not null check(amount_cents>0), provider_reference text unique, status text not null, reason text not null
);
create table public.contractor_payouts (
 id uuid primary key default gen_random_uuid(), assignment_id uuid unique not null references public.job_assignments,
 amount_cents integer not null check(amount_cents>=0), status public.payout_status not null default 'pending_requirements',
 due_at timestamptz, payment_reference text, approved_by uuid references public.profiles
);
create table public.job_issues (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 category text not null, status public.issue_status not null default 'open', detail text not null,
 created_at timestamptz not null default now()
);
create table public.review_requests (
 id uuid primary key default gen_random_uuid(), job_id uuid unique not null references public.jobs,
 status public.review_status not null default 'scheduled', scheduled_at timestamptz not null
);
create table public.service_reminders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers,
 service_id uuid not null references public.services, status public.repeat_status not null default 'due_later', due_at timestamptz not null
);
create table public.job_costs (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs,
 category text not null, amount_cents integer not null, is_estimate boolean not null, source_reference text
);
create table public.communication_preferences (
 customer_id uuid not null references public.customers, purpose text not null, allowed boolean not null,
 recorded_at timestamptz not null default now(), primary key(customer_id,purpose)
);
create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(), deduplication_key text unique not null,
 template text not null, payload jsonb not null, scheduled_at timestamptz not null default now(),
 attempts integer not null default 0, status text not null default 'pending'
);
create table public.webhook_events (
 provider text not null, event_id text not null, event_type text not null,
 payload jsonb not null, status text not null default 'pending' check(status in ('pending','processed','failed')),
 received_at timestamptz not null default now(), primary key(provider,event_id)
);
create table public.audit_events (
 id uuid primary key default gen_random_uuid(), actor uuid, action text not null,
 record_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table private.guest_tokens (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'), booking_id uuid not null references public.bookings,
 expires_at timestamptz not null, consumed_at timestamptz, revoked_at timestamptz
);
create table private.guest_sessions (
 session_hash text primary key check(session_hash ~ '^[a-f0-9]{64}$'),
 token_hash text not null references private.guest_tokens, booking_id uuid not null references public.bookings,
 expires_at timestamptz not null, revoked_at timestamptz
);

-- No direct end-user writes. Narrow server-checked RPCs are introduced in migration 002.
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='public' loop
  execute format('alter table public.%I enable row level security',t.tablename);
  execute format('revoke all on public.%I from anon, authenticated',t.tablename);
  execute format('grant all on public.%I to service_role',t.tablename);
 end loop;
end $$;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
-- Role provisioning is operator-only; no role is trusted from user-editable metadata.
commit;
