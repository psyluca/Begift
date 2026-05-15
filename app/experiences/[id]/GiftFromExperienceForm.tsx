"use client";

/**
 * Form client per creare un gift da un'esperienza del catalogo.
 *
 * Chiama POST /api/experiences/[id]/regalo con recipient_name + message.
 * Su success: redirect a /gift/[id]/manage per ulteriori personalizzazioni
 * (lo stesso pattern del flusso email parser draft → completion).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";

interface Props {
  experienceId: string;
  experienceTitle: string;
  partnerName: string;
}

export default function GiftFromExperienceForm({
  experienceId,
  experienceTitle,
  partnerName,
}: Props) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState(
    `Ho pensato a te per ${experienceTitle}: te la regalo per quel giorno speciale che ci aspetta.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!recipientName.trim() || !message.trim()) {
      setError("Scrivi il nome del destinatario e un messaggio.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchAuthed(
        `/api/experiences/${experienceId}/regalo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient_name: recipientName.trim(),
            message: message.trim(),
            source: "discover_page",
          }),
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (res.status === 401) {
          // Non loggato → manda a login con next = questa pagina
          router.push(
            `/auth/login?next=${encodeURIComponent(
              `/experiences/${experienceId}`
            )}`
          );
          return;
        }
        setError(
          data.error || "Errore durante la creazione del regalo. Riprova."
        );
        return;
      }
      const data = (await res.json()) as { gift_id: string };
      router.push(`/gift/${data.gift_id}/manage`);
    } catch {
      setError("Errore di rete. Riprova fra un momento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: INK,
          margin: "0 0 12px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Regalala
      </h3>

      <label style={labelStyle}>A chi vuoi regalarla?</label>
      <input
        type="text"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        placeholder="Mamma, Lucia, papà…"
        style={inputStyle}
      />

      <label style={{ ...labelStyle, marginTop: 16 }}>
        Il tuo messaggio
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" as const }}
        placeholder="Scrivi qualcosa di tuo…"
      />

      {error && (
        <p style={{ fontSize: 13, color: "#c0392b", margin: "12px 0 0" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "14px 16px",
          background: ACCENT,
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          borderRadius: 50,
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
          boxShadow: "0 10px 28px rgba(212,83,126,.28)",
        }}
      >
        {submitting ? "Sto creando il pacco…" : `Regala via ${partnerName} →`}
      </button>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: MUTED,
  marginBottom: 6,
} as const;

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  border: "1px solid #ddd",
  borderRadius: 8,
  boxSizing: "border-box" as const,
} as const;
