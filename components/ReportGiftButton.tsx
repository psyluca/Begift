"use client";

/**
 * ReportGiftButton — bottone "Segnala" piccolo e discreto visibile
 * SEMPRE nella pagina gift opening, sia a utenti loggati che anonimi.
 *
 * Requisito DSA art. 16 "notice and action mechanism": ogni
 * piattaforma deve offrire un meccanismo facile per segnalare
 * contenuti illegali o che violano i termini.
 *
 * UX: bottone discreto in basso nella pagina (non invadente),
 * al click apre un modal con:
 *  - Lista categorie pre-definite (radio)
 *  - Textarea descrizione opzionale
 *  - Pulsante "Invia segnalazione"
 *
 * Chiamata anonima se l'utente non è loggato (supportato dall'endpoint).
 */

import { useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e8e4de";

type Category = "illegal" | "disturbing" | "spam" | "copyright" | "privacy" | "other";

const CATEGORIES: { value: Category; label: string; desc: string }[] = [
  { value: "illegal", label: "⚠️ Contenuto illegale", desc: "Pedopornografia, violenza esplicita, terrorismo" },
  { value: "disturbing", label: "😰 Disturbante", desc: "Autolesionismo, contenuti shock" },
  { value: "privacy", label: "🔒 Violazione privacy", desc: "Foto o dati di terzi senza consenso" },
  { value: "copyright", label: "©️ Violazione copyright", desc: "Materiale protetto da diritti" },
  { value: "spam", label: "🗑️ Spam / abuso", desc: "Uso improprio della piattaforma" },
  { value: "other", label: "❓ Altro", desc: "Specifica nel messaggio" },
];

export function ReportGiftButton({ giftId }: { giftId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!category) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetchAuthed("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId, category, description: description.trim() || undefined }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          // Reset dopo chiusura
          setTimeout(() => {
            setDone(false);
            setCategory(null);
            setDescription("");
          }, 400);
        }, 2000);
      } else {
        const json = await res.json().catch(() => ({}));
        if (json.error === "rate_limited") {
          setError(json.message || "Troppe segnalazioni. Riprova più tardi.");
        } else {
          setError("Errore nell'invio. Riprova.");
        }
      }
    } catch (e) {
      console.error("[report] submit failed", e);
      setError("Errore di rete. Riprova.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Link piccolo discreto — pattern "piè di pagina" */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          border: "none",
          color: MUTED,
          fontSize: 11,
          textDecoration: "underline",
          cursor: "pointer",
          padding: 4,
          fontFamily: "inherit",
        }}
      >
        Segnala contenuto inappropriato
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(6px)",
            zIndex: 10_000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "24px 22px",
              maxWidth: 460,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,.3)",
            }}
          >
            {done ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: DEEP, margin: "0 0 8px" }}>
                  Segnalazione inviata
                </h3>
                <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>
                  Grazie. Esamineremo la tua segnalazione al più presto.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: DEEP, margin: 0 }}>
                    Segnala questo regalo
                  </h3>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Chiudi"
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: 22,
                      color: MUTED,
                      cursor: "pointer",
                      padding: 4,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px", lineHeight: 1.5 }}>
                  Scegli il motivo della segnalazione. Il nostro team la esaminerà e prenderà provvedimenti se necessario.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {CATEGORIES.map((c) => {
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        style={{
                          background: active ? "#fff5f8" : "#fff",
                          border: `1.5px solid ${active ? ACCENT : BORDER}`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all .14s",
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700, color: active ? ACCENT : DEEP, marginBottom: 2 }}>
                          {c.label}
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.35 }}>
                          {c.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label style={{ display: "block", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
                    Dettagli (opzionale)
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Aggiungi informazioni che possono aiutarci…"
                    maxLength={2000}
                    rows={3}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: `1.5px solid ${BORDER}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: DEEP,
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </label>

                {error && (
                  <div style={{ fontSize: 12, color: "#B71C1C", marginBottom: 10 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={!category || sending}
                  style={{
                    width: "100%",
                    background: category && !sending ? ACCENT : "#e0dbd5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 40,
                    padding: "13px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: category && !sending ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                  }}
                >
                  {sending ? "Invio…" : "Invia segnalazione"}
                </button>

                <p style={{ fontSize: 10, color: "#bbb", margin: "12px 0 0", lineHeight: 1.4, textAlign: "center" }}>
                  Puoi anche scriverci direttamente a{" "}
                  <a href="mailto:abuse@begift.app" style={{ color: ACCENT }}>abuse@begift.app</a>.
                  <br/>
                  Per contenuti illegali gravi (es. materiale pedopornografico), contatta anche la Polizia Postale a{" "}
                  <a href="https://www.commissariatodips.it/" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>
                    commissariatodips.it
                  </a>.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
