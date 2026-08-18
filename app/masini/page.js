"use client";

import { useEffect, useState } from "react";
import { loadFleetData, saveFleetData } from "../../lib/supabaseClient";
import Nav from "../components/Nav";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY_FORM = {
  numar_inmatriculare: "",
  model: "",
  data: new Date().toISOString().slice(0, 10),
  lucrare: "",
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// suma costurilor materialelor folosite la o lucrare
function jobTotal(m) {
  return (m.materiale_folosite || []).reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
}

export default function MasiniPage() {
  const [fleet, setFleet] = useState(null); // { materiale, masini }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [materialeFolosite, setMaterialeFolosite] = useState([]); // [{material_id, cantitate}]
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await loadFleetData();
      setFleet(data);
      setError("");
    } catch (e) {
      setError("Nu am putut încărca lucrările: " + e.message);
    }
    setLoading(false);
  }

  async function persist(nextFleet) {
    setSaving(true);
    try {
      await saveFleetData(nextFleet);
      setFleet(nextFleet);
      setError("");
    } catch (e) {
      setError("Eroare la salvare: " + e.message);
    }
    setSaving(false);
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
      (m.materiale_folosite || []).map((r) => ({
        material_id: r.material_id || "",
        cantitate: r.cantitate ?? "",
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

  // aduna inapoi in stoc cantitatea consumata de un set de randuri (folosit la editare/stergere lucrare)
  function restoreStock(materiale, rows) {
    let next = materiale;
    for (const row of rows) {
      if (!row.material_id) continue;
      next = next.map((mat) =>
        mat.id === row.material_id
          ? { ...mat, cantitate: Number(mat.cantitate) + Number(row.cantitate) }
          : mat
      );
    }
    return next;
  }

  // scade din stoc si calculeaza costul (pe baza pretului TOTAL / cantitatea TOTALA a materialului)
  function consumeStock(materiale, rows) {
    let next = materiale;
    const rowsWithCost = [];

    for (const row of rows) {
      const cantitateFolosita = Number(row.cantitate);
      const mat = next.find((m) => m.id === row.material_id);

      let cost = null;
      if (mat) {
        const pretUnitar = Number(mat.cantitate) > 0 && mat.pret != null ? Number(mat.pret) / Number(mat.cantitate) : 0;
        cost = Math.round(pretUnitar * cantitateFolosita * 100) / 100;
        next = next.map((m) =>
          m.id === row.material_id ? { ...m, cantitate: Number(m.cantitate) - cantitateFolosita } : m
        );
      }

      rowsWithCost.push({ material_id: row.material_id, cantitate: cantitateFolosita, cost });
    }

    return { materiale: next, rows: rowsWithCost };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.numar_inmatriculare.trim()) {
      setError("Numărul de înmatriculare este obligatoriu.");
      return;
    }

    const rows = materialeFolosite.filter((r) => r.material_id && r.cantitate !== "");

    let materiale = fleet.materiale || [];
    let masini = fleet.masini || [];

    // 1. daca editam, restauram stocul consumat de versiunea veche a lucrarii
    if (editingId) {
      const oldJob = masini.find((m) => m.id === editingId);
      materiale = restoreStock(materiale, oldJob?.materiale_folosite || []);
    }

    // 2. scadem stocul pentru randurile noi si calculam costul
    const { materiale: materialeDupaConsum, rows: rowsWithCost } = consumeStock(materiale, rows);
    materiale = materialeDupaConsum;

    const jobPayload = {
      numar_inmatriculare: form.numar_inmatriculare.trim().toUpperCase(),
      model: form.model.trim() || null,
      data: form.data,
      lucrare: form.lucrare.trim() || null,
      materiale_folosite: rowsWithCost,
    };

    if (editingId) {
      masini = masini.map((m) => (m.id === editingId ? { ...m, ...jobPayload } : m));
    } else {
      masini = [...masini, { id: newId(), ...jobPayload }];
    }

    await persist({ ...fleet, materiale, masini });
    closeForm();
  }

  async function handleDelete(id) {
    const job = (fleet.masini || []).find((m) => m.id === id);
    const materiale = restoreStock(fleet.materiale || [], job?.materiale_folosite || []);
    const masini = (fleet.masini || []).filter((m) => m.id !== id);
    await persist({ ...fleet, materiale, masini });
  }

  const materiale = fleet?.materiale || [];
  const masiniList = [...(fleet?.masini || [])].sort((a, b) => new Date(b.data) - new Date(a.data));

  function materialInfo(id) {
    return materiale.find((m) => m.id === id);
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
      ) : masiniList.length === 0 ? (
        <div className="card empty">Nicio lucrare înregistrată încă.</div>
      ) : (
        masiniList.map((m) => (
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
              {m.materiale_folosite?.length > 0 ? (
                m.materiale_folosite.map((r, i) => {
                  const mat = materialInfo(r.material_id);
                  return (
                    <span className="material-pill" key={i}>
                      {mat?.nume || "material șters"} — {r.cantitate} {mat?.unitate}
                    </span>
                  );
                })
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
