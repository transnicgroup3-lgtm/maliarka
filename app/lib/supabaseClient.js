import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Încarcă materialele din stoc și lucrările (mașinile), fiecare lucrare
// cu materialele folosite la ea (join pe masini_materiale).
export async function loadFleetData() {
  const { data: materiale, error: materialeError } = await supabase
    .from("materiale")
    .select("*")
    .order("nume", { ascending: true });

  if (materialeError) throw materialeError;

  const { data: masini, error: masiniError } = await supabase
    .from("masini")
    .select("*, materiale_folosite:masini_materiale(*)")
    .order("data", { ascending: false });

  if (masiniError) throw masiniError;

  return { materiale: materiale || [], masini: masini || [] };
}
