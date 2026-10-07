create table public.organization_branding (
  organization_id uuid primary key references public.organizations(id),
  display_name text not null check (length(display_name) between 2 and 80),
  signature text not null default 'by' check (signature in ('by','network')),
  primary_color text not null check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text not null check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now()
);
alter table public.organization_branding enable row level security;
alter table public.organization_branding force row level security;
create policy brand_read on public.organization_branding for select to authenticated
using (organization_id = public.current_organization_id());
create policy brand_manage on public.organization_branding for all to authenticated
using (organization_id = public.current_organization_id() and exists(select 1 from public.profiles where id = auth.uid() and active and role in ('owner','admin')))
with check (organization_id = public.current_organization_id() and exists(select 1 from public.profiles where id = auth.uid() and active and role in ('owner','admin')));
insert into public.organization_branding(organization_id,display_name,signature,primary_color,secondary_color,background_color)
select id,'LUX DOG','by','#7C3AED','#0891B2','#F3EEFA' from public.organizations
where id='d0000000-0000-4000-8000-000000000001';
