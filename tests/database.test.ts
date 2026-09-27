import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ids,settings } from './fixtures';

let db:PGlite;
async function actor(id:string,aal='aal2') {
 await db.exec('set local role authenticated');
 await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:id,aal})]);
}
async function owner(){await db.exec('reset role');}
async function denied(sql:string,params:unknown[]=[],message?:RegExp) {
 await db.exec('savepoint denied');
 try { await expect(db.query(sql,params)).rejects.toThrow(message); }
 finally { await db.exec('rollback to savepoint denied'); }
}
async function compliant() {
 await db.query(`insert into public.contractor_compliance(contractor_id,requirement_key,status,valid_from,valid_until,verified_at,verified_by,document_id)
 values($1,'general_liability','verified',now()-interval '1 day',now()+interval '10 days',now(),$2,$3)`,[ids.contractor,ids.admin,ids.document]);
}
async function offered() {
 await db.query(`insert into public.job_assignments(id,job_id,contractor_id,payout_cents,offered_until)
 values($1,$2,$3,8300,now()+interval '1 day')`,[ids.assignment,ids.job,ids.contractor]);
}
async function projection() {
 const r=await db.query<{value:Record<string,unknown>}>('select public.contractor_assignment($1) as value',[ids.assignment]);
 return r.rows[0].value;
}

