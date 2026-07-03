create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  score numeric not null check (score >= 0 and score <= 100),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;
alter table public.analyses force row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analyses' and policyname = 'Users can read own analyses') then
    create policy "Users can read own analyses" on public.analyses for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analyses' and policyname = 'Users can insert own analyses') then
    create policy "Users can insert own analyses" on public.analyses for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analyses' and policyname = 'Users can update own analyses') then
    create policy "Users can update own analyses" on public.analyses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analyses' and policyname = 'Users can delete own analyses') then
    create policy "Users can delete own analyses" on public.analyses for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

revoke all on table public.analyses from anon;
grant select, insert, update, delete on table public.analyses to authenticated;
