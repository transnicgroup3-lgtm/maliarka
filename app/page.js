"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import Nav from "./components/Nav";

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h-2v-5l2-5h11l3 5h1a1 1 0 0 1 1 1v4h-2" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
      <path d="M9.3 17.5h5.4" />
    </svg>
  );
}

function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 15.5c.5.7 1.4 1.2 2.5 1.2 1.6 0 2.8-.9 2.8-2.1s-1.1-1.7-2.8-2.1c-1.7-.4-2.8-.9-2.8-2.1S10.4 8.3 12 8.3c1.1 0 2 .5 2.5 1.2" />
      <path d="M12 7v1.3M12 15.7V17" />
    </svg>
  );
}

export default function DashboardPage() {
  const [materiale, setMateriale] = useState([]);
  const [masini, setMasini] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [materialeRes, masiniRes] = await Promise.all([
      supabase.from("materiale").select("*"),
      supabase
        .from("masini")
        .select("*, masini_materiale(id, cantitate_folosita, materiale(nume, unitate))")
        .order("data", { ascending: false })
        .limit(6),
    ]);

    setMateriale(materialeRes.data || []);
    setMasini(masiniRes.data || []);
    setLoading(false);
  }

  const totalMateriale = materiale.length;
  const stocRedus = materiale.filter(
    (m) => m.prag_minim !== null && m.prag_minim !== undefined && Number(m.cantitate) <= Number(m.prag_minim)
  );
  const valoareStoc = materiale.reduce((sum, m) => sum + (Number(m.cantitate) || 0) * (Number(m.pret) || 0), 0);

  const azi = new Date();
  const inceputSaptamana = new Date(azi);
  inceputSaptamana.setDate(azi.getDate() - azi.getDay() + 1);
  inceputSaptamana.setHours(0, 0, 0, 0);
  const lucrariSaptamanaAsta = masini.filter((m) => new Date(m.data) >= inceputSaptamana).length;

  return (
    <div className="shell">
      <Nav />
      <h1>Dashboard</h1>
      <p className="subtitle">Privire de ansamblu asupra stocului și lucrărilor de vopsire.</p>

      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-top">
            Materiale <IconBox />
          </div>
          <div className="stat-value">{loading ? "—" : totalMateriale}</div>
          <div className="stat-sub">în stoc</div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            Stoc redus <IconAlert />
          </div>
          <div className="stat-value">{loading ? "—" : stocRedus.length}</div>
          <div className={`stat-sub ${stocRedus.length > 0 ? "danger" : ""}`}>
            {stocRedus.length > 0 ? "necesită comandă" : "totul e ok"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            Lucrări săpt. <IconCar />
          </div>
          <div className="stat-value">{loading ? "—" : lucrariSaptamanaAsta}</div>
          <div className="stat-sub">mașini vopsite</div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            Valoare stoc <IconCoin />
          </div>
          <div className="stat-value">{loading ? "—" : `${valoareStoc.toFixed(0)}`}</div>
          <div className="stat-sub">MDL, estimat</div>
        </div>
      </div>

      {!loading && stocRedus.length > 0 && (
        <div className="alert danger">
          <div className="alert-left">
            <IconAlert />
            {stocRedus.length} {stocRedus.length === 1 ? "material are" : "materiale au"} stoc redus.
          </div>
          <Link href="/materiale">
            <button className="btn secondary small">Deschide materiale</button>
          </Link>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 8 }}>
        <Link href="/materiale" className="home-card">
          <div className="eyebrow">Stoc</div>
          <h2>Materiale pentru vopsire</h2>
          <p>Vopsele, diluanți, lac, consumabile — cantitate, cod/culoare, preț, furnizor.</p>
        </Link>
        <Link href="/masini" className="home-card">
          <div className="eyebrow">Lucrări</div>
          <h2>Mașini vopsite</h2>
          <p>Pe ce mașini ai lucrat, ce s-a făcut și ce materiale s-au consumat.</p>
        </Link>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        Ultimele lucrări
      </div>
      <div className="card">
        {loading ? (
          <div className="empty">Se încarcă...</div>
        ) : masini.length === 0 ? (
          <div className="empty">Nicio lucrare înregistrată încă.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mașină</th>
                <th>Data</th>
                <th>Lucrare</th>
                <th>Materiale</th>
              </tr>
            </thead>
            <tbody>
              {masini.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 700 }}>{m.numar_inmatriculare}</td>
                  <td>{new Date(m.data).toLocaleDateString("ro-RO")}</td>
                  <td>{m.lucrare || "—"}</td>
                  <td>
                    {m.masini_materiale?.length > 0
                      ? m.masini_materiale.map((mm) => mm.materiale?.nume).join(", ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
