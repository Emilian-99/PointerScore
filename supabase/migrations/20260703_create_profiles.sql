create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,32}$'),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'inactive',
  current_period_end timestamptz,
  manage_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can read own profile') then
    create policy "Users can read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='Users can read own subscription') then
    create policy "Users can read own subscription" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

revoke all on public.profiles from anon;
revoke all on public.subscriptions from anon;
grant select, insert, update on public.profiles to authenticated;
grant select on public.subscriptions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true, file_size_limit=2097152, allowed_mime_types=array['image/png','image/jpeg','image/webp'];

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can read own avatar') then
    create policy "Users can read own avatar" on storage.objects for select to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can upload own avatar') then
    create policy "Users can upload own avatar" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can update own avatar') then
    create policy "Users can update own avatar" on storage.objects for update to authenticated using (bucket_id='avatars' and owner_id=(select auth.uid())::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can delete own avatar') then
    create policy "Users can delete own avatar" on storage.objects for delete to authenticated using (bucket_id='avatars' and owner_id=(select auth.uid())::text);
  end if;
end $$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
