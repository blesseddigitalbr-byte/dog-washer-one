begin;
set local statement_timeout='15s';
do $test$
declare actor uuid:='668700cd-b04b-4aca-baa6-6509d1fb5790'; target uuid:='62b24bca-6a6e-40db-afd4-3448401fe9fd';
 own_unit uuid:='d0000000-0000-4000-8000-000000000003'; foreign_unit uuid:='ac189c93-6cd2-4f0b-b5a4-95cbb4cf7674';
 rejected boolean; result uuid;
begin
 if has_function_privilege('anon','public.provision_dwo_user_access(uuid,uuid,text,text,uuid[],uuid)','EXECUTE')
 or has_function_privilege('authenticated','public.provision_dwo_user_access(uuid,uuid,text,text,uuid[],uuid)','EXECUTE') then raise exception 'Provision RPC exposed'; end if;
 if has_column_privilege('authenticated','public.profiles','role','UPDATE')
 or has_column_privilege('authenticated','public.profiles','organization_id','UPDATE') then raise exception 'Profile escalation possible'; end if;
 -- Existing QA profile emulates a freshly created unbound profile only in rollback transaction.
 delete from public.user_unit_access where user_id=target;
 update public.profiles set organization_id=null,unit_id=null where id=target;
 execute 'set local role service_role';
 rejected:=false;
 begin perform public.provision_dwo_user_access(actor,target,'QA test','owner',array[own_unit],own_unit);
 exception when others then if sqlerrm<>'Role escalation denied' then raise; end if; rejected:=true; end;
 if not rejected then raise exception 'Owner assignment permitted'; end if;
 rejected:=false;
 begin perform public.provision_dwo_user_access(actor,target,'QA test','staff',array[foreign_unit],foreign_unit);
 exception when others then if sqlerrm<>'Unit access denied' then raise; end if; rejected:=true; end;
 if not rejected then raise exception 'Foreign unit assigned'; end if;
 rejected:=false;
 begin perform public.provision_dwo_user_access(target,actor,'QA test','staff',array[own_unit],own_unit);
 exception when others then if sqlerrm<>'Administrator required' then raise; end if; rejected:=true; end;
 if not rejected then raise exception 'Non-administrator permitted'; end if;
 update public.profiles set role='admin' where id=actor;
 rejected:=false;
 begin perform public.provision_dwo_user_access(actor,target,'QA test','admin',array[own_unit],own_unit);
 exception when others then if sqlerrm<>'Role escalation denied' then raise; end if; rejected:=true; end;
 if not rejected then raise exception 'Admin created peer admin'; end if;
 update public.profiles set role='owner' where id=actor;
 result:=public.provision_dwo_user_access(actor,target,'QA test','staff',array[own_unit],own_unit);
 if result<>target or not exists(select 1 from public.user_unit_access where user_id=target and unit_id=own_unit and is_default and active) then raise exception 'Binding failed'; end if;
 if not exists(select 1 from public.user_access_audit where target_user_id=target and actor_id=actor and assigned_role='staff') then raise exception 'Audit missing'; end if;
 rejected:=false;
 begin perform public.provision_dwo_user_access(actor,target,'QA test','staff',array[own_unit],own_unit);
 exception when others then if sqlerrm<>'Existing account cannot be reassigned' then raise; end if; rejected:=true; end;
 if not rejected then raise exception 'Existing account reassigned'; end if;
 execute 'reset role';
end $test$;
select 'passed_provisioning_guards_binding_audit' as result;
rollback;
