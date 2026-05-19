"use client";

/**
 * Form creazione nuovo pacco coupon per BeGift Business.
 *
 * Flow:
 *  1. Compila destinatario + titolo coupon + validità + messaggio
 *  2. Upload del file coupon (PDF/immagine)
 *  3. Scelta packaging (3 preset semplici per ora)
 *  4. Submit → POST /api/business/gifts → success screen con link da copiare
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAuthed } from "@/lib/clientAuth";
import type { Packaging } from "@/types";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";

const PACKAGING_PRESETS: Array<{ id: string; label: string; packaging: Packaging }> = [
  {
    id: "rosa",
    label: "Rosa classico",
    packaging: {
      paperColor: "#F4C0D1",
      ribbonColor: "#D4537E",
      bowColor: "#D4537E",
      bowType: "classic",
      openAnimation: "lift",
      sound: "bells",
    },
  },
  {
    id: "verde",
    label: "Natura zen",
    packaging: {
      paperColor: "#C0DDD0",
      ribbonColor: "#3B6D11",
      bowColor: "#3B6D11",
      bowType: "simple",
      openAnimation: "unfold",
      sound: "chime",
    },
  },
  {
    id: "oro",
    label: "Elegante oro",
    packaging: {
      paperColor: "#FAEEDA",
      ribbonColor: "#BA7517",
      bowColor: "#BA7517",
      bowType: "rosette",
      openAnimation: "lift",
      sound: "magic",
    },
  },
];

type SubmitState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "submitting" }
  | { kind: "success"; openUrl: string }
  | { kind: "error"; message: string };

export default function NewPackClient() {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [couponTitle, setCouponTitle] = useState("");
  const [couponValidity, setCouponValidity] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [packagingId, setPackagingId] = useState(PACKAGING_PRESETS[0].id);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const selectedPackaging =
    PACKAGING_PRESETS.find((p) => p.id === packagingId)?.packaging ||
    PACKAGING_PRESETS[0].packaging;

  const canSubmit =
    recipientName.trim().length > 0 &&
    couponTitle.trim().length > 0 &&
    file !== null &&
    state.kind !== "uploading" &&
    state.kind !== "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;

    setState({ kind: "uploading" });

    // 1. Upload coupon
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetchAuthed("/api/business/upload-coupon", {
      method: "POST",
      body: form,
    });
    if (!uploadRes.ok) {
      const err = (await uploadRes.json().catch(() => ({}))) as { error?: string };
      setState({ kind: "error", message: `upload failed: ${err.error || uploadRes.status}` });
      return;
    }
    const uploadData = (await uploadRes.json()) as { url: string };

    // 2. Crea pacco
    setState({ kind: "submitting" });
    const createRes = await fetchAuthed("/api/business/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_name: recipientName.trim(),
        message: message.trim() || null,
        coupon_file_url: uploadData.url,
        coupon_title: couponTitle.trim(),
        coupon_validity: couponValidity.trim() || null,
        packaging: selectedPackaging,
      }),
    });
    if (!createRes.ok) {
      const err = (await createRes.json().catch(() => ({}))) as { error?: string };
      setState({ kind: "error", message: `create failed: ${err.error || createRes.status}` });
      return;
    }
    const createData = (await createRes.json()) as { open_url: string };
    setState({ kind: "success", openUrl: createData.open_url });
  }

  if (state.kind === "success") {
    return (
      <main
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "30px 16px 80px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          color: INK,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
          Pacco creato!
        </h1>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>
          Copia il link e invialo a {recipientName} via WhatsApp, email o come preferisci.
        </p>
        <div
          style={{
            background: SOFT_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            wordBreak: "break-all",
            marginBottom: 16,
            fontFamily: "monospace",
          }}
        >
          {state.openUrl}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(state.openUrl);
              alert("Link copiato!");
            }}
            style={{
              background: ACCENT,
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 50,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Copia link
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Ti ho mandato un regalo: ${state.openUrl}`
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#25D366",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 50,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            WhatsApp
          </a>
        </div>
        <Link
          href="/business"
          style={{ color: ACCENT, fontSize: 13, textDecoration: "underline" }}
        >
          ← Torna alla dashboard
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "20px 16px 80px",
        fontFamily: "system-ui, sans-serif",
        color: INK,
      }}
    >
      <Link
        href="/business"
        style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}
      >
        ← dashboard
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 20px" }}>
        Nuovo pacco coupon
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Destinatario">
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="es. Maria Rossi"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Cosa contiene il coupon">
          <input
            type="text"
            value={couponTitle}
            onChange={(e) => setCouponTitle(e.target.value)}
            placeholder="es. Massaggio 60 minuti"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Validità (opzionale)">
          <input
            type="text"
            value={couponValidity}
            onChange={(e) => setCouponValidity(e.target.value)}
            placeholder="es. 6 mesi"
            style={inputStyle}
          />
        </Field>

        <Field label="File del coupon (PDF o immagine)">
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            style={{ ...inputStyle, padding: 8 }}
          />
          <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>
            Max 10MB. Sarà scaricabile dal destinatario.
          </p>
        </Field>

        <Field label="Messaggio personale (opzionale)">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Per il tuo compleanno, un'ora tutta per te 🌿"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <Field label="Packaging">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {PACKAGING_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackagingId(p.id)}
                style={{
                  background: p.packaging.paperColor,
                  border:
                    packagingId === p.id ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: "16px 8px",
                  fontSize: 11,
                  color: INK,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        {state.kind === "error" && (
          <div
            style={{
              background: "#FCEBEB",
              color: "#A32D2D",
              padding: 10,
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            background: canSubmit ? ACCENT : "#ddd",
            color: "#fff",
            border: "none",
            padding: "12px 16px",
            borderRadius: 50,
            fontSize: 14,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            marginTop: 8,
          }}
        >
          {state.kind === "uploading"
            ? "Carico il coupon…"
            : state.kind === "submitting"
            ? "Creo il pacco…"
            : "Genera link →"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontSize: 14,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  outline: "none",
  background: "#fff",
  color: INK,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{label}</span>
      {children}
    </label>
  );
}
