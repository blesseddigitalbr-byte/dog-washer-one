-- Additive staging only: no writes to clients, pets, packages or financial ledgers.
create table public.import_review_rows (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 unit_id uuid not null references public.units(id),
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 source_sheet text not null,
 source_row integer not null check(source_row > 0),
 original_values jsonb not null check(jsonb_typeof(original_values)='object'),
 adjustments jsonb not null default '{}' check(jsonb_typeof(adjustments)='object'),
 issues jsonb not null default '[]' check(jsonb_typeof(issues)='array'),
 version integer not null default 0,
 created_at timestamptz not null default now(),
 unique(organization_id,unit_id,source_sha256,source_sheet,source_row)
);
create index import_review_unit_idx on public.import_review_rows(organization_id,unit_id,source_sheet,source_row);
create table public.import_review_audit (
 id uuid primary key default gen_random_uuid(),
 row_id uuid not null references public.import_review_rows(id),
 actor_id uuid not null references public.profiles(id),
 field text not null,
 previous_value jsonb,
 new_value jsonb not null,
 reason text not null check(length(trim(reason)) between 10 and 1000),
 version integer not null,
 created_at timestamptz not null default now(),
 unique(row_id,version)
);
alter table public.import_review_rows enable row level security;
alter table public.import_review_audit enable row level security;
revoke all on public.import_review_rows,public.import_review_audit from public,anon,authenticated,service_role;
grant select,insert on public.import_review_rows to service_role;
grant update(adjustments,version) on public.import_review_rows to service_role;
grant select,insert on public.import_review_audit to service_role;
create function public.adjust_import_review(p_actor uuid,p_row uuid,p_version integer,p_field text,p_value text,p_reason text)
returns integer language plpgsql security invoker set search_path='' as $$
declare r public.import_review_rows; next_version integer;
begin
 select * into r from public.import_review_rows where id=p_row for update;
 if not found or not exists(
  select 1 from public.profiles p join public.user_unit_access a on a.user_id=p.id
  join public.units u on u.id=a.unit_id
  where p.id=p_actor and p.active and p.role in ('owner','admin')
  and p.organization_id=r.organization_id and a.organization_id=r.organization_id
  and a.unit_id=r.unit_id and u.organization_id=r.organization_id and u.is_active
 ) then raise exception 'Import review access denied' using errcode='42501'; end if;
 if r.version<>p_version then raise exception 'Review changed; reload' using errcode='40001'; end if;
 if not (r.original_values ? p_field) or p_value is null or length(p_value)>2000
 or length(trim(p_reason)) not between 10 and 1000 then raise exception 'Invalid adjustment' using errcode='22023'; end if;
 next_version:=r.version+1;
 insert into public.import_review_audit(row_id,actor_id,field,previous_value,new_value,reason,version)
 values(r.id,p_actor,p_field,coalesce(r.adjustments->p_field,r.original_values->p_field),to_jsonb(p_value),trim(p_reason),next_version);
 update public.import_review_rows set adjustments=jsonb_set(adjustments,array[p_field],to_jsonb(p_value)),version=next_version where id=r.id;
 return next_version;
end; $$;
revoke all on function public.adjust_import_review(uuid,uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.adjust_import_review(uuid,uuid,integer,text,text,text) to service_role;


