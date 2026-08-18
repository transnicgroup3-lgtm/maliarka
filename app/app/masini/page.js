"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Nav from "../components/Nav";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY_FORM = {
  numar_inmatriculare: "",
  model: "",
  data: new Date().toISOString().slice(0, 10),
  lucrare: "",
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function MasiniPage() {
  const [masini, setMasini] = useState([]);
  const [materiale, setMateriale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [materialeFolosite, setMaterialeFolosite] = useState([]); // [{material_id, cantitate}]
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [masiniRes, materialeRes] = await Promise.all([
      supabase
        .from("masini")
        .select("*, masini_materiale(id, material_id, cantitate_folosita, cost, materiale(id, nume, unitate))")
        .order("data", { ascending: false }),
      supabase.from("materiale").select("id, nume, unitate, cantitate, pret").order("nume"),
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

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMaterialeFolosite([]);
    setShowForm(true);
  }

  function openEditForm(m) {
    setForm({
      numar_inmatriculare: m.numar_inmatriculare || "",
      model: m.model || "",
      data: m.data,
      lucrare: m.lucrare || "",
    });
    setMaterialeFolosite(
      (m.masini_materiale || []).map((mm) => ({
        id: mm.id,
        material_id: mm.material_id || "",
        cantitate: mm.cantitate_folosita ?? "",
      }))
    );
    setEditingId(m.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
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

  // Adauga cantitatea inapoi in stoc pentru fiecare material folosit anterior de o lucrare
  // (folosit cand editam sau stergem o lucrare, ca sa nu ramana stocul "consumat" degeaba)
  async function restoreStockForRows(rows) {
    for (const row of rows) {
      if (!row.material_id) continue;
      const { data: mat } = await supabase
        .from("materiale")
        .select("cantitate")
        .eq("id", row.material_id)
        .single();
      if (mat) {
        await supabase
          .from("materiale")
          .update({ cantitate: Number(mat.cantitate) + Number(row.cantitate_folosita) })
          .eq("id", row.material_id);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.numar_inmatriculare.trim()) {
      setError("Numărul de înmatriculare este obligatoriu.");
      return;
    }

    setSaving(true);
    setError("");

    const rows = materialeFolosite.filter((r) => r.material_id && r.cantitate !== "");
    let masinaId = editingId;

    if (editingId) {
      // 1. restauram stocul consumat de versiunea veche a lucrarii
      const { data: oldRows } = await supabase
        .from("masini_materiale")
        .select("material_id, cantitate_folosita")
        .eq("masina_id", editingId);
      await restoreStockForRows(oldRows || []);

      // 2. stergem legaturile vechi
      await supabase.from("masini_materiale").delete().eq("masina_id", editingId);

      // 3. actualizam datele lucrarii
      const { error: updErr } = await supabase
        .from("masini")
        .update({
          numar_inmatriculare: form.numar_inmatriculare.trim().toUpperCase(),
          model: form.model.trim() || null,
          data: form.data,
          lucrare: form.lucrare.trim() || null,
        })
        .eq("id", editingId);

      if (updErr) {
        setError("Eroare la salvarea lucrării: " + updErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: masinaData, error: masinaErr } = await supabase
        .from("masini")
        .insert({
          numar_inmatriculare: form.numar_inmatriculare.trim().toUpperCase(),
          model: form.model.trim() || null,
          data: form.data,
          lucrare: form.lucrare.trim() || null,
        })
        .select()
        .single();

      if (masinaErr) {
        setError("Eroare la salvarea lucrării: " + masinaErr.message);
        setSaving(false);
        return;
      }
      masinaId = masinaData.id;
    }

    // legam materialele (noi) folosite, scadem din stoc si calculam costul
    for (const row of rows) {
      const cantitateFolosita = Number(row.cantitate);

      const { data: mat } = await supabase
        .from("materiale")
        .select("cantitate, pret")
        .eq("id", row.material_id)
        .single();

      let cost = null;
      let cantitateNoua = null;
      if (mat) {
        const pretUnitar = mat.cantitate > 0 && mat.pret != null ? Number(mat.pret) / Number(mat.cantitate) : 0;
        cost = Math.round(pretUnitar * cantitateFolosita * 100) / 100;
        cantitateNoua = Number(mat.cantitate) - cantitateFolosita;
      }

      const { error: linkErr } = await supabase.from("masini_materiale").insert({
        masina_id: masinaId,
        material_id: row.material_id,
        cantitate_folosita: cantitateFolosita,
        cost,
      });
      if (linkErr) {
        setError("Eroare la salvarea materialelor folosite: " + linkErr.message);
        continue;
      }

      if (cantitateNoua !== null) {
        await supabase.from("materiale").update({ cantitate: cantitateNoua }).eq("id", row.material_id);
      }
    }

    setSaving(false);
    closeForm();
    loadAll();
  }

  async function handleDelete(id) {
    const { data: oldRows } = await supabase
      .from("masini_materiale")
      .select("material_id, cantitate_folosita")
      .eq("masina_id", id);
    await restoreStockForRows(oldRows || []);

    const { error } = await supabase.from("masini").delete().eq("id", id);
    if (error) {
      setError("Nu am putut șterge: " + error.message);
      return;
    }
    loadAll();
  }

  function jobTotal(m) {
    return (m.masini_materiale || []).reduce((sum, mm) => sum + (Number(mm.cost) || 0), 0);
  }

  return (
    <div className="shell">
      <Nav />
      <h1>Mașini vopsite</h1>
      <p className="subtitle">Evidența lucrărilor: pe ce mașină, ce s-a făcut și ce materiale s-au consumat.</p>

      <button className="btn" onClick={openNewForm} style={{ marginBottom: 16 }}>
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
                <label>Model mașină</label>
                <input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="ex: Toyota Prius"
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

            {editingId && (
              <p className="subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
                La salvare, stocul se recalculează automat (se anulează consumul vechi și se aplică cel nou).
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Se salvează..." : editingId ? "Salvează modificările" : "Salvează lucrarea"}
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
              <span className="plate">
                {m.numar_inmatriculare}
                {m.model && <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> · {m.model}</span>}
              </span>
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
            {jobTotal(m) > 0 && (
              <div style={{ marginTop: 10, fontSize: 14 }}>
                <strong>Total: {jobTotal(m).toFixed(2)} MDL</strong>
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button className="btn secondary small" onClick={() => openEditForm(m)}>
                <PencilIcon /> Editează
              </button>
              <button className="btn danger" onClick={() => setConfirmDeleteId(m.id)}>
                Șterge lucrarea
              </button>
            </div>
          </div>
        ))
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Ștergi lucrarea?"
        message="Stocul consumat de această lucrare va fi returnat automat în materiale. Acțiunea este permanentă."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
