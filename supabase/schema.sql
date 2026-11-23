-- Databasen for festsiden. Alt har navn som begynner med fest_, så det kan
-- ligge i et Supabase-prosjekt som også brukes til andre ting.
-- Kjør i Supabase: SQL Editor -> New query -> lim inn -> Run.

-- Svar på invitasjonen. Gjester kan sende svar, men ikke lese andres.
create table public.fest_rsvp (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  navn text not null check (char_length(navn) between 1 and 100),
  epost text check (char_length(epost) <= 200),
  kommer boolean not null,
  antall int not null default 1 check (antall between 0 and 10),
  allergier text check (char_length(allergier) <= 300),
  melding text check (char_length(melding) <= 1000)
);
alter table public.fest_rsvp enable row level security;
create policy "fest: gjester kan svare" on public.fest_rsvp
  for insert to anon with check (true);

-- Oversikt over hvem som kommer (åpnes i SQL Editor eller Table Editor).
create view public.fest_rsvp_oversikt with (security_invoker = on) as
  select
    count(*) filter (where kommer) as svar_ja,
    count(*) filter (where not kommer) as svar_nei,
    coalesce(sum(antall) filter (where kommer), 0) as personer_totalt
  from public.fest_rsvp;
revoke all on public.fest_rsvp_oversikt from anon, authenticated;

-- Offentlig gjesteliste: gir bare ut navnene på dem som har takket ja.
create function public.fest_gjesteliste()
returns table (navn text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.navn from public.fest_rsvp r where r.kommer order by r.created_at;
$$;

-- Gjesteboka: alle kan lese og skrive, bare admin kan slette.
create table public.fest_gjestebok (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  navn text not null check (char_length(navn) between 1 and 100),
  tekst text not null check (char_length(tekst) between 1 and 2000)
);
alter table public.fest_gjestebok enable row level security;
create policy "fest: alle kan lese gjestebok" on public.fest_gjestebok
  for select to anon using (true);
create policy "fest: alle kan skrive i gjestebok" on public.fest_gjestebok
  for insert to anon with check (true);

create table public.fest_kommentar (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  hilsen_id bigint not null references public.fest_gjestebok (id) on delete cascade,
  navn text not null check (char_length(navn) between 1 and 100),
  tekst text not null check (char_length(tekst) between 1 and 1000)
);
create index on public.fest_kommentar (hilsen_id);
alter table public.fest_kommentar enable row level security;
create policy "fest: alle kan lese kommentarer" on public.fest_kommentar
  for select to anon using (true);
create policy "fest: alle kan kommentere" on public.fest_kommentar
  for insert to anon with check (true);

-- Bilder og video lagt ved innlegg og kommentarer. Filene ligger i bøtta «fest».
create table public.fest_media (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  hilsen_id bigint not null references public.fest_gjestebok (id) on delete cascade,
  sti text not null unique check (char_length(sti) <= 200),
  type text not null check (type in ('bilde', 'video'))
);
create index on public.fest_media (hilsen_id);
alter table public.fest_media enable row level security;
create policy "fest: alle ser vedlegg" on public.fest_media
  for select to anon using (true);
create policy "fest: gjester kan legge ved filer" on public.fest_media
  for insert to anon with check (true);

create table public.fest_kommentar_media (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kommentar_id bigint not null references public.fest_kommentar (id) on delete cascade,
  sti text not null unique check (char_length(sti) <= 200),
  type text not null check (type in ('bilde', 'video'))
);
create index on public.fest_kommentar_media (kommentar_id);
alter table public.fest_kommentar_media enable row level security;
create policy "fest: alle ser vedlegg i kommentarer" on public.fest_kommentar_media
  for select to anon using (true);
create policy "fest: gjester kan legge ved filer i kommentarer" on public.fest_kommentar_media
  for insert to anon with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fest', 'fest', true, 52428800, array['image/*', 'video/*'])
on conflict (id) do nothing;
create policy "fest: gjester kan laste opp" on storage.objects
  for insert to anon with check (bucket_id = 'fest');

-- Bildegalleriet. Radene peker til filer i mappen bilder/ i repoet.
create table public.fest_galleri (
  id bigint generated always as identity primary key,
  sti text not null,
  rekkefolge int not null default 0
);
alter table public.fest_galleri enable row level security;
create policy "fest: alle ser galleriet" on public.fest_galleri
  for select to anon using (true);

-- Admin: siden åpnes med ?admin=KODE. Bare en SHA-256-hash av koden lagres,
-- i et skjema gjester ikke har tilgang til. Legg inn en kode slik:
--   insert into fest_private.admin_kode (hash)
--   values (encode(extensions.digest('KODEN', 'sha256'), 'hex'));
create schema fest_private;
create table fest_private.admin_kode (hash text primary key);

create function public.fest_er_admin(kode text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from fest_private.admin_kode
    where hash = encode(extensions.digest(kode, 'sha256'), 'hex')
  );
$$;

create function public.fest_admin_slett(kode text, tabell text, rad_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.fest_er_admin(kode) then
    raise exception 'ikke tilgang';
  end if;
  case tabell
    when 'fest_galleri' then delete from public.fest_galleri where id = rad_id;
    when 'fest_gjestebok' then delete from public.fest_gjestebok where id = rad_id;
    when 'fest_media' then delete from public.fest_media where id = rad_id;
    when 'fest_kommentar' then delete from public.fest_kommentar where id = rad_id;
    when 'fest_kommentar_media' then delete from public.fest_kommentar_media where id = rad_id;
    else raise exception 'ukjent tabell';
  end case;
end;
$$;

revoke all on function public.fest_gjesteliste() from public;
revoke all on function public.fest_er_admin(text) from public;
revoke all on function public.fest_admin_slett(text, text, bigint) from public;
grant execute on function public.fest_gjesteliste() to anon, authenticated;
grant execute on function public.fest_er_admin(text) to anon, authenticated;
grant execute on function public.fest_admin_slett(text, text, bigint) to anon, authenticated;
