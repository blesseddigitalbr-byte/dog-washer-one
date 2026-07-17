alter table public.profiles
  add column if not exists display_name text;

update public.profiles
set display_name = full_name
where display_name is null
  and nullif(trim(full_name), '') is not null;

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, display_name, phone, updated_at)
  on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  profile_name text;
  profile_display_name text;
begin
  profile_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'display_name'
  );
  profile_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    profile_name
  );

  insert into public.profiles (id, full_name, display_name, phone)
  values (
    new.id,
    profile_name,
    profile_display_name,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
