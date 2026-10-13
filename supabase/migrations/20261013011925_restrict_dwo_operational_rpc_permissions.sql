-- Restrict only DWO operational RPCs and triggers. No portal changes.
revoke execute on function public.current_organization_id() from public,anon;
revoke execute on function public.current_profile_role() from public,anon;
revoke execute on function public.current_unit_id() from public,anon;
grant execute on function public.current_organization_id(), public.current_profile_role(), public.current_unit_id() to authenticated,service_role;
revoke execute on function public.reverse_appointment_execution(uuid,text), public.switch_active_unit(uuid) from public,anon;
grant execute on function public.reverse_appointment_execution(uuid,text), public.switch_active_unit(uuid) to authenticated,service_role;
-- Trigger code is unchanged. Preserve the Auth administrative execution path.
revoke execute on function public.handle_new_user(), public.guard_invoice_origin() from public,anon,authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin,service_role;
grant execute on function public.guard_invoice_origin() to service_role;
do $verify$
declare signature text;
begin
 foreach signature in array array['public.current_organization_id()','public.current_profile_role()','public.current_unit_id()','public.reverse_appointment_execution(uuid,text)','public.switch_active_unit(uuid)','public.handle_new_user()','public.guard_invoice_origin()'] loop
 if has_function_privilege('anon',signature,'EXECUTE') then raise exception 'Anonymous execution remains: %',signature; end if;
 end loop;
 if not has_function_privilege('supabase_auth_admin','public.handle_new_user()','EXECUTE') then raise exception 'Auth trigger permission missing'; end if;
end $verify$;

