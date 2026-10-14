create schema if not exists private;
create function private.client_package_payment_details()
returns table(id uuid,payment_status text,payment_date date,payment_method text)
language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 select * into p from public.profiles where profiles.id=auth.uid() and active;
 if p.id is null or p.role not in ('owner','admin','manager') or not exists(
 select 1 from public.user_unit_access a join public.units u on u.id=a.unit_id
 where a.user_id=p.id and a.organization_id=p.organization_id and a.unit_id=p.unit_id
 and u.organization_id=p.organization_id and u.is_active
 ) then raise exception 'Financial access denied' using errcode='42501'; end if;
 return query select c.id,c.payment_status,c.payment_date,c.payment_method from public.client_packages c
 where c.organization_id=p.organization_id and c.unit_id=p.unit_id;
end; $$;
revoke all on function private.client_package_payment_details() from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.client_package_payment_details() to authenticated;
create function public.client_package_payment_details()
returns table(id uuid,payment_status text,payment_date date,payment_method text)
language sql security invoker set search_path='' as $$ select * from private.client_package_payment_details(); $$;
revoke all on function public.client_package_payment_details() from public,anon;
grant execute on function public.client_package_payment_details() to authenticated;
