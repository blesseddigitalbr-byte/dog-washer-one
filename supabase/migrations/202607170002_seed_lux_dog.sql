insert into public.organizations (
  id,
  name,
  trading_name,
  description,
  status,
  is_active
)
values (
  'd0000000-0000-4000-8000-000000000001',
  'Lux Dog',
  'Lux Dog',
  'Primeira organização operacional do DWO — Dog Washer One',
  'active',
  true
)
on conflict (id) do nothing;

insert into public.legal_entities (
  id,
  organization_id,
  company_name,
  trading_name,
  status,
  is_active
)
values (
  'd0000000-0000-4000-8000-000000000002',
  'd0000000-0000-4000-8000-000000000001',
  'Lux Dog',
  'Lux Dog',
  'active',
  true
)
on conflict (id) do nothing;

insert into public.units (
  id,
  organization_id,
  legal_entity_id,
  name,
  code,
  unit_type,
  status,
  is_active
)
values (
  'd0000000-0000-4000-8000-000000000003',
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002',
  'Lux Dog - Principal',
  'LUX-DOG-01',
  'salon',
  'active',
  true
)
on conflict (id) do nothing;
