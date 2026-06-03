"use client";

/**
 * GiftShareClient — schermata di condivisione del regalo creato.
 *
 * Mostra:
 *  - Heading "Regalo pronto!"
 *  - Link copyable (input + bottone Copia)
 *  - ShareButton (Web Share API + fallback WhatsApp)
 *  - Anteprima per il mittente (apre il regalo con ?preview=1)
 *  - Link "Modifica pacchetto" -> /gift/[id]/edit
 *  - Link "Vai alla dashboard"
 *
 * NB: questo componente NON apre il gift (a differenza di
 * /gift/[id] che è la pagina di apertura). Quindi il mittente non
 * "consuma" l'apertura del proprio regalo per il destinatario.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { track } from "@/lib/analytics";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";

interface Props {
  giftId: string;
  recipientName: string;
  /** creator_id passato dalla page server-side per non rifare la query. */
  creatorId: string;
}

export default function GiftShareClient({
  giftId,
  recipientName,
  creatorId: _creatorId,
}: Props) {
  const [giftUrl, setGiftUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Calcolato client-side: window.location.origin garantisce coerenza
    // con il dominio attualmente servito (begift.app in prod, preview
    // su vercel.app, localhost in dev), senza dover passare BASE_URL.
    try {
      setGiftUrl(`${window.location.origin}/gift/${giftId}`);
    } catch {
      setGiftUrl(`/gift/${giftId}`);
    }
    track("gift_share_screen_viewed", { gift_id: giftId });
  }, [giftId]);

  const copy = async () => {
    if (!giftUrl) return;
    try {
      await navigator.clipboard.writeText(giftUrl);
      setCopied(true);
      track("gift_url_copied", { gift_id: giftId });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback per browser sandbox: selezione manuale
      window.prompt("Copia il link:", giftUrl);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "32px 16px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: INK,
            margin: "0 0 8px",
            letterSpacing: "-0.3px",
          }}
        >
          Regalo pronto!
        </h1>
        <p
          style={{
            fontSize: 14,
            color: MUTED,
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          Condividi il link con{" "}
          <strong style={{ color: INK }}>{recipientName}</strong>
        </p>

        {/* Link copyable */}
        <div
          style={{
            background: CARD,
            borderRadius: 16,
            padding: 14,
            border: `1px solid ${BORDER}`,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                background: SOFT_BG,
                borderRadius: 9,
                padding: "10px 12px",
                fontSize: 13,
                color: "#555",
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
              }}
              title={giftUrl}
            >
              {giftUrl || "…"}
            </div>
            <button
              type="button"
              onClick={copy}
              style={{
                background: copied ? "#3CB371" : ACCENT,
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background .2s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copiato!" : "Copia"}
            </button>
          </div>
        </div>

        {/* Share primary CTA */}
        {giftUrl && (
          <div style={{ marginBottom: 24 }}>
            <ShareButton
              giftUrl={giftUrl}
              recipientName={recipientName}
            />
          </div>
        )}

        {/* Anteprima (apre il gift in modalita' preview, senza consumare
            l'apertura per il destinatario). */}
        <div style={{ marginTop: 8 }}>
          <a
            href={`/gift/${giftId}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#fff5f8",
              color: ACCENT,
              border: `1.5px solid #f9c8d9`,
              borderRadius: 40,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            👁️ Vedi anteprima
          </a>
        </div>

        {/* Secondary actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <Link
            href={`/gift/${giftId}/edit`}
            style={{
              background: "#f0f4ff",
              color: "#3B5BDB",
              border: "1.5px solid #3B5BDB",
              borderRadius: 40,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ✏️ Modifica pacchetto
          </Link>
          <Link
            href="/dashboard"
            style={{
              background: "transparent",
              color: MUTED,
              border: `1.5px solid ${BORDER}`,
              borderRadius: 40,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
