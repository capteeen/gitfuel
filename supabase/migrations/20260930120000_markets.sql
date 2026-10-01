-- Repogo launch registry. Public read. Writes go through server routes
-- with the publishable key (anon role), so RLS checks the row shape.
-- Identity columns cannot change after insert. Only status = 'test' rows can be deleted.

create table if not exists public.markets (
  github_repo_id bigint primary key,
  owner text not null,
  name text not null,
  full_name text not null,
  description text,
  stars integer not null default 0,
  forks integer not null default 0,
  language text,
  avatar_url text not null default '',
  html_url text not null,
  coin_name text not null,
  symbol text not null,
  mint text,
  metadata_uri text,
  image_url text,
  launcher text,
  bonding_complete boolean not null default false,
  pumpswap_pool text,
  confirmed boolean not null default true,
  status text not null default 'launched',
  created_at timestamptz not null default now()
);

create unique index if not exists markets_mint_key on public.markets (mint) where mint is not null;
create index if not exists markets_created_at_idx on public.markets (created_at desc);

alter table public.markets enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.markets to anon, authenticated;

drop policy if exists "markets_public_read" on public.markets;
create policy "markets_public_read"
  on public.markets
  for select
  to anon, authenticated
  using (true);

drop policy if exists "markets_insert_launch" on public.markets;
create policy "markets_insert_launch"
  on public.markets
  for insert
  to anon, authenticated
  with check (
    github_repo_id > 0
    and char_length(owner) between 1 and 100
    and char_length(name) between 1 and 100
    and char_length(full_name) between 1 and 201
    and char_length(html_url) between 1 and 300
    and html_url like 'https://github.com/%'
    and char_length(coin_name) between 1 and 32
    and symbol ~ '^[A-Z0-9]{1,10}$'
    and char_length(coalesce(mint, '')) >= 32
    and char_length(coalesce(launcher, '')) >= 32
    and status in ('launched', 'bonding', 'graduated', 'test')
    and confirmed = true
  );

drop policy if exists "markets_update_curve" on public.markets;
create policy "markets_update_curve"
  on public.markets
  for update
  to anon, authenticated
  using (true)
  with check (status in ('launched', 'bonding', 'graduated'));

drop policy if exists "markets_delete_test" on public.markets;
create policy "markets_delete_test"
  on public.markets
  for delete
  to anon, authenticated
  using (status = 'test');

create or replace function public.markets_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'test' then
    raise exception 'test rows cannot be updated';
  end if;
  if new.github_repo_id is distinct from old.github_repo_id
     or new.owner is distinct from old.owner
     or new.name is distinct from old.name
     or new.full_name is distinct from old.full_name
     or new.html_url is distinct from old.html_url
     or new.coin_name is distinct from old.coin_name
     or new.symbol is distinct from old.symbol
     or new.mint is distinct from old.mint
     or new.launcher is distinct from old.launcher
     or new.created_at is distinct from old.created_at
  then
    raise exception 'launch identity is immutable';
  end if;
  if new.status not in ('launched', 'bonding', 'graduated') then
    raise exception 'invalid status';
  end if;
  return new;
end;
$$;

drop trigger if exists markets_guard_update on public.markets;
create trigger markets_guard_update
  before update on public.markets
  for each row execute function public.markets_guard_update();
