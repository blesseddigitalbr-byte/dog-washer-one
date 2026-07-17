alter table public.profiles
  add column if not exists phone text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update auth.users as users
set raw_user_meta_data =
  coalesce(users.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'full_name', profiles.full_name,
    'display_name', profiles.full_name,
    'name', profiles.full_name
  )
from public.profiles as profiles
where profiles.id = users.id
  and nullif(trim(profiles.full_name), '') is not null;
