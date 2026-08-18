-- Ruleaza DOAR daca ai deja tabelele vechi (materiale, masini, masini_materiale)
-- si vrei sa treci la noul model (un singur tabel fleet_data), pastrand datele deja introduse.
-- Ruleaza in Supabase -> SQL Editor -> New query -> Run, o singura data.

create table if not exists fleet_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table fleet_data enable row level security;

drop policy if exists "allow all on fleet_data" on fleet_data;
create policy "allow all on fleet_data" on fleet_data
  for all using (true) with check (true);

-- Mutam datele vechi in noul format JSON
insert into fleet_data (id, data)
select
  'main',
  jsonb_build_object(
    'materiale', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id::text,
        'nume', m.nume,
        'cod_culoare', m.cod_culoare,
        'cantitate', m.cantitate,
        'unitate', m.unitate,
        'prag_minim', m.prag_minim,
        'pret', m.pret,
        'furnizor', m.furnizor
      ))
      from materiale m
    ), '[]'::jsonb),
    'masini', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ms.id::text,
        'numar_inmatriculare', ms.numar_inmatriculare,
        'model', ms.model,
        'data', ms.data,
        'lucrare', ms.lucrare,
        'materiale_folosite', coalesce((
          select jsonb_agg(jsonb_build_object(
            'material_id', mm.material_id::text,
            'cantitate', mm.cantitate_folosita,
            'cost', mm.cost
          ))
          from masini_materiale mm
          where mm.masina_id = ms.id
        ), '[]'::jsonb)
      ))
      from masini ms
    ), '[]'::jsonb)
  )
on conflict (id) do update set data = excluded.data;

-- Dupa ce confirmi ca /materiale si /masini arata corect cu noul cod,
-- poti sterge tabelele vechi (optional, NU e obligatoriu):
-- drop table if exists masini_materiale;
-- drop table if exists masini;
-- drop table if exists materiale;
