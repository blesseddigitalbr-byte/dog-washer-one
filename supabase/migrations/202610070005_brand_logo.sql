alter table public.organization_branding add column logo_path text;
update public.organization_branding set logo_path='/brand/lux-dog.png'
where organization_id='d0000000-0000-4000-8000-000000000001';
