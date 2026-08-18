-- Ruleaza acest fisier in Supabase: Project -> SQL Editor -> New query -> Run
-- O singura tabela, un singur rand ("main"), toate datele intr-o coloana JSONB.
-- Nu mai ai nevoie de migrari SQL pe viitor -- orice camp nou se adauga direct in page.js.

create table if not exists fleet_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into fleet_data (id, data)
values ('main', '{"materiale":[],"masini":[]}'::jsonb)
on conflict (id) do nothing;

-- Securitate: RLS activat, dar cu politica deschisa (aplicatia nu foloseste
-- autentificare Supabase, e protejata la nivel de site daca vrei sa adaugi asta ulterior).
alter table fleet_data enable row level security;

create policy "allow all on fleet_data" on fleet_data
  for all using (true) with check (true);
