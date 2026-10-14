create table public.salon_suppliers(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),unit_id uuid not null references public.units(id),
 name text not null check(length(trim(name)) between 2 and 160),document text, email text,phone text,
 is_active boolean not null default true,created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(length(coalesce(document,''))<=30 and length(coalesce(email,''))<=254 and length(coalesce(phone,''))<=40)
);
create index salon_supplier_scope on public.salon_suppliers(organization_id,unit_id,name,id);
create unique index salon_supplier_document_unique on public.salon_suppliers(organization_id,unit_id,regexp_replace(upper(document),'[^A-Z0-9]','','g')) where document is not null and trim(document)<>'';
create table public.supplier_documents(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 unit_id uuid not null references public.units(id),supplier_id uuid not null references public.salon_suppliers(id),
 number text not null check(length(trim(number)) between 1 and 80),series text not null default '' check(length(series)<=20),
 issue_date date not null,total_cents bigint not null check(total_cents between 0 and 1000000000000),
 access_key text check(length(coalesce(access_key,''))<=100),notes text check(length(coalesce(notes,''))<=1000),
 created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now(),
 unique(organization_id,unit_id,supplier_id,number,series)
);
create index supplier_documents_scope on public.supplier_documents(organization_id,unit_id,issue_date desc,id);
create table public.supplier_document_payments(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 unit_id uuid not null references public.units(id),document_id uuid not null references public.supplier_documents(id),
 request_id uuid not null,amount_cents bigint not null check(amount_cents between 1 and 1000000000000),
 payment_date date not null,method text not null check(method in ('PIX','BOLETO','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','CASH','OTHER')),
 reference text not null check(length(trim(reference)) between 3 and 200),
 actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 unique(document_id,request_id)
);
create index supplier_payment_scope on public.supplier_document_payments(organization_id,unit_id,document_id,payment_date desc,id);
alter table public.salon_supply_movements add column purchase_document_id uuid references public.supplier_documents(id);
create index supply_purchase_document_idx on public.salon_supply_movements(purchase_document_id);
alter table public.salon_suppliers enable row level security;
alter table public.supplier_documents enable row level security;
alter table public.supplier_document_payments enable row level security;
create policy supplier_read on public.salon_suppliers for select to authenticated using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supplier_insert on public.salon_suppliers for insert to authenticated with check(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and created_by=(select auth.uid()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supplier_update on public.salon_suppliers for update to authenticated using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager')) with check(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supplier_document_read on public.supplier_documents for select to authenticated using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
create policy supplier_document_insert on public.supplier_documents for insert to authenticated with check(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and created_by=(select auth.uid()) and (select public.current_profile_role()) in ('owner','admin','manager') and exists(select 1 from public.salon_suppliers s where s.id=supplier_documents.supplier_id and s.organization_id=supplier_documents.organization_id and s.unit_id=supplier_documents.unit_id and s.is_active));
create policy supplier_payment_read on public.supplier_document_payments for select to authenticated using(organization_id=(select public.current_organization_id()) and unit_id=(select public.current_unit_id()) and (select public.current_profile_role()) in ('owner','admin','manager'));
revoke all on public.salon_suppliers,public.supplier_documents,public.supplier_document_payments from public,anon,authenticated;
grant select on public.salon_suppliers,public.supplier_documents,public.supplier_document_payments to authenticated;
grant insert(organization_id,unit_id,name,document,email,phone) on public.salon_suppliers to authenticated;
grant update(name,document,email,phone,is_active,updated_at) on public.salon_suppliers to authenticated;
grant insert(organization_id,unit_id,supplier_id,number,series,issue_date,total_cents,access_key,notes) on public.supplier_documents to authenticated;
create view public.supplier_document_summary with(security_invoker=true) as select d.*,
 coalesce((select sum(p.amount_cents) from public.supplier_document_payments p where p.document_id=d.id),0)::bigint as paid_cents,
 coalesce((select sum(m.purchase_cost_cents) from public.salon_supply_movements m where m.purchase_document_id=d.id),0)::bigint as entries_cost_cents
 from public.supplier_documents d;
revoke all on public.supplier_document_summary from public,anon,authenticated;
grant select on public.supplier_document_summary to authenticated;
drop function public.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text);
drop function private.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text);
create function private.move_salon_supply(p_product uuid,p_request uuid,p_version integer,p_kind text,p_quantity numeric,p_cost bigint,p_reason text,p_document uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare product public.salon_supplies; prior public.salon_supply_movements; actor public.profiles; next_stock numeric; v integer; doc public.supplier_documents; allocated bigint;
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
  if prior.purchase_document_id is distinct from p_document or prior.actor_id<>actor.id or prior.kind<>p_kind or prior.quantity<>p_quantity or prior.purchase_cost_cents is distinct from p_cost or prior.reason<>trim(p_reason) then raise exception 'Request already used' using errcode='40001'; end if;
  return jsonb_build_object('version',prior.version,'stock',prior.after_stock,'replayed',true);
 end if;
 if not product.is_active then raise exception 'Supply inactive' using errcode='22023'; end if;
 if product.version<>p_version then raise exception 'Stock changed; reload' using errcode='40001'; end if;
 if p_kind<>'purchase' and p_document is not null then raise exception 'Only purchases accept documents' using errcode='22023'; end if;
 if p_document is not null then
  select * into doc from public.supplier_documents where id=p_document and organization_id=actor.organization_id and unit_id=actor.unit_id for update;
  if doc.id is null then raise exception 'Purchase document access denied' using errcode='42501'; end if;
  select coalesce(sum(purchase_cost_cents),0) into allocated from public.salon_supply_movements where purchase_document_id=p_document;
  if allocated+p_cost>doc.total_cents then raise exception 'Entries exceed purchase document' using errcode='22023'; end if;
 end if;
 next_stock:=product.stock+case when p_kind='purchase' then p_quantity else -p_quantity end;
 if next_stock<0 or next_stock>1000000000000 then raise exception 'Insufficient or excessive stock' using errcode='22023'; end if;
 v:=product.version+1;
 insert into public.salon_supply_movements(product_id,organization_id,unit_id,request_id,kind,quantity,purchase_cost_cents,before_stock,after_stock,reason,actor_id,version,purchase_document_id)
 values(product.id,product.organization_id,product.unit_id,p_request,p_kind,p_quantity,p_cost,product.stock,next_stock,trim(p_reason),actor.id,v,p_document);
 update public.salon_supplies set stock=next_stock,version=v,updated_at=now() where id=product.id;
 return jsonb_build_object('version',v,'stock',next_stock,'replayed',false);
end; $$;
revoke all on function private.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text,uuid) from public,anon;
grant execute on function private.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text,uuid) to authenticated;
create function public.move_salon_supply(p_product uuid,p_request uuid,p_version integer,p_kind text,p_quantity numeric,p_cost bigint,p_reason text,p_document uuid default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.move_salon_supply(p_product,p_request,p_version,p_kind,p_quantity,p_cost,p_reason,p_document); $$;
revoke all on function public.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text,uuid) from public,anon;
grant execute on function public.move_salon_supply(uuid,uuid,integer,text,numeric,bigint,text,uuid) to authenticated;
create function private.record_supplier_payment(p_document uuid,p_request uuid,p_amount bigint,p_date date,p_method text,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles; doc public.supplier_documents; prior public.supplier_document_payments; paid bigint; result uuid;
begin
 select * into actor from public.profiles where id=auth.uid() and active;
 if actor.id is null or actor.role not in ('owner','admin','manager') or not exists(select 1 from public.user_unit_access a join public.units u on u.id=a.unit_id where a.user_id=actor.id and a.organization_id=actor.organization_id and a.unit_id=actor.unit_id and u.organization_id=actor.organization_id and u.is_active) then raise exception 'Payment access denied' using errcode='42501'; end if;
 select * into doc from public.supplier_documents where id=p_document and organization_id=actor.organization_id and unit_id=actor.unit_id for update;
 if doc.id is null then raise exception 'Document access denied' using errcode='42501'; end if;
 if p_request is null or p_amount is null or p_amount<1 or p_amount>1000000000000 or p_date is null or p_date>(now() at time zone 'America/Sao_Paulo')::date or p_method is null or p_method not in ('PIX','BOLETO','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','CASH','OTHER') or p_reference is null or length(trim(p_reference)) not between 3 and 200 then raise exception 'Invalid payment record' using errcode='22023'; end if;
 select * into prior from public.supplier_document_payments where document_id=p_document and request_id=p_request;
 if prior.id is not null then
  if prior.actor_id<>actor.id or prior.amount_cents<>p_amount or prior.payment_date<>p_date or prior.method<>p_method or prior.reference<>trim(p_reference) then raise exception 'Request already used' using errcode='40001'; end if;
  return prior.id;
 end if;
 select coalesce(sum(amount_cents),0) into paid from public.supplier_document_payments where document_id=p_document;
 if paid+p_amount>doc.total_cents then raise exception 'Payment exceeds document balance' using errcode='22023'; end if;
 insert into public.supplier_document_payments(organization_id,unit_id,document_id,request_id,amount_cents,payment_date,method,reference,actor_id)
 values(doc.organization_id,doc.unit_id,doc.id,p_request,p_amount,p_date,p_method,trim(p_reference),actor.id) returning id into result;
 return result;
end; $$;
revoke all on function private.record_supplier_payment(uuid,uuid,bigint,date,text,text) from public,anon;
grant execute on function private.record_supplier_payment(uuid,uuid,bigint,date,text,text) to authenticated;
create function public.record_supplier_payment(p_document uuid,p_request uuid,p_amount bigint,p_date date,p_method text,p_reference text)
returns uuid language sql security invoker set search_path='' as $$ select private.record_supplier_payment(p_document,p_request,p_amount,p_date,p_method,p_reference); $$;
revoke all on function public.record_supplier_payment(uuid,uuid,bigint,date,text,text) from public,anon;
grant execute on function public.record_supplier_payment(uuid,uuid,bigint,date,text,text) to authenticated;