beforeAll(async()=>{
 db=new PGlite();
 // Supabase Auth/roles are platform-owned; this harness supplies only their identity contract.
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
 grant usage on schema auth to authenticated,anon,service_role;
 grant execute on all functions in schema auth to authenticated,anon,service_role;`);
 for(const file of readdirSync(resolve('supabase/migrations')).sort()) await db.exec(readFileSync(resolve('supabase/migrations',file),'utf8'));
 await db.exec(readFileSync(resolve('supabase/seed.sql'),'utf8'));
},30000);
beforeEach(async()=>{
 await db.exec('begin');
 for(const [id,role] of [[ids.admin,'admin'],[ids.dispatcher,'dispatcher'],[ids.contractorUser,'contractor'],[ids.otherUser,'contractor']]) {
  await db.query('insert into auth.users(id) values($1)',[id]);
  await db.query('insert into public.profiles(id,role) values($1,$2)',[id,role]);
 }
 await db.query(`insert into public.service_config_versions(id,service_id,version,state,effective_at,settings,published_at)
 values($1,$2,2,'published',now()-interval '1 day',$3,now())`,[ids.config,ids.service,settings]);
 await db.query('insert into public.customers(id,name,email,phone) values($1,$2,$3,$4)',[ids.customer,'Synthetic Customer','fixture@example.invalid','215-555-0100']);
 await db.query('insert into public.properties(id,customer_id,address,zip) values($1,$2,$3,$4)',[ids.property,ids.customer,'123 Test Address','19103']);
 await db.query(`insert into public.bookings(id,customer_id,property_id,config_version_id,terms_snapshot,agreed_total_cents,accepted_terms_at)
 values($1,$2,$3,$4,'{}',17700,now())`,[ids.booking,ids.customer,ids.property,ids.config]);
 await db.query(`insert into public.jobs(id,booking_id,window_start,window_end,condition_codes)
 values($1,$2,now()+interval '2 days',now()+interval '2 days 2 hours',array['stacked'])`,[ids.job,ids.booking]);
 await db.query(`insert into public.contractors(id,profile_id,business_name,status,zip_codes,service_ids)
 values($1,$2,'Synthetic Contractor','active',array['19103'],array[$3]::uuid[])`,[ids.contractor,ids.contractorUser,ids.service]);
 await db.query(`insert into public.contractor_documents(id,contractor_id,kind,storage_key) values($1,$2,'general_liability','test/nonexistent.pdf')`,[ids.document,ids.contractor]);
});
afterEach(async()=>{await db.exec('rollback');});
afterAll(async()=>{await db.close();});

describe('database authorization and immutable terms',()=>{
 it('rejects malformed required compliance and null economics through direct RPC publication',async()=>{
  await actor(ids.admin);
  for(const s of [{...settings,complianceRequirements:[{key:'general_liability',label:'GL'}]}, {...settings,maxVentLengthFeet:null}]) {
   const r=await db.query<{id:string}>('select public.create_configuration($1,now()+random()*interval \'2 days\',$2) as id',[ids.service,s]);
   await denied('select public.publish_configuration($1)',[r.rows[0].id],/configuration|Configuration|compliance/);
  }
 });
 it('runs all migrations and denies anonymous business-table access',async()=>{
  await db.exec('set local role anon');
  await denied('select * from public.customers',[],/permission denied/);
  await denied('select * from public.bookings',[],/permission denied/);
  await denied('select public.admin_configurations()',[],/permission denied/);
  await denied('select public.issue_guest_token($1,$2)',[ids.booking,'a'.repeat(64)],/permission denied/);
 });
 it('does not allow self-promotion or another profile read',async()=>{
  await actor(ids.contractorUser);
  const profiles=await db.query('select * from public.profiles'); expect(profiles.rows).toHaveLength(1);
  await denied("update public.profiles set role='admin'",[],/permission denied/);
  await denied('select public.admin_configurations()',[],/Forbidden/);
 });
 it('requires active admin plus MFA for config administration',async()=>{
  await actor(ids.admin,'aal1'); await denied('select public.admin_configurations()',[],/Forbidden/);
  await actor(ids.dispatcher); await denied('select public.admin_configurations()',[],/Forbidden/);
  await actor(ids.admin); expect((await db.query('select public.admin_configurations()')).rows).toHaveLength(2);
  await owner(); await db.query('update public.profiles set active=false where id=$1',[ids.admin]);
  await actor(ids.admin); await denied('select public.admin_configurations()',[],/Forbidden/);
 });
 it('creates drafts, refuses incomplete publication, and protects published versions',async()=>{
  await actor(ids.admin);
  const r=await db.query<{id:string}>('select public.create_configuration($1,now()+interval \'1 day\',$2) as id',[ids.service,settings]);
  await db.query('select public.publish_configuration($1)',[r.rows[0].id]);
  await denied('select public.publish_configuration($1)',['20000000-0000-4000-8000-000000000001'],/Incomplete/);
  await owner(); await denied("update public.service_config_versions set settings='{}' where id=$1",[ids.config],/immutable/);
  await denied('delete from public.service_config_versions where id=$1',[ids.config],/immutable/);
 });
 it('snapshots terms and prevents changing historical price/configuration',async()=>{
  const r=await db.query<{terms_snapshot:typeof settings}>('select terms_snapshot from public.bookings where id=$1',[ids.booking]);
  expect(r.rows[0].terms_snapshot.customerPriceCents).toBe(17700);
  await denied('update public.bookings set agreed_total_cents=1 where id=$1',[ids.booking],/immutable/);
  await denied("update public.bookings set terms_snapshot='{}' where id=$1",[ids.booking],/immutable/);
 });
});

describe('compliance and progressive contractor access',()=>{
 it('prevents conflicting accepted appointments and acceptance of expired offers',async()=>{
  await compliant(); await offered(); await actor(ids.contractorUser);
  await db.query('select public.accept_assignment($1)',[ids.assignment]);await owner();
  const secondJob='70000000-0000-4000-8000-000000000002';
  const secondOffer='a0000000-0000-4000-8000-000000000002';
  await db.query(`insert into public.jobs(id,booking_id,original_job_id,window_start,window_end) values($1,$2,$3,now()+interval '2 days',now()+interval '2 days 1 hour')`,[secondJob,ids.booking,ids.job]);
  await db.query(`insert into public.job_assignments(id,job_id,contractor_id,payout_cents,offered_until) values($1,$2,$3,8300,now()+interval '1 day')`,[secondOffer,secondJob,ids.contractor]);
  await actor(ids.contractorUser); await denied('select public.accept_assignment($1)',[secondOffer],/Conflicting/);
  await owner();await db.query("update public.job_assignments set offered_until=now()-interval '1 second' where id=$1",[secondOffer]);
  await actor(ids.contractorUser);await denied('select public.accept_assignment($1)',[secondOffer],/unavailable/);
 });
 it('removes identity after access expiry and assignment release',async()=>{
  await compliant();await offered();await actor(ids.contractorUser);await db.query('select public.accept_assignment($1)',[ids.assignment]);
  await actor(ids.admin);await db.query('select public.confirm_assignment($1)',[ids.assignment]);
  await owner();await db.query("update public.job_assignments set access_until=now()-interval '1 second' where id=$1",[ids.assignment]);
  await actor(ids.contractorUser);expect(await projection()).not.toHaveProperty('phone');
  await owner();await db.query("update public.job_assignments set status='released',access_until=now()+interval '1 day' where id=$1",[ids.assignment]);
  await actor(ids.contractorUser);expect(await projection()).not.toHaveProperty('address');
 });
 it('blocks inactive contractor accounts and explicit unavailability',async()=>{
  await compliant();
  await db.query('update public.profiles set active=false where id=$1',[ids.contractorUser]);
  await denied("select public.offer_assignment($1,$2,8300,now()+interval '1 day')",[ids.job,ids.contractor],/Forbidden/);
  await actor(ids.admin);
  await denied("select public.offer_assignment($1,$2,8300,now()+interval '1 day')",[ids.job,ids.contractor],/account/);
  await owner();await db.query('update public.profiles set active=true where id=$1',[ids.contractorUser]);
  await db.query("insert into public.contractor_availability(contractor_id,starts_at,ends_at,available) values($1,now()+interval '1 day',now()+interval '3 days',false)",[ids.contractor]);
  await actor(ids.admin);
  await denied("select public.offer_assignment($1,$2,8300,now()+interval '1 day')",[ids.job,ids.contractor],/unavailable/);
 });
 it('applies newly effective compliance policies to already offered work',async()=>{
  await compliant(); await offered();
  await db.query(`insert into public.service_config_versions(service_id,version,state,effective_at,settings,published_at)
    values($1,3,'published',now()-interval '1 hour',$2,now())`,[ids.service,{...settings,complianceRequirements:[...settings.complianceRequirements,{key:'registration',label:'Registration',required:true}]}]);
  await actor(ids.contractorUser); await denied('select public.accept_assignment($1)',[ids.assignment],/registration/);
 });
 it('blocks assignment even through direct SQL when compliance is absent',async()=>{
  await denied(`insert into public.job_assignments(job_id,contractor_id,payout_cents,offered_until) values($1,$2,8300,now()+interval '1 day')`,[ids.job,ids.contractor],/compliance/);
 });
 it('blocks insurance expiring before appointment completion',async()=>{
  await compliant(); await db.exec("update public.contractor_compliance set valid_until=now()+interval '1 day'");
  await actor(ids.dispatcher);
  await denied("select public.offer_assignment($1,$2,8300,now()+interval '1 day')",[ids.job,ids.contractor],/expired/);
 });
 it('rechecks compliance at acceptance',async()=>{
  await compliant(); await offered(); await db.exec("update public.contractor_compliance set status='rejected'");
  await actor(ids.contractorUser); await denied('select public.accept_assignment($1)',[ids.assignment],/compliance/);
 });
 it('does not disclose identity until acceptance AND staff confirmation; removes it at completion',async()=>{
  await compliant(); await offered(); await actor(ids.contractorUser);
  const pre=await projection(); expect(Object.keys(pre).sort()).toEqual(['id','status','service','zip','windowStart','windowEnd','scope','conditionCodes','payoutCents'].sort());
  await denied('select * from public.customers',[],/permission denied/);
  await denied('select public.confirm_assignment($1)',[ids.assignment],/Forbidden/);
  await db.query('select public.accept_assignment($1)',[ids.assignment]); expect(await projection()).not.toHaveProperty('address');
  await actor(ids.dispatcher); await db.query('select public.confirm_assignment($1)',[ids.assignment]);
  await actor(ids.contractorUser); expect(await projection()).toHaveProperty('address','123 Test Address');
  await owner(); await db.query("update public.jobs set status='completed' where id=$1",[ids.job]);
  await actor(ids.contractorUser); expect(await projection()).not.toHaveProperty('address');
 });
 it('denies another contractor and removes identity for suspended contractors',async()=>{
  await compliant(); await offered(); await actor(ids.otherUser);
  await denied('select public.contractor_assignment($1)',[ids.assignment],/unavailable/);
  await actor(ids.contractorUser); await db.query('select public.accept_assignment($1)',[ids.assignment]);
  await actor(ids.admin); await db.query('select public.confirm_assignment($1)',[ids.assignment]);
  await owner(); await db.exec("update public.contractors set status='suspended'");
  await actor(ids.contractorUser); expect(await projection()).not.toHaveProperty('customerName');
 });
 it('rechecks compliance when appointment is rescheduled beyond coverage',async()=>{
  await compliant(); await offered();
  await denied("update public.jobs set window_start=now()+interval '11 days',window_end=now()+interval '12 days' where id=$1",[ids.job],/expired/);
 });
});

describe('guest capabilities',()=>{
 it('rejects expired sessions independently of link expiry',async()=>{
  await db.query('select public.issue_guest_token($1,$2)',[ids.booking,'e'.repeat(64)]);
  await db.query('select public.exchange_guest_token($1,$2)',['e'.repeat(64),'f'.repeat(64)]);
  await db.exec("update private.guest_sessions set expires_at=now()-interval '1 second'");
  await denied('select public.guest_appointment($1)',['f'.repeat(64)],/invalid/);
 });
 it('allows guest booking without an auth user and exchanges only once',async()=>{
  const c=await db.query<{profile_id:string|null}>('select profile_id from public.customers where id=$1',[ids.customer]); expect(c.rows[0].profile_id).toBeNull();
  await db.exec('set local role service_role');
  await db.query('select public.issue_guest_token($1,$2)',[ids.booking,'a'.repeat(64)]);
  await db.query('select public.exchange_guest_token($1,$2)',['a'.repeat(64),'b'.repeat(64)]);
  await denied('select public.exchange_guest_token($1,$2)',['a'.repeat(64),'c'.repeat(64)],/invalid/);
  const r=await db.query<{value:{bookingId:string}}>('select public.guest_appointment($1) as value',['b'.repeat(64)]);
  expect(r.rows[0].value.bookingId).toBe(ids.booking);
  await denied('select public.guest_appointment($1)',['c'.repeat(64)],/invalid/);
 });
 it('rejects expired links and revokes existing sessions',async()=>{
  await db.query('select public.issue_guest_token($1,$2)',[ids.booking,'a'.repeat(64)]);
  await db.exec("update private.guest_tokens set expires_at=now()-interval '1 second'");
  await denied('select public.exchange_guest_token($1,$2)',['a'.repeat(64),'b'.repeat(64)],/invalid/);
  await db.query('select public.issue_guest_token($1,$2)',[ids.booking,'c'.repeat(64)]);
  await db.query('select public.exchange_guest_token($1,$2)',['c'.repeat(64),'d'.repeat(64)]);
  await db.query('select public.revoke_guest_access($1)',[ids.booking]);
  await denied('select public.guest_appointment($1)',['d'.repeat(64)],/invalid/);
 });
 it('does not grant authenticated users capability minting or raw token access',async()=>{
  await actor(ids.admin);
  await denied('select * from private.guest_tokens',[],/permission denied/);
  await denied('select public.issue_guest_token($1,$2)',[ids.booking,'a'.repeat(64)],/permission denied/);
 });
});

it('keeps payment, payout, issue, review and repeat states independent of job status',async()=>{
 await compliant();await offered();
 await db.query('insert into public.contractor_payouts(assignment_id,amount_cents) values($1,8300)',[ids.assignment]);
 await db.query(`insert into public.customer_payments(booking_id,status,amount_cents,idempotency_key) values($1,'due',17700,'test-payment')`,[ids.booking]);
 await db.query(`insert into public.job_issues(job_id,category,detail) values($1,'callback','Test issue')`,[ids.job]);
 await db.query(`insert into public.review_requests(job_id,scheduled_at) values($1,now())`,[ids.job]);
 await db.query(`insert into public.service_reminders(customer_id,service_id,due_at) values($1,$2,now()+interval '1 year')`,[ids.customer,ids.service]);
 await db.query("update public.customer_payments set status='paid'");
 expect((await db.query<{status:string}>('select status from public.jobs')).rows[0].status).toBe('awaiting_assignment');
 expect((await db.query<{status:string}>('select status from public.job_issues')).rows[0].status).toBe('open');
 expect((await db.query<{status:string}>('select status from public.review_requests')).rows[0].status).toBe('scheduled');
 expect((await db.query<{status:string}>('select status from public.service_reminders')).rows[0].status).toBe('due_later');
 expect((await db.query<{status:string}>('select status from public.contractor_payouts')).rows[0].status).toBe('pending_requirements');
});

it('deduplicates provider events and requires event evidence before method readiness',async()=>{
 await db.exec(`insert into public.webhook_events(provider,event_id,event_type,payload) values('stripe','evt_1','setup_intent.succeeded','{}') on conflict do nothing`);
 await db.exec(`insert into public.webhook_events(provider,event_id,event_type,payload) values('stripe','evt_1','setup_intent.succeeded','{}') on conflict do nothing`);
 expect((await db.query('select * from public.webhook_events')).rows).toHaveLength(1);
 await denied(`insert into public.payment_methods(booking_id,stripe_customer_id,status,consent_version,consent_at) values($1,'cus_test','ready','v1',now())`,[ids.booking],/check constraint/);
 await denied(`insert into public.payment_methods(booking_id,stripe_customer_id,stripe_payment_method_id,status,consent_version,consent_at,verified_event_id)
 values($1,'cus_test','pm_test','ready','v1',now(),'evt_missing')`,[ids.booking],/foreign key/);
});
