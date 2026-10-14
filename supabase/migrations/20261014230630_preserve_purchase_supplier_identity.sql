alter table public.supplier_documents add column supplier_snapshot jsonb not null default '{}'::jsonb;
create function private.capture_supplier_document_identity()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select jsonb_build_object('name',s.name,'document',s.document) into new.supplier_snapshot
 from public.salon_suppliers s where s.id=new.supplier_id and s.organization_id=new.organization_id and s.unit_id=new.unit_id;
 if new.supplier_snapshot is null then raise exception 'Supplier not accessible' using errcode='42501'; end if;
 return new;
end; $$;
revoke all on function private.capture_supplier_document_identity() from public,anon,authenticated;
create trigger capture_supplier_document_identity before insert on public.supplier_documents for each row execute function private.capture_supplier_document_identity();
create or replace view public.supplier_document_summary with(security_invoker=true) as select
 d.id,d.organization_id,d.unit_id,d.supplier_id,d.number,d.series,d.issue_date,d.total_cents,d.access_key,d.notes,d.created_by,d.created_at,
 coalesce((select sum(p.amount_cents) from public.supplier_document_payments p where p.document_id=d.id),0)::bigint as paid_cents,
 coalesce((select sum(m.purchase_cost_cents) from public.salon_supply_movements m where m.purchase_document_id=d.id),0)::bigint as entries_cost_cents,
 d.supplier_snapshot from public.supplier_documents d;
