create table public.user_access_audit (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 actor_id uuid not null,
 target_user_id uuid not null,
 action text not null check (action='provision_access'),
 assigned_role text not null,
 unit_ids uuid[] not null,
 created_at timestamptz not null default now()
);
alter table public.user_access_audit enable row level security;
alter table public.user_access_audit force row level security;
revoke all on public.user_access_audit from anon, authenticated;
grant select on public.user_access_audit to authenticated;
grant all on public.user_access_audit to service_role;
create policy administrators_read_access_audit on public.user_access_audit for select to authenticated
 using (organization_id=public.current_organization_id() and public.current_profile_role() in ('owner','admin'));

create function public.provision_dwo_user_access(p_actor uuid,p_user uuid,p_name text,p_role text,p_units uuid[],p_default_unit uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare actor public.profiles; target public.profiles; selected_count integer;
begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 select * into actor from public.profiles where id=p_actor and active for update;
 if actor.organization_id is null or actor.role not in ('owner','admin') then raise exception 'Administrator required'; end if;
 if p_role not in ('admin','manager','staff') or (p_role='admin' and actor.role<>'owner') then raise exception 'Role escalation denied'; end if;
 if p_user=p_actor or p_name is null or length(trim(p_name)) not between 2 and 120 then raise exception 'Invalid user'; end if;
 if p_units is null or cardinality(p_units) not between 1 and 50 or p_default_unit is null or not(p_default_unit=any(p_units)) then raise exception 'Invalid units'; end if;
 select count(distinct id) into selected_count from public.units u where u.id=any(p_units)
   and u.organization_id=actor.organization_id and u.is_active
   and exists(select 1 from public.user_unit_access a where a.user_id=actor.id and a.unit_id=u.id and a.organization_id=actor.organization_id and a.active);
 if selected_count<>cardinality(p_units) then raise exception 'Unit access denied'; end if;
 select * into target from public.profiles where id=p_user for update;
 if target.id is null or target.organization_id is not null or target.unit_id is not null
   or exists(select 1 from public.user_unit_access where user_id=p_user) then raise exception 'Existing account cannot be reassigned'; end if;
 update public.profiles set full_name=trim(p_name),display_name=trim(p_name),organization_id=actor.organization_id,
   unit_id=p_default_unit,role=p_role,active=true where id=p_user;
 insert into public.user_unit_access(user_id,organization_id,unit_id,access_role,is_default,active)
 select p_user,actor.organization_id,u,p_role,u=p_default_unit,true from unnest(p_units) u;
 insert into public.user_access_audit(organization_id,actor_id,target_user_id,action,assigned_role,unit_ids)
 values(actor.organization_id,p_actor,p_user,'provision_access',p_role,p_units);
 return p_user;
end $$;
revoke all on function public.provision_dwo_user_access(uuid,uuid,text,text,uuid[],uuid) from public,anon,authenticated;
grant execute on function public.provision_dwo_user_access(uuid,uuid,text,text,uuid[],uuid) to service_role;
