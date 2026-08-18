-- Ruleaza acest fisier in Supabase SQL Editor pe proiectul TAU EXISTENT
-- (adauga doar coloanele noi, nu sterge nimic din datele deja introduse)

alter table masini add column if not exists model text;
alter table masini_materiale add column if not exists cost numeric;
