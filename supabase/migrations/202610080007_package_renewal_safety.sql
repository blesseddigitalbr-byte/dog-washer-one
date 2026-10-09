begin;
alter table public.client_packages add column renewal_source_id uuid unique references public.client_packages(id);
create function public.renew_client_package(p_id uuid, p_contract_date date default current_date)
returns public.client_packages language plpgsql security invoker set search_path='' as $$
declare
  old_package public.client_packages;
  renewed public.client_packages;
  months integer;
  new_code text;
begin
  select * into old_package from public.client_packages where id=p_id
    and organization_id=public.current_organization_id() and unit_id=public.current_unit_id() for update;
  if old_package.id is null then raise exception 'Pacote não encontrado'; end if;
  if old_package.status='cancelled' then raise exception 'Pacote cancelado não pode ser renovado'; end if;
  select * into renewed from public.client_packages where renewal_source_id=p_id;
  if renewed.id is not null then return renewed; end if;
  if p_contract_date < old_package.contract_date then raise exception 'Renovação anterior à contratação original'; end if;
  select duration_months into months from public.packages where id=old_package.package_id and unit_id=old_package.unit_id;
  new_code := public.next_client_package_code(old_package.organization_id);
  insert into public.client_packages(organization_id,unit_id,client_id,pet_id,package_id,code,
    contracted_baths,contracted_groomings,balance_baths,balance_groomings,price,contract_date,expiry_date,
    status,frequency,payment_status,payment_date,payment_method,notes,renewal_source_id)
  values(old_package.organization_id,old_package.unit_id,old_package.client_id,old_package.pet_id,old_package.package_id,new_code,
    old_package.contracted_baths,old_package.contracted_groomings,old_package.contracted_baths,old_package.contracted_groomings,
    old_package.price,p_contract_date,case when months > 0 then (p_contract_date + pg_catalog.make_interval(months=>months))::date else null end,
    'active',old_package.frequency,'pending',null,null,old_package.notes,old_package.id) returning * into renewed;
  -- Do not extend, reset or disable old credits when renewing.
  return renewed;
end $$;
revoke all on function public.renew_client_package(uuid,date) from public;
grant execute on function public.renew_client_package(uuid,date) to authenticated;
commit;
