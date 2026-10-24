-- Tabeller for svar (RSVP) og gjestebok.
-- Kjør i Supabase: SQL Editor -> New query -> lim inn -> Run.

create table if not exists public.rsvp (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  navn text not null check (char_length(navn) between 1 and 100),
  epost text check (char_length(epost) <= 200),
  kommer boolean not null,
  antall int not null default 1 check (antall between 0 and 10),
  allergier text check (char_length(allergier) <= 300),
  melding text check (char_length(melding) <= 1000)
);

create table if not exists public.gjestebok (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  navn text not null check (char_length(navn) between 1 and 100),
  tekst text not null check (char_length(tekst) between 1 and 2000)
);

alter table public.rsvp enable row level security;
alter table public.gjestebok enable row level security;

-- Gjester kan sende svar, men ikke lese andres svar (bare du ser dem i Supabase).
drop policy if exists "gjester kan svare" on public.rsvp;
create policy "gjester kan svare" on public.rsvp
  for insert to anon with check (true);

-- Gjesteboka er åpen: alle kan lese og skrive, ingen kan endre eller slette.
drop policy if exists "alle kan lese gjestebok" on public.gjestebok;
create policy "alle kan lese gjestebok" on public.gjestebok
  for select to anon using (true);
drop policy if exists "alle kan skrive i gjestebok" on public.gjestebok;
create policy "alle kan skrive i gjestebok" on public.gjestebok
  for insert to anon with check (true);

-- Oversikt over hvem som kommer (åpnes i SQL Editor eller Table Editor).
create or replace view public.rsvp_oversikt with (security_invoker = on) as
  select
    count(*) filter (where kommer) as svar_ja,
    count(*) filter (where not kommer) as svar_nei,
    coalesce(sum(antall) filter (where kommer), 0) as personer_totalt
  from public.rsvp;
revoke all on public.rsvp_oversikt from anon, authenticated;
