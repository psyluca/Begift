"use client";

/**
 * UI client del draft completion. POC minimale.
 *
 * Mostra:
 *  - Info parsing (cosa BeGift ha capito dall'email)
 *  - Form per aggiungere messaggio emozionale + destinatario
 *  - Bottone "Completa e invia"
 *
 * Quando l'utente conferma, chiama /api/draft/[id]/complete che:
 *  1. Crea un nuovo record in `gifts` con i dati pre-popolati
 *  2. Aggiorna gift_drafts.status='completed' + gift_id
 *  3. Redirect al flusso standard di share del gift
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#fbf9f5";

interface Props {
  draftId: string;
  status: string;
  detectedMerchant: string | null;
  parsedContent: Record<string, unknown> | null;
  sourceEmailFrom: string;
  sourceEmailSubject: string | null;
  parserConfidence: number | null;
}

export default function DraftCompletionClient({
  draftId,
  status,
  detectedMerchant,
  parsedContent,
  sourceEmailFrom,
  sourceEmailSubject,
  parserConfidence,
}: Props) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState(
    (parsedContent?.suggested_message as string) || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "pending") {
    return (
      <main style={mainStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Sto leggendo la tua mail…</h1>
          <p style={{ color: MUTED }}>
            Tra pochi secondi il tuo pacco sarà quasi pronto. Ricarica la
            pagina tra ~10 secondi.
          </p>
        </div>
      </main>
    );
  }

  if (status === "failed") {
    return (
      <main style={mainStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Non sono riuscito a leggere la mail</h1>
          <p style={{ color: MUTED }}>
            Il formato della mail forwardata non era riconoscibile.
            Puoi compilare il regalo manualmente come al solito.
          </p>
          <a href="/" style={buttonStyleSecondary}>
            Crea un regalo da zero
          </a>
        </div>
      </main>
    );
  }

  const title = (parsedContent?.title as string) || "Il tuo regalo";
  const subtitle = (parsedContent?.subtitle as string) || null;
  const eventDate = parsedContent?.event_date as string | null;
  const location = (parsedContent?.location as string) || null;
  const merchant = detectedMerchant || "merchant";
  const confidence = parserConfidence ?? 0;
  // Hero image estratta dall'HTML della mail (vedi pickHeroImages in
  // /api/email-inbox). Se presente la mostriamo come anteprima.
  const imageUrls = Array.isArray(parsedContent?.suggested_image_urls)
    ? (parsedContent!.suggested_image_urls as unknown[]).filter(
        (u): u is string => typeof u === "string"
      )
    : [];
  const heroImage = imageUrls[0] || null;

  const submit = async () => {
    if (!recipientName.trim() || !message.trim()) {
      setError("Per favore, scrivi il nome del destinatario e un messaggio.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/draft/${draftId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientName, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ||
            "Errore durante la creazione del regalo. Riprova."
        );
        return;
      }
      const data = await res.json();
      router.push(`/gift/${data.gift_id}/manage`);
    } catch (e) {
      setError("Errore di rete. Riprova tra un momento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>
          Pacco pre-compilato da {merchant} ({Math.round(confidence * 100)}% sicuro)
        </p>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && (
          <p style={{ color: MUTED, marginBottom: 16 }}>{subtitle}</p>
        )}

        {heroImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heroImage}
            alt={title}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: 12,
              marginBottom: 16,
              display: "block",
              background: "#f0ece6",
            }}
            onError={(e) => {
              // Se l'immagine fallisce (link rotto, hotlink protetto),
              // nasconde silenziosamente l'<img> invece di mostrare icona
              // rotta. Il flusso prosegue senza immagine.
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}

        <div style={detailGridStyle}>
          {eventDate && (
            <DetailRow
              label="Data"
              value={new Date(eventDate).toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          )}
          {location && <DetailRow label="Dove" value={location} />}
          {typeof parsedContent?.booking_code === "string" && (
            <DetailRow
              label="Codice"
              value={parsedContent.booking_code}
            />
          )}
          {typeof parsedContent?.voucher_code === "string" && (
            <DetailRow
              label="Voucher"
              value={parsedContent.voucher_code}
            />
          )}
        </div>

        <hr style={hrStyle} />

        <label style={labelStyle}>A chi vuoi regalarlo?</label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Mamma, Lucia, papà…"
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 16 }}>
          Il tuo messaggio per questo regalo
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={textareaStyle}
          placeholder="Scrivi qualcosa di tuo…"
        />
       {typeof parsedContent?.suggested_message === "string" && (
          <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Il messaggio sopra è un suggerimento di BeGift, puoi modificarlo come vuoi.
          </p>
        )}

        {error && (
          <p style={{ color: "#c0392b", marginTop: 12 }}>{error}</p>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          style={{
            ...buttonStyle,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Sto creando il regalo…" : "Completa e invia"}
        </button>

        <details style={{ marginTop: 32, fontSize: 12, color: MUTED }}>
          <summary style={{ cursor: "pointer" }}>Origine della mail</summary>
          <p style={{ marginTop: 8 }}>Da: {sourceEmailFrom}</p>
          <p>Oggetto: {sourceEmailSubject}</p>
        </details>
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
      <span style={{ color: INK, fontSize: 14, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// Inline styles per il POC (no design system per ora)
const mainStyle = {
  minHeight: "100vh",
  background: SOFT_BG,
  padding: "32px 16px",
  fontFamily: "system-ui, sans-serif",
} as const;

const cardStyle = {
  maxWidth: 560,
  margin: "0 auto",
  background: "white",
  borderRadius: 16,
  padding: "32px 24px",
  border: "1px solid #eee",
} as const;

const titleStyle = {
  fontSize: 24,
  fontWeight: 600,
  color: INK,
  marginBottom: 8,
} as const;

const detailGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 16,
  marginBottom: 16,
} as const;

const hrStyle = {
  border: "none",
  borderTop: "1px solid #eee",
  margin: "16px 0",
} as const;

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: MUTED,
  marginBottom: 6,
} as const;

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 16,
  border: "1px solid #ddd",
  borderRadius: 8,
  boxSizing: "border-box",
} as const;

const textareaStyle = {
  ...inputStyle,
  fontFamily: "system-ui, sans-serif",
  resize: "vertical",
} as const;

const buttonStyle = {
  marginTop: 24,
  width: "100%",
  padding: "14px 16px",
  background: ACCENT,
  color: "white",
  fontSize: 16,
  fontWeight: 500,
  border: "none",
  borderRadius: 10,
} as const;

const buttonStyleSecondary = {
  display: "inline-block",
  marginTop: 16,
  padding: "12px 18px",
  background: "white",
  color: ACCENT,
  border: `1px solid ${ACCENT}`,
  borderRadius: 10,
  textDecoration: "none",
} as const;
