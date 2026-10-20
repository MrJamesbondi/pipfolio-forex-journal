-- Run this file once in Supabase Dashboard → SQL Editor → New query.
create table if not exists public.trades (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.trades enable row level security;

create policy "Users can read their own trades"
  on public.trades for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own trades"
  on public.trades for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own trades"
  on public.trades for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own trades"
  on public.trades for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.trades to authenticated;
revoke all on public.trades from anon;
