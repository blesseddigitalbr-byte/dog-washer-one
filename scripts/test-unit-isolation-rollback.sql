begin;
-- Disposable users exist only inside this rollback transaction. No real profile is edited.
insert into auth.users(id,aud,role,email) values
('f1000000-0000-4000-8000-000000000001','authenticated','authenticated','unit-test-a@example.invalid'),
('f1000000-0000-4000-8000-000000000002','authenticated','authenticated','unit-test-b@example.invalid'),
('f1000000-0000-4000-8000-000000000003','authenticated','authenticated','unit-test-staff@example.invalid');
insert into public.profiles(id,role,organization_id,unit_id,active) values
('f1000000-0000-4000-8000-000000000001','owner','d0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003',true),
('f1000000-0000-4000-8000-000000000002','owner','d0000000-0000-4000-8000-000000000001','40bd21aa-2415-46f4-9731-d7d4bf01b014',true),
('f1000000-0000-4000-8000-000000000003','staff','d0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003',true)
on conflict(id) do update set role=excluded.role,organization_id=excluded.organization_id,unit_id=excluded.unit_id,active=true;
insert into public.user_unit_access(user_id,organization_id,unit_id,access_role,active)
select id,organization_id,unit_id,role,true from public.profiles where id in ('f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000003')
on conflict(user_id,unit_id) do update set active=true;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare n integer; x uuid; t text; own_id uuid; other_id uuid; matched integer;
begin
  for n in 1..2 loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub','f1000000-0000-4000-8000-00000000000'||n,'role','authenticated')::text,true);
    x:=('f2000000-0000-4000-8000-00000000000'||n)::uuid;
    insert into public.clientes(id,id_cliente,nome) values(x,'UNIT-TEST-'||n,'Disposable test');
    insert into public.pets(id,id_pet,client_id,name) values(x,'UNIT-TEST-'||n,x,'Disposable pet');
    insert into public.services(id,name) values(x,'Disposable service');
    insert into public.professionals(id,name) values(x,'Disposable professional');
    insert into public.students(id,name) values(x,'Disposable student');
    insert into public.packages(id,name,code,audience_code,duration_months) values(x,'Disposable plan','UNIT-TEST-'||n,'TEST',1);
    insert into public.appointments(id,client_id,pet_id,service_id,professional_id,appointment_date,duration_minutes)
      values(x,x,x,x,x,'2026-12-01T12:00:00Z',60);
    insert into public.client_packages(id,organization_id,unit_id,client_id,pet_id,package_id,code,contracted_baths,contracted_groomings,balance_baths,balance_groomings,price,contract_date)
      values(x,public.current_organization_id(),public.current_unit_id(),x,x,x,'UNIT-TEST-'||n,4,0,4,0,100,'2026-10-15');
  end loop;
  for n in 1..2 loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub','f1000000-0000-4000-8000-00000000000'||n,'role','authenticated')::text,true);
    own_id:=('f2000000-0000-4000-8000-00000000000'||n)::uuid;
    other_id:=('f2000000-0000-4000-8000-00000000000'||(3-n))::uuid;
    foreach t in array array['clientes','pets','services','professionals','students','packages','appointments','client_packages'] loop
      execute format('select count(*) from public.%I where id=$1',t) into matched using own_id;
      if matched<>1 then raise exception 'Missing positive control % direction %',t,n; end if;
      execute format('select count(*) from public.%I where id=$1',t) into matched using other_id;
      if matched<>0 then raise exception 'Cross-unit read % direction %',t,n; end if;
    end loop;
    update public.clientes set nome='must-not-change' where id=other_id;
    get diagnostics matched=row_count;
    if matched<>0 then raise exception 'Cross-unit update permitted'; end if;
    delete from public.pets where id=other_id;
    get diagnostics matched=row_count;
    if matched<>0 then raise exception 'Cross-unit delete permitted'; end if;
    begin
      insert into public.pets(id_pet,client_id,name) values('BAD-UNIT-'||n,other_id,'Rejected cross-unit link');
      raise exception 'Cross-unit parent accepted';
    exception when insufficient_privilege then null; end;
    begin
      update public.client_packages set package_id=other_id where id=own_id;
      raise exception 'Cross-unit plan accepted';
    exception when insufficient_privilege then null; end;
  end loop;
  perform set_config('request.jwt.claims','{"sub":"f1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
  foreach t in array array['packages','services','professionals'] loop
    execute format('update public.%I set name=name where id=$1',t) using 'f2000000-0000-4000-8000-000000000001'::uuid;
    get diagnostics matched=row_count;
    if matched<>0 then raise exception 'Staff management update permitted %',t; end if;
    execute format('delete from public.%I where id=$1',t) using 'f2000000-0000-4000-8000-000000000001'::uuid;
    get diagnostics matched=row_count;
    if matched<>0 then raise exception 'Staff management delete permitted %',t; end if;
  end loop;
  begin
    insert into public.packages(name,code,audience_code,duration_months) values('Rejected','STAFF-TEST','TEST',1);
    raise exception 'Staff plan insert permitted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.client_packages(organization_id,unit_id,client_id,pet_id,code,contracted_baths,contracted_groomings,balance_baths,balance_groomings,price,contract_date)
    values(public.current_organization_id(),public.current_unit_id(),'f2000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','STAFF-TEST',4,0,4,0,0,'2026-10-15');
    raise exception 'Staff contract insert permitted';
  exception when insufficient_privilege then null; end;
  update public.client_packages set price=0 where id='f2000000-0000-4000-8000-000000000001';
  get diagnostics matched=row_count;
  if matched<>0 then raise exception 'Staff contract adjustment permitted'; end if;
end $$;
reset role;
select 'PASS: rollback fixtures; same-organization Lux/school bidirectional reads (8 tables), cross-unit update/delete/link denial; staff management writes denied' as result;

-- Pure local ledger fixtures, never a provider call.
insert into public.payment_provider_accounts(id,organization_id,legal_entity_id,provider,environment,secret_reference,status)
select p.id,p.organization_id,u.legal_entity_id,'asaas','sandbox','UNIT_TEST_NOT_A_SECRET','pending'
from public.profiles p join public.units u on u.id=p.unit_id where p.id in ('f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002') on conflict (legal_entity_id,provider,environment) do nothing;
insert into public.billing_drafts(id,organization_id,unit_id,client_id,amount_cents,billing_type,due_date,description,status,created_by,account_id,provider_payment_id)
select p.id,p.organization_id,p.unit_id,
case when p.id='f1000000-0000-4000-8000-000000000001'::uuid then 'f2000000-0000-4000-8000-000000000001'::uuid else 'f2000000-0000-4000-8000-000000000002'::uuid end,
100,'PIX','2026-12-01','Disposable fixture','issued',p.id,(select a.id from public.payment_provider_accounts a join public.units u on u.legal_entity_id=a.legal_entity_id where u.id=p.unit_id and a.provider='asaas' and a.environment='sandbox'),'unit-test-'||p.id
from public.profiles p where p.id in ('f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002');
insert into public.asaas_payments(id,organization_id,account_id,external_id,status,value)
select id,organization_id,account_id,provider_payment_id,'PENDING',1 from public.billing_drafts where id in ('f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002');
insert into public.asaas_webhook_events(id,organization_id,account_id,event_id,event_type,payment_id,processing_status)
select id,organization_id,account_id,'unit-test-event-'||id,'PAYMENT_CREATED',provider_payment_id,'processed' from public.billing_drafts where id in ('f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002');
set local role authenticated;
do $$
declare n integer; t text; own_id uuid; other_id uuid; matched integer;
begin
for n in 1..2 loop
 perform set_config('request.jwt.claims',jsonb_build_object('sub','f1000000-0000-4000-8000-00000000000'||n,'role','authenticated')::text,true);
 own_id:=('f1000000-0000-4000-8000-00000000000'||n)::uuid; other_id:=('f1000000-0000-4000-8000-00000000000'||(3-n))::uuid;
 foreach t in array array['asaas_payments','asaas_webhook_events'] loop
  execute format('select count(*) from public.%I where id=$1',t) into matched using own_id;
  if matched<>1 then raise exception 'Financial positive control missing % direction %',t,n; end if;
  execute format('select count(*) from public.%I where id=$1',t) into matched using other_id;
  if matched<>0 then raise exception 'Financial cross-unit read % direction %',t,n; end if;
 end loop;
end loop;
perform set_config('request.jwt.claims','{"sub":"f1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
foreach t in array array['asaas_payments','asaas_webhook_events'] loop
 execute format('select count(*) from public.%I where id=$1',t) into matched using 'f1000000-0000-4000-8000-000000000001'::uuid;
 if matched<>0 then raise exception 'Staff financial read %',t; end if;
end loop;
end $$;
reset role;
update public.user_unit_access set active=false where user_id='f1000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
begin
 if exists(select 1 from public.clientes where id='f2000000-0000-4000-8000-000000000001') then
   raise exception 'Revoked unit access still reads clients';
 end if;
 if exists(select 1 from public.asaas_payments where id='f1000000-0000-4000-8000-000000000001') then
   raise exception 'Revoked unit access still reads payments';
 end if;
end $$;
reset role;
select 'PASS: same-organization financial read both directions, positive controls and staff denial; no Asaas calls' as result;
rollback;
