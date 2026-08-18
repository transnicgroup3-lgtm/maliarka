# Maliarca — Gestiune Vopsire

Aplicație pentru gestionarea stocului de materiale de vopsire și a evidenței mașinilor pe care s-a lucrat.

Toate datele stau într-un **singur tabel** în Supabase (`fleet_data`), într-o coloană JSON.
Practic, nu vei mai avea nevoie de migrări SQL pe viitor — orice câmp nou se adaugă direct
în cod (`page.js`), la fel ca la celălalt proiect al tău (TransNic).

## Dacă pornești de la zero (proiect Supabase nou)

### Pas 1 — Repository pe GitHub

1. Intră pe github.com → **New repository**.
2. Nume: `maliarca` (sau cum vrei tu).
3. Public sau Private — la alegere.
4. **Nu** bifa "Add README".
5. Create repository, apoi încarci toate fișierele din acest proiect, păstrând structura de
   foldere (`app/`, `app/materiale/`, `app/masini/`, `app/components/`, `lib/`). Cel mai simplu:
   **Add file → Upload files**, tragi tot deodată (GitHub păstrează folderele).

### Pas 2 — Proiect Supabase

1. supabase.com → **New project**. Alege un nume și o parolă pentru baza de date (o notezi undeva).
2. Așteaptă ~1 minut.
3. **SQL Editor** → **New query** → copiază tot conținutul din `schema.sql`, lipește, **Run**.
   Asta creează tabela `fleet_data` (un singur rând, `id = 'main'`, cu tot conținutul în JSON).
4. **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Nu adăuga niciodată cheia `sb_secret_...` — e cheie de admin, nu trebuie expusă public.

### Pas 3 — Deploy pe Vercel

1. vercel.com → **Add New → Project** → alege repo-ul `maliarca`.
2. Framework se detectează automat ca Next.js.
3. Înainte de Deploy, în **Environment Variables** adaugi cele 2 valori de mai sus.
4. **Deploy**. În ~1 minut ai un link `maliarca.vercel.app`.

## Dacă ai deja proiectul vechi (cu tabelele `materiale`, `masini`, `masini_materiale`)

Nu pierzi nimic — rulezi o singură migrare care mută tot ce ai introdus deja în noul format:

1. Supabase → **SQL Editor** → **New query** → copiază conținutul din `migration_to_jsonb.sql` → **Run**.
   Acesta creează tabela nouă `fleet_data` și copiază toate materialele și lucrările existente în ea.
2. Încarci fișierele noi din acest proiect peste cele vechi pe GitHub (păstrează structura de foldere).
   Fișierele `lib/supabaseClient.js`, `app/page.js`, `app/materiale/page.js`, `app/masini/page.js`
   sunt cele schimbate.
3. După ce confirmi că totul arată corect pe site, poți (opțional, nu obligatoriu) șterge
   tabelele vechi din Supabase — instrucțiunile sunt la finalul fișierului `migration_to_jsonb.sql`
   (comentate, le decomentezi tu dacă vrei).

## Pentru actualizări ulterioare

Deschizi fișierul pe care vrei să-l modifici direct pe GitHub (creionul ✏️), faci modificarea,
**Commit changes** — Vercel redeployează automat în ~1 minut. Pentru un câmp nou de date, ai
nevoie doar de modificări în `page.js` (nu mai ai nevoie de SQL Editor).

## Ce am construit

- **Dashboard** (`/`) — statistici (materiale în stoc, stoc redus, lucrări săptămâna asta,
  valoare stoc), alertă când un material scade sub pragul minim, ultimele lucrări cu total.
- **`/materiale`** — stoc: nume, cod/culoare, cantitate, unitate, **preț total** (pentru toată
  cantitatea, nu per bucată — ex: 10 bucăți de disc abraziv la 70 lei total, nu 70 lei/bucată),
  furnizor, prag minim (marchează "stoc redus" sub prag). Confirmare de ștergere stilizată,
  nu popup-ul browserului.
- **`/masini`** — lucrări: număr înmatriculare, **model mașină**, dată, descrierea lucrării,
  materiale folosite (cu cantitate) și **totalul calculat automat** (pe baza prețului materialelor
  consumate). Lucrările pot fi **editate** (creion) — la salvare, consumul vechi de stoc se
  anulează și se aplică cel nou. Ștergerea unei lucrări returnează automat stocul.
- Navigare cu tab-uri sus (Dashboard / Materiale / Mașini), fără parolă de acces.
- **Model de date simplu**: un singur tabel `fleet_data`, o coloană JSON — fără migrări SQL
  pe viitor, tot codul de business trăiește în `page.js`.
