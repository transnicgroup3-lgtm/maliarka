"use client";

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ maxWidth: 380, width: "100%" }}
      >
        <h1 style={{ fontSize: 17, marginBottom: 8 }}>{title || "Confirmă"}</h1>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn secondary" onClick={onCancel}>
            Anulează
          </button>
          <button className="btn danger" style={{ borderColor: "var(--danger)" }} onClick={onConfirm}>
            Șterge
          </button>
        </div>
      </div>
    </div>
  );
}
