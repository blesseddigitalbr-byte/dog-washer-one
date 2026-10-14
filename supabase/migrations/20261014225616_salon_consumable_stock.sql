create table public.salon_supplies (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 unit_id uuid not null references public.units(id),
 sku text not null check(length(sku) between 1 and 40 and sku ~ '^[A-Z0-9._-]+$'),
 name text not null check(length(trim(name)) between 2 and 120),
 measure text not null check(measure in ('un','ml','g')),
 minimum_stock numeric(18,3) not null default 0 check(minimum_stock>=0 and minimum_stock<=1000000000),
 stock numeric(18,3) not null default 0 check(stock>=0 and stock<=1000000000000),
 version integer not null default 0 check(version>=0),
 is_active boolean not null default true,
 created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,unit_id,sku)
);
create index salon_supplies_scope on public.salon_supplies(organization_id,unit_id,name,id);
create table public.salon_supply_movements (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.salon_supplies(id),
 organization_id uuid not null references public.organizations(id),
 unit_id uuid not null references public.units(id),
 request_id uuid not null,
 kind text not null check(kind in ('purchase','consumption','loss')),
 quantity numeric(18,3) not null check(quantity>0 and quantity<=1000000000),
 purchase_cost_cents bigint,
 before_stock numeric(18,3) not null,
 after_stock numeric(18,3) not null check(after_stock>=0),
 reason text not null check(length(trim(reason)) between 3 and 1000),
 actor_id uuid not null references public.profiles(id),
 version integer not null,
 created_at timestamptz not null default now(),
 unique(product_id,request_id),
 unique(product_id,version),
 check((kind='purchase' and purchase_cost_cents between 0 and 1000000000000) or (kind<>'purchase' and purchase_cost_cents is null))
);
create index salon_supply_movements_scope on public.salon_supply_movements(organization_id,unit_id,product_id,created_at desc,id);
alter table public.salon_supplies enable row level security;
alter table public.salon_supply_movements enable row level security;
create policy supply_management_read on public.salon_supplies for select to authenticated
using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supply_management_create on public.salon_supplies for insert to authenticated
with check(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and created_by=(select auth.uid()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supply_management_update on public.salon_supplies for update to authenticated
using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'))
with check(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supply_movements_management_read on public.salon_supply_movements for select to authenticated
using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
revoke all on public.salon_supplies,public.salon_supply_movements from public,anon,authenticated;
grant select on public.salon_supplies,public.salon_supply_movements to authenticated;
grant insert(organization_id,unit_id,sku,name,measure,minimum_stock) on public.salon_supplies to authenticated;
grant update(name,minimum_stock,is_active,updated_at) on public.salon_supplies to authenticated;
create function private.move_salon_supply(p_product uuid,p_request uuid,p_version integer,p_kind text,p_quantity numeric,p_cost bigint,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare product public.salon_supplies; prior public.salon_supply_movements; actor public.profiles; next_stock numeric; v integer;
begin
 select * into actor from public.profiles where id=auth.uid() and active;
 if actor.id is null or actor.role not in ('owner','admin','manager') or not exists(
 select 1 from public.user_unit_access a join public.units u on u.id=a.unit_id where a.user_id=actor.id and a.organization_id=actor.organization_id and a.unit_id=actor.unit_id and u.organization_id=actor.organization_id and u.is_active
 ) then raise exception 'Supply access denied' using errcode='42501'; end if;
 select * into product from public.salon_supplies where id=p_product and organization_id=actor.organization_id and unit_id=actor.unit_id for update;
 if product.id is null then raise exception 'Supply not found' using errcode='42501'; end if;
 if p_request is null or p_version is null or p_kind is null or p_kind not in ('purchase','consumption','loss') or p_quantity is null or p_quantity<=0 or p_quantity>1000000000 or p_quantity<>round(p_quantity,3) or p_reason is null or length(trim(p_reason)) not between 3 and 1000 then raise exception 'Invalid movement' using errcode='22023'; end if;
 if (p_kind='purchase' and (p_cost is null or p_cost<0 or p_cost>1000000000000)) or (p_kind<>'purchase' and p_cost is not null) then raise exception 'Invalid purchase cost' using errcode='22023'; end if;
 select * into prior from public.salon_supply_movements where product_id=p_product and request_id=p_request;
 if prior.id is not null then
  if prior.actor_id<>actor.id or prior.kind<>p_kind or prior.quantity<>p_quantity or prior.purchase_cost_cents is distinct from p_cost or prior.reason<>trim(p_reason) then raise exception 'Request already used' using errcode='40001'; end if;
  return jsonb_build_object('version',prior.version,'stock',prior.after_stock,'replayed',true);
 end if;
 if not product.is_active then raise exception 'Supply inactive' using errcode='22023'; end if;
 if product.version<>p_version then raise exception 'Stock changed; reload' using errcode='40001'; end if;
 next_stock:=product.stock+case when p_kind='purchase' then p_quantity else -p_quantity end;
 if next_stock<0 or next_stock>1000000000000 then raise exception 'Insufficient or excessive stock' using errcode='22023'; end if;
 v:=product.version+1;
 insert into public.salon_supply_movements(product_id,organization_id,unit_id,request_id,kind,quantity,purchase_cost_cents,before_stock,after_stock,reason,actor_id,version)
 values(product.id,product.organization_id,product.unit_id,p_request,p_kind,p_quantity,p_cost,product.stock,next_stock,trim(p_reason),actor.id,v);
 update public.salon_supplies set stock=next_stock,version=v,updated_at=now() where id=product.id;
 return jsonb_build_object('version',v,'stock',next_stock,'replayed',false);
end; $$;
revoke all on function private.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text) to authenticated;
create function public.move_salon_supply(p_product uuid,p_request uuid,p_version integer,p_kind text,p_quantity numeric,p_cost bigint,p_reason text)
returns jsonb language sql security invoker set search_path='' as $$ select private.move_salon_supply(p_product,p_request,p_version,p_kind,p_quantity,p_cost,p_reason); $$;
revoke all on function public.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text) from public,anon;
grant execute on function public.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text) to authenticated;
