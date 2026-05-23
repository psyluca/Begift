import { ImageResponse } from "next/og";

/**
 * Open Graph image per /laurea — landing SEO.
 *
 * Mostrata quando l'URL viene condiviso su WhatsApp, Telegram,
 * iMessage, Facebook, LinkedIn, Twitter. La preview ricca aumenta
 * il CTR sui link condivisi del 40-80% (stat industry).
 *
 * Design coerente con /gift/[id]/opengraph-image.tsx ma adattato
 * alla landing: niente nome destinatario (la pagina e' generica
 * per visitatori), invece focus su keyword + emoji 🎓 e claim.
 */

export const alt = "Regalo di laurea digitale — BeGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function LaureaOG() {
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
          background:
            "linear-gradient(135deg, #1A3A6B 0%, #2a4f8f 55%, #1a3a6b 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Emoji decorative di sfondo */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 100,
            fontSize: 80,
            opacity: 0.18,
            display: "flex",
          }}
        >
          ✨
        </div>
        <div
          style={{
            position: "absolute",
            top: 140,
            right: 120,
            fontSize: 96,
            opacity: 0.16,
            display: "flex",
          }}
        >
          📜
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: 80,
            fontSize: 88,
            opacity: 0.14,
            display: "flex",
          }}
        >
          🎉
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 100,
            right: 100,
            fontSize: 72,
            opacity: 0.18,
            display: "flex",
          }}
        >
          ✨
        </div>

        {/* Emoji centrale */}
        <div
          style={{
            fontSize: 240,
            lineHeight: 1,
            marginBottom: 28,
            filter: "drop-shadow(0 14px 36px rgba(0,0,0,.45))",
            display: "flex",
          }}
        >
          🎓
        </div>

        {/* Eyebrow occasione */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#E8C84A",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: 16,
            display: "flex",
          }}
        >
          Regalo di laurea
        </div>

        {/* Titolo principale */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "#fff",
            textAlign: "center",
            marginBottom: 18,
            lineHeight: 1.05,
            letterSpacing: "-.02em",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 980,
          }}
        >
          <span>Un pacco digitale che apre </span>
          <span style={{ color: "#E8C84A", marginLeft: 18 }}>ricordi</span>
        </div>

        {/* Sottotitolo */}
        <div
          style={{
            fontSize: 30,
            color: "#cfd9eb",
            fontWeight: 500,
            display: "flex",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Video di auguri, foto del percorso, messaggi di chi non c&apos;era.
        </div>

        {/* Brand footer */}
        <div
          style={{
            position: "absolute",
            bottom: 46,
            fontSize: 38,
            fontWeight: 900,
            color: "#fff",
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
    { ...size, emoji: "twemoji" }
  );
}
