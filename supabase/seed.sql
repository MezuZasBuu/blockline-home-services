-- Development seed only. Intentionally no published price, users, credentials, or live customers.
insert into public.services(id,slug,name,active)
values('10000000-0000-4000-8000-000000000001','dryer-vent-cleaning','Dryer vent cleaning',false)
on conflict(id) do nothing;
insert into public.service_config_versions(id,service_id,version,effective_at,settings)
values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,'2026-01-01T00:00:00Z',
'{"note":"Unconfigured draft. Owner must supply all launch terms before publication."}')
on conflict(id) do nothing;
