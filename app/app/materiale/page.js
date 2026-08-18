"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Nav from "../components/Nav";
import ConfirmDialog from "../components/ConfirmDialog";

const UNITATI = ["l", "kg", "buc", "ml", "g"];

const EMPTY_FORM = {
  nume: "",
  cod_culoare: "",
  cantitate: "",
  unitate: "l",
  prag_minim: "",
  pret: "",
  furnizor: "",
};

export default function MaterialePage() {
  const [materiale, setMateriale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadMateriale();
  }, []);

  async function loadMateriale() {
    setLoading(true);
    const { data, error } = await supabase
      .from("materiale")
      .select("*")
      .order("nume", { ascending: true });

    if (error) {
      setError("Nu am putut încărca materialele: " + error.message);
    } else {
      setMateriale(data);
      setError("");
    }
    setLoading(false);
  }

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(m) {
    setForm({
      nume: m.nume || "",
      cod_culoare: m.cod_culoare || "",
      cantitate: m.cantitate ?? "",
      unitate: m.unitate || "l",
      prag_minim: m.prag_minim ?? "",
      pret: m.pret ?? "",
      furnizor: m.furnizor || "",
    });
    setEditingId(m.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nume.trim()) {
      setError("Numele materialului este obligatoriu.");
      return;
    }

    const payload = {
      nume: form.nume.trim(),
      cod_culoare: form.cod_culoare.trim() || null,
      cantitate: form.cantitate === "" ? 0 : Number(form.cantitate),
      unitate: form.unitate,
      prag_minim: form.prag_minim === "" ? null : Number(form.prag_minim),
      pret: form.pret === "" ? null : Number(form.pret),
      furnizor: form.furnizor.trim() || null,
    };

    let res;
    if (editingId) {
      res = await supabase.from("materiale").update(payload).eq("id", editingId);
    } else {
      res = await supabase.from("materiale").insert(payload);
    }

    if (res.error) {
      setError("Eroare la salvare: " + res.error.message);
      return;
    }

    setError("");
    closeForm();
    loadMateriale();
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("materiale").delete().eq("id", id);
    if (error) {
      setError("Nu am putut șterge: " + error.message);
      return;
    }
    loadMateriale();
  }

  function isLow(m) {
    return m.prag_minim !== null && m.prag_minim !== undefined && Number(m.cantitate) <= Number(m.prag_minim);
  }

  const filtered = materiale.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.nume?.toLowerCase().includes(q) ||
      m.cod_culoare?.toLowerCase().includes(q) ||
      m.furnizor?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="shell">
      <Nav />
      <h1>Materiale pentru vopsire</h1>
      <p className="subtitle">Stocul complet — vopsele, diluanți, lac, consumabile.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Caută după nume, cod culoare sau furnizor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button className="btn" onClick={openNewForm}>
          + Material nou
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="field">
                <label>Nume material *</label>
                <input
                  value={form.nume}
                  onChange={(e) => setForm({ ...form, nume: e.target.value })}
                  placeholder="ex: Vopsea bază Sikkens"
                />
              </div>
              <div className="field">
                <label>Cod / culoare</label>
                <input
                  value={form.cod_culoare}
                  onChange={(e) => setForm({ ...form, cod_culoare: e.target.value })}
                  placeholder="ex: #1C1C1C sau RAL 9005"
                />
              </div>
              <div className="field">
                <label>Cantitate</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cantitate}
                  onChange={(e) => setForm({ ...form, cantitate: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Unitate</label>
                <select
                  value={form.unitate}
                  onChange={(e) => setForm({ ...form, unitate: e.target.value })}
                >
                  {UNITATI.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Prag minim (alertă stoc)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prag_minim}
                  onChange={(e) => setForm({ ...form, prag_minim: e.target.value })}
                  placeholder="opțional"
                />
              </div>
              <div className="field">
                <label>Preț total (pentru toată cantitatea)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pret}
                  onChange={(e) => setForm({ ...form, pret: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Furnizor</label>
                <input
                  value={form.furnizor}
                  onChange={(e) => setForm({ ...form, furnizor: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn" type="submit">
                {editingId ? "Salvează modificările" : "Adaugă material"}
              </button>
              <button className="btn secondary" type="button" onClick={closeForm}>
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty">Se încarcă...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">Niciun material găsit.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Cod / culoare</th>
                <th>Cantitate</th>
                <th>Preț total</th>
                <th>Furnizor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>{m.nume}</td>
                  <td>
                    {m.cod_culoare && m.cod_culoare.startsWith("#") && (
                      <span className="swatch" style={{ background: m.cod_culoare }} />
                    )}
                    {m.cod_culoare || "—"}
                  </td>
                  <td>
                    {m.cantitate} {m.unitate}{" "}
                    {isLow(m) && <span className="pill danger">stoc redus</span>}
                  </td>
                  <td>{m.pret != null ? `${m.pret} MDL` : "—"}</td>
                  <td>{m.furnizor || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn secondary small" onClick={() => openEditForm(m)}>
                        Editează
                      </button>
                      <button className="btn danger" onClick={() => setConfirmDeleteId(m.id)}>
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Ștergi materialul?"
        message="Această acțiune este permanentă și nu poate fi anulată."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
