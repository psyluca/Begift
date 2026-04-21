import { ImageResponse } from "next/og";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Dynamic OpenGraph image per ogni regalo.
 *
 * Convenzione Next 14 App Router: qualunque file chiamato
 * `opengraph-image.tsx` dentro una cartella route viene automaticamente
 * pubblicato all'URL `<route>/opengraph-image` e linkato nei meta tag
 * della pagina. Il default export deve ritornare una ImageResponse.
 *
 * Render:
 *   - Sfondo sfumato rosa brand (#fff5f8 → #ffeef4)
 *   - Emoji 🎁 grande al centro (200px)
 *   - Titolo "Un regalo per {recipient}"
 *   - Sottotitolo "da {sender}" (se disponibile)
 *   - Logo/wordmark "BeGift" in basso
 *
 * Dimensioni standard OpenGraph: 1200×630 (ratio 1.91:1), che è
 * quello che WhatsApp, Facebook, LinkedIn, Twitter summary_large_image
 * usano per le anteprime link.
 */

// Metadata richieste dalle convenzioni Next per opengraph-image.
// Nota: NON usiamo runtime=edge qui perché createSupabaseServer usa
// next/headers cookies() che in alcune configurazioni edge non è
// disponibile. Node runtime funziona benissimo per OG image generation
// — Vercel cacha automaticamente il PNG risultante sui suoi edge,
// quindi la performance per la seconda visita è identica.
export const alt = "Un regalo su BeGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: { id: string } }) {
  // Fetch del gift lato server (edge) per personalizzare l'immagine.
  // Usiamo il service role via Supabase server client standard;
  // l'immagine viene generata on-demand e Vercel la cacha automaticamente.
  let recipient = "te";
  let sender: string | null = null;
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("gifts")
      .select("recipient_name, sender_alias")
      .eq("id", params.id)
      .single();
    if (data?.recipient_name) recipient = data.recipient_name;
    if ((data as { sender_alias?: string } | null)?.sender_alias) {
      sender = (data as { sender_alias: string }).sender_alias;
    }
  } catch {
    // Fallback ai default se la query fallisce — l'immagine si
    // genera comunque, solo senza personalizzazione
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff5f8 0%, #ffeef4 50%, #fdd8e3 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Emoji regalo grande */}
        <div
          style={{
            fontSize: 200,
            lineHeight: 1,
            marginBottom: 30,
            filter: "drop-shadow(0 10px 30px rgba(212,83,126,.3))",
          }}
        >
          🎁
        </div>

        {/* Titolo "Un regalo per X" */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#1a1a1a",
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 1.1,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>Un regalo per </span>
          <span style={{ color: "#D4537E", marginLeft: 16 }}>{recipient}</span>
        </div>

        {/* Sottotitolo "da Y" — solo se sender_alias presente */}
        {sender && (
          <div
            style={{
              fontSize: 36,
              color: "#666",
              fontWeight: 500,
              display: "flex",
            }}
          >
            <span>da </span>
            <span style={{ color: "#1a1a1a", fontWeight: 700, marginLeft: 12 }}>
              {sender}
            </span>
          </div>
        )}

        {/* Footer brand — fisso in basso */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 28,
            fontWeight: 800,
            color: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            letterSpacing: "-.01em",
          }}
        >
          <span>Be</span>
          <span style={{ color: "#D4537E" }}>Gift</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
