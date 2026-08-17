# Maliarca — Gestiune Vopsire

Aplicație pentru gestionarea stocului de materiale de vopsire și a evidenței mașinilor pe care s-a lucrat.

## Pas 1 — Creezi repository-ul pe GitHub

1. Intră pe github.com → **New repository**.
2. Nume: `maliarca` (sau cum vrei tu).
3. Public sau Private — la alegere (Private e recomandat, e date interne).
4. **Nu** bifa "Add README" — o să încarci tu fișierele astea.
5. Create repository.

Acum încarci toate fișierele din acest proiect în repo, păstrând exact structura de foldere
(`app/`, `app/materiale/`, `app/masini/`, `app/login/`, `app/api/login/`, `app/api/logout/`,
`app/components/`, `lib/`). Cel mai simplu: pe pagina repo-ului, buton **Add file → Upload files**,
și tragi toate fișierele/folderele deodată (GitHub păstrează structura de foldere la upload).

## Pas 2 — Creezi proiectul Supabase

1. Intră pe supabase.com → **New project**.
2. Alege un nume (ex: `maliarca`) și o parolă pentru baza de date (o notezi undeva, nu ai nevoie de ea zilnic).
3. Așteaptă ~1 minut până se creează proiectul.
4. Mergi la **SQL Editor** → **New query**.
5. Copiază tot conținutul fișierului `schema.sql` din acest proiect, lipește-l acolo și apasă **Run**.
   Asta îți creează cele 3 tabele: `materiale`, `masini`, `masini_materiale`.
6. Mergi la **Project Settings → API**. De acolo ai nevoie de două valori:
   - **Project URL** → îl pui în `NEXT_PUBLIC_SUPABASE_URL` (doar link-ul, fără `/rest/v1/` la final)
   - **anon / publishable key** (`sb_publishable_...`) → îl pui în `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Nu ai nevoie de `sb_secret_...` — nu-l adăuga nicăieri, e o cheie de admin care nu trebuie expusă.

## Pas 3 — Deploy pe Vercel

1. Intră pe vercel.com → **Add New → Project**.
2. Alege repo-ul `maliarca` de pe GitHub (dă-i acces la GitHub dacă e prima oară).
3. Framework Preset ar trebui să fie detectat automat ca **Next.js**.
4. Înainte de a apăsa Deploy, deschide secțiunea **Environment Variables** și adaugă:

   | Nume | Valoare |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (din Supabase, Pas 2.6) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (din Supabase, Pas 2.6) |

5. Apasă **Deploy**. În ~1 minut ai un link gen `maliarca.vercel.app`.

Site-ul nu are parolă de acces — se deschide direct la Dashboard pentru oricine are link-ul.

## Pas 4 — Testezi

1. Deschide link-ul Vercel → intri direct pe **Dashboard**.
2. Mergi la **Materiale** → adaugă câteva materiale de test.
3. Mergi la **Mașini** → adaugă o lucrare de test și selectează materialele folosite — vezi cum
   se scade automat cantitatea din stoc.
4. Revino la **Dashboard** — vezi statisticile și alerta de stoc redus, dacă e cazul.

## Pentru actualizări ulterioare

Ca și la celălalt proiect: deschizi fișierul pe care vrei să-l modifici direct în GitHub
(editorul web, creioanele ✏️), faci modificarea, dai **Commit changes** — Vercel redeploy-ează
automat în ~1 minut.

## Ce am construit

- **Dashboard** (`/`) — statistici (materiale în stoc, stoc redus, lucrări săptămâna asta,
  valoare stoc), alertă când un material scade sub pragul minim, și ultimele lucrări.
- **`/materiale`** — stoc: nume, cod/culoare, cantitate, unitate, preț, furnizor, prag minim
  (marchează "stoc redus" când cantitatea scade sub prag).
- **`/masini`** — lucrări: număr înmatriculare, dată, descrierea lucrării, și lista de materiale
  folosite (cu cantitate) — la salvare, cantitatea se scade automat din stocul de materiale.
- Navigare cu tab-uri sus (Dashboard / Materiale / Mașini), fără parolă de acces — la fel ca
  la aplicația de flotă.
