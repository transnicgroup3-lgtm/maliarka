-- Ruleaza acest fisier in Supabase: Project -> SQL Editor -> New query -> Run

create extension if not exists "pgcrypto";

-- Tabelul cu stocul de materiale pentru vopsire
create table if not exists materiale (
  id uuid primary key default gen_random_uuid(),
  nume text not null,
  cod_culoare text,
  cantitate numeric not null default 0,
  unitate text not null default 'l',
  prag_minim numeric,
  pret numeric,
  furnizor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabelul cu masinile / lucrarile de vopsire
create table if not exists masini (
  id uuid primary key default gen_random_uuid(),
  numar_inmatriculare text not null,
  model text,
  data date not null default current_date,
  lucrare text,
  created_at timestamptz not null default now()
);

-- Tabel de legatura: ce materiale s-au folosit la fiecare lucrare
create table if not exists masini_materiale (
  id uuid primary key default gen_random_uuid(),
  masina_id uuid not null references masini(id) on delete cascade,
  material_id uuid references materiale(id) on delete set null,
  cantitate_folosita numeric not null,
  cost numeric, -- costul calculat la momentul folosirii (cantitate_folosita * pret unitar de atunci)
  created_at timestamptz not null default now()
);

-- Index-uri utile
create index if not exists idx_masini_materiale_masina on masini_materiale(masina_id);
create index if not exists idx_masini_materiale_material on masini_materiale(material_id);

-- Securitate: activam RLS, dar dam voie la tot (aplicatia e protejata prin parola comuna la nivel de site,
-- nu prin autentificare Supabase, deci folosim cheia "anon" cu politici deschise).
alter table materiale enable row level security;
alter table masini enable row level security;
alter table masini_materiale enable row level security;

create policy "allow all on materiale" on materiale
  for all using (true) with check (true);

create policy "allow all on masini" on masini
  for all using (true) with check (true);

create policy "allow all on masini_materiale" on masini_materiale
  for all using (true) with check (true);
