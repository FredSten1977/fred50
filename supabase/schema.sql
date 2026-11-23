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

-- Offentlig gjesteliste: gir bare ut navnene på dem som har takket ja.
create or replace function public.gjesteliste()
returns table (navn text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.navn from public.rsvp r where r.kommer order by r.created_at;
$$;
revoke all on function public.gjesteliste() from public;
grant execute on function public.gjesteliste() to anon, authenticated;

-- Bilder og video i gjesteboka. Vises med en gang. Vil du skjule en fil,
-- sett godkjent = false i Table Editor -> gjestebok_media.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gjestebok', 'gjestebok', true, 52428800, array['image/*', 'video/*'])
on conflict (id) do nothing;

create table if not exists public.gjestebok_media (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  hilsen_id bigint not null references public.gjestebok (id) on delete cascade,
  sti text not null unique check (char_length(sti) <= 200),
  type text not null check (type in ('bilde', 'video')),
  godkjent boolean not null default true
);
create index if not exists gjestebok_media_hilsen on public.gjestebok_media (hilsen_id);
alter table public.gjestebok_media enable row level security;

create policy "gjester kan legge ved filer" on public.gjestebok_media
  for insert to anon with check (godkjent);
create policy "alle ser synlige filer" on public.gjestebok_media
  for select to anon using (godkjent);

create policy "gjester kan laste opp til gjesteboka" on storage.objects
  for insert to anon with check (bucket_id = 'gjestebok');

-- Kommentarer på innlegg i gjesteboka.
create table if not exists public.gjestebok_kommentar (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  hilsen_id bigint not null references public.gjestebok (id) on delete cascade,
  navn text not null check (char_length(navn) between 1 and 100),
  tekst text not null check (char_length(tekst) between 1 and 1000)
);
create index if not exists gjestebok_kommentar_hilsen on public.gjestebok_kommentar (hilsen_id);
alter table public.gjestebok_kommentar enable row level security;

create policy "alle kan lese kommentarer" on public.gjestebok_kommentar
  for select to anon using (true);
create policy "alle kan kommentere" on public.gjestebok_kommentar
  for insert to anon with check (true);

-- Bilder og video i kommentarer.
create table if not exists public.gjestebok_kommentar_media (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kommentar_id bigint not null references public.gjestebok_kommentar (id) on delete cascade,
  sti text not null unique check (char_length(sti) <= 200),
  type text not null check (type in ('bilde', 'video')),
  godkjent boolean not null default true
);
create index if not exists gjestebok_kommentar_media_kommentar on public.gjestebok_kommentar_media (kommentar_id);
alter table public.gjestebok_kommentar_media enable row level security;

create policy "gjester kan legge ved filer i kommentarer" on public.gjestebok_kommentar_media
  for insert to anon with check (godkjent);
create policy "alle ser synlige filer i kommentarer" on public.gjestebok_kommentar_media
  for select to anon using (godkjent);

-- Bildegalleriet. Radene peker til filer i mappen bilder/ i repoet.
create table if not exists public.galleri (
  id bigint generated always as identity primary key,
  sti text not null,
  rekkefolge int not null default 0
);
alter table public.galleri enable row level security;
create policy "alle ser galleriet" on public.galleri for select to anon using (true);

-- Admin: siden åpnes med ?admin=KODE. Bare en SHA-256-hash av koden lagres,
-- i en tabell gjester ikke har tilgang til. Legg inn en kode slik:
--   insert into private.admin_kode (hash) values (encode(extensions.digest('KODEN', 'sha256'), 'hex'));
create schema if not exists private;
create table if not exists private.admin_kode (hash text primary key);

create or replace function public.er_admin(kode text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_kode
    where hash = encode(extensions.digest(kode, 'sha256'), 'hex')
  );
$$;

create or replace function public.admin_slett(kode text, tabell text, rad_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.er_admin(kode) then
    raise exception 'ikke tilgang';
  end if;
  case tabell
    when 'galleri' then delete from public.galleri where id = rad_id;
    when 'gjestebok' then delete from public.gjestebok where id = rad_id;
    when 'gjestebok_media' then delete from public.gjestebok_media where id = rad_id;
    when 'gjestebok_kommentar' then delete from public.gjestebok_kommentar where id = rad_id;
    when 'gjestebok_kommentar_media' then delete from public.gjestebok_kommentar_media where id = rad_id;
    else raise exception 'ukjent tabell';
  end case;
end;
$$;

revoke all on function public.er_admin(text) from public;
revoke all on function public.admin_slett(text, text, bigint) from public;
grant execute on function public.er_admin(text) to anon, authenticated;
grant execute on function public.admin_slett(text, text, bigint) to anon, authenticated;
