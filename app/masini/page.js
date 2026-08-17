"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Nav from "../components/Nav";

const EMPTY_FORM = {
  numar_inmatriculare: "",
  data: new Date().toISOString().slice(0, 10),
  lucrare: "",
};

export default function MasiniPage() {
  const [masini, setMasini] = useState([]);
  const [materiale, setMateriale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [materialeFolosite, setMaterialeFolosite] = useState([]); // [{material_id, cantitate}]
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [masiniRes, materialeRes] = await Promise.all([
      supabase
        .from("masini")
        .select("*, masini_materiale(id, cantitate_folosita, materiale(id, nume, unitate))")
        .order("data", { ascending: false }),
      supabase.from("materiale").select("id, nume, unitate, cantitate").order("nume"),
    ]);

    if (masiniRes.error) {
      setError("Nu am putut încărca lucrările: " + masiniRes.error.message);
    } else {
      setMasini(masiniRes.data);
    }

    if (materialeRes.error) {
      setError("Nu am putut încărca materialele: " + materialeRes.error.message);
    } else {
      setMateriale(materialeRes.data);
    }

    setLoading(false);
  }

  function openForm() {
    setForm(EMPTY_FORM);
    setMaterialeFolosite([]);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setMaterialeFolosite([]);
  }

  function addMaterialRow() {
    setMaterialeFolosite([...materialeFolosite, { material_id: "", cantitate: "" }]);
  }

  function updateMaterialRow(index, field, value) {
    const next = [...materialeFolosite];
    next[index][field] = value;
    setMaterialeFolosite(next);
  }

  function removeMaterialRow(index) {
    setMaterialeFolosite(materialeFolosite.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.numar_inmatriculare.trim()) {
      setError("Numărul de înmatriculare este obligatoriu.");
      return;
    }

    const rows = materialeFolosite.filter((r) => r.material_id && r.cantitate !== "");

    // 1. cream lucrarea
    const { data: masinaData, error: masinaErr } = await supabase
      .from("masini")
      .insert({
        numar_inmatriculare: form.numar_inmatriculare.trim().toUpperCase(),
        data: form.data,
        lucrare: form.lucrare.trim() || null,
      })
      .select()
      .single();

    if (masinaErr) {
      setError("Eroare la salvarea lucrării: " + masinaErr.message);
      return;
    }

    // 2. legam materialele folosite si scadem din stoc
    for (const row of rows) {
      const cantitate = Number(row.cantitate);

      const { error: linkErr } = await supabase.from("masini_materiale").insert({
        masina_id: masinaData.id,
        material_id: row.material_id,
        cantitate_folosita: cantitate,
      });
      if (linkErr) {
        setError("Eroare la salvarea materialelor folosite: " + linkErr.message);
        continue;
      }

      const material = materiale.find((m) => m.id === row.material_id);
      if (material) {
        const cantitateNoua = Number(material.cantitate) - cantitate;
        await supabase
          .from("materiale")
          .update({ cantitate: cantitateNoua })
          .eq("id", row.material_id);
      }
    }

    setError("");
    closeForm();
    loadAll();
  }

  async function handleDelete(id) {
    if (!confirm("Ștergi această lucrare? (materialele scăzute din stoc nu se returnează automat)")) return;
    const { error } = await supabase.from("masini").delete().eq("id", id);
    if (error) {
      setError("Nu am putut șterge: " + error.message);
      return;
    }
    loadAll();
  }

  return (
    <div className="shell">
      <Nav />
      <h1>Mașini vopsite</h1>
      <p className="subtitle">Evidența lucrărilor: pe ce mașină, ce s-a făcut și ce materiale s-au consumat.</p>

      <button className="btn" onClick={openForm} style={{ marginBottom: 16 }}>
        + Lucrare nouă
      </button>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="field">
                <label>Număr înmatriculare *</label>
                <input
                  value={form.numar_inmatriculare}
                  onChange={(e) => setForm({ ...form, numar_inmatriculare: e.target.value })}
                  placeholder="ex: C AA 123"
                />
              </div>
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Ce lucrare s-a făcut</label>
              <textarea
                rows={3}
                value={form.lucrare}
                onChange={(e) => setForm({ ...form, lucrare: e.target.value })}
                placeholder="ex: vopsit aripă stânga față + lăcuit"
              />
            </div>

            <div className="section-title">Materiale folosite</div>
            {materialeFolosite.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-end" }}>
                <div className="field" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Material</label>
                  <select
                    value={row.material_id}
                    onChange={(e) => updateMaterialRow(i, "material_id", e.target.value)}
                  >
                    <option value="">Alege...</option>
                    {materiale.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nume} (stoc: {m.cantitate} {m.unitate})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Cantitate folosită</label>
                  <input
                    type="number"
                    step="0.01"
                    value={row.cantitate}
                    onChange={(e) => updateMaterialRow(i, "cantitate", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => removeMaterialRow(i)}
                >
                  Scoate
                </button>
              </div>
            ))}
            <button type="button" className="btn secondary small" onClick={addMaterialRow}>
              + Adaugă material
            </button>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn" type="submit">
                Salvează lucrarea
              </button>
              <button className="btn secondary" type="button" onClick={closeForm}>
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="empty">Se încarcă...</div>
      ) : masini.length === 0 ? (
        <div className="card empty">Nicio lucrare înregistrată încă.</div>
      ) : (
        masini.map((m) => (
          <div className="job-card" key={m.id}>
            <div className="job-top">
              <span className="plate">{m.numar_inmatriculare}</span>
              <span className="date">{new Date(m.data).toLocaleDateString("ro-RO")}</span>
            </div>
            {m.lucrare && <div className="lucrare">{m.lucrare}</div>}
            <div>
              {m.masini_materiale?.length > 0 ? (
                m.masini_materiale.map((mm) => (
                  <span className="material-pill" key={mm.id}>
                    {mm.materiale?.nume} — {mm.cantitate_folosita} {mm.materiale?.unitate}
                  </span>
                ))
              ) : (
                <span className="tag">fără materiale înregistrate</span>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn danger" onClick={() => handleDelete(m.id)}>
                Șterge lucrarea
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
