alter table public.clientes add column if not exists photo_storage_key text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('client-photos','client-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
