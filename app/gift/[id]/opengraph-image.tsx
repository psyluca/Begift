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
 *   - Sfondo sfumato rosa brand + decorazioni emoji sparse (opacity bassa)
 *   - Emoji 🎁 grande al centro in Twemoji HD
 *   - Titolo "Un regalo per {recipient}"
 *   - Sottotitolo "da {sender}" (se disponibile)
 *   - Logo/wordmark "BeGift" in basso
 *
 * Dimensioni: 1200×630 è lo standard OpenGraph (ratio 1.91:1) che
 * WhatsApp, Facebook, LinkedIn, Telegram, Twitter summary_large_image
 * usano. Le piattaforme mobile comprimono a thumbnail ~400px: per
 * mantenere nitidezza anche nella thumbnail, raddoppio tutte le
 * dimensioni interne (emoji 280px, titolo 84px, wordmark 36px) così
 * che dopo il downsampling il risultato resti leggibile e visibile.
 *
 * Emoji: opzione `emoji: 'twemoji'` passata a ImageResponse per
 * forzare il rendering Twitter Twemoji HD invece del fallback
 * system font che su alcuni crawler renderizza quadratini vuoti.
 */

// Metadata richieste dalle convenzioni Next per opengraph-image.
// Nota: NON usiamo runtime=edge qui perché createSupabaseServer usa
// next/headers cookies() che in alcune configurazioni edge non è
// disponibile. Node runtime funziona benissimo per OG image generation
// — Vercel cacha automaticamente il PNG risultante sui suoi edge.
export const alt = "Un regalo su BeGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Mappa emoji per la "personalizzazione" dell'OG image basata su
 *  template_type (priorita' 1) e packaging.theme (priorita' 2).
 *  Se nessuno match, fallback a 🎁 generico. */
function pickEmoji(templateType: string | null, theme: string | null): { emoji: string; subtitle: string | null } {
  // Template hanno la priorita' (sono espliciti, scelti deliberatamente)
  if (templateType === "mothers_day_letter") return { emoji: "💐", subtitle: "Festa della Mamma" };
  if (templateType === "fathers_day_letter") return { emoji: "🌳", subtitle: "Festa del Papà" };
  // Theme del packaging come fallback
  if (theme === "easter")     return { emoji: "🐰", subtitle: "Pasqua" };
  if (theme === "graduation") return { emoji: "🎓", subtitle: "Laurea" };
  if (theme === "birthday")   return { emoji: "🎂", subtitle: "Compleanno" };
  if (theme === "kawaii")     return { emoji: "🌸", subtitle: null };
  // Default: emoji regalo classica, niente sottotitolo occasione
  return { emoji: "🎁", subtitle: null };
}

export default async function OGImage({ params }: { params: { id: string } }) {
  // Fetch del gift lato server per personalizzare l'immagine.
  let recipient = "te";
  let sender: string | null = null;
  let templateType: string | null = null;
  let theme: string | null = null;
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("gifts")
      .select("recipient_name, sender_alias, template_type, packaging")
      .eq("id", params.id)
      .single();
    if (data?.recipient_name) recipient = data.recipient_name;
    const d = data as { sender_alias?: string; template_type?: string; packaging?: { theme?: string } } | null;
    if (d?.sender_alias) sender = d.sender_alias;
    if (d?.template_type) templateType = d.template_type;
    if (d?.packaging?.theme) theme = d.packaging.theme;
  } catch {
    // Fallback ai default — l'immagine si genera comunque
  }
  const { emoji: heroEmoji, subtitle: occasionLabel } = pickEmoji(templateType, theme);

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
        {/* Emoji decorative di sfondo — molto trasparenti, sparse */}
        <div style={{ position: "absolute", top: 50, left: 90, fontSize: 80, opacity: 0.15, display: "flex" }}>✨</div>
        <div style={{ position: "absolute", top: 120, right: 110, fontSize: 110, opacity: 0.18, display: "flex" }}>💝</div>
        <div style={{ position: "absolute", bottom: 140, left: 80, fontSize: 90, opacity: 0.14, display: "flex" }}>🎀</div>
        <div style={{ position: "absolute", bottom: 100, right: 90, fontSize: 70, opacity: 0.17, display: "flex" }}>✨</div>

        {/* Emoji grande al centro — contestuale all'occasione (template
            speciale o theme del packaging). Default 🎁 generico. */}
        <div
          style={{
            fontSize: 240,
            lineHeight: 1,
            marginBottom: 24,
            filter: "drop-shadow(0 14px 36px rgba(212,83,126,.35))",
            display: "flex",
          }}
        >
          {heroEmoji}
        </div>

        {/* Pre-titolo seasonal: visibile solo se il gift e' un template
            (Festa Mamma/Papa') o ha un theme di occasione. Aiuta il
            destinatario a riconoscere il "perche'" del regalo prima
            ancora di aprirlo, e fa branding di occasione su WhatsApp. */}
        {occasionLabel && (
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#D4537E",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 14,
              display: "flex",
            }}
          >
            {occasionLabel}
          </div>
        )}

        {/* Titolo "Un regalo per X" — bold e grande per leggibilità anche in thumbnail */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "#1a1a1a",
            textAlign: "center",
            marginBottom: 14,
            lineHeight: 1.05,
            letterSpacing: "-.015em",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>Un regalo per </span>
          <span style={{ color: "#D4537E", marginLeft: 18 }}>{recipient}</span>
        </div>

        {/* Sottotitolo "da Y" — solo se sender presente */}
        {sender && (
          <div
            style={{
              fontSize: 42,
              color: "#4a4a4a",
              fontWeight: 500,
              display: "flex",
            }}
          >
            <span>da </span>
            <span style={{ color: "#1a1a1a", fontWeight: 800, marginLeft: 14 }}>
              {sender}
            </span>
          </div>
        )}

        {/* Footer brand — più grande e marcato */}
        <div
          style={{
            position: "absolute",
            bottom: 46,
            fontSize: 36,
            fontWeight: 900,
            color: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            letterSpacing: "-.015em",
          }}
        >
          <span>Be</span>
          <span style={{ color: "#D4537E" }}>Gift</span>
        </div>
      </div>
    ),
    {
      ...size,
      // Twemoji HD renderer: evita emoji quadratini/vuoti
      // su crawler che non hanno font emoji nativi
      emoji: "twemoji",
    }
  );
}
