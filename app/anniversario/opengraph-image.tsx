import { ImageResponse } from "next/og";

/**
 * Open Graph image per /anniversario — landing SEO evergreen.
 *
 * Palette rosa antico + oro. Emoji 💞 centrale.
 * Distinta da /matrimonio (avorio+oro) e /san-valentino (rosso passione).
 */

export const alt = "Regalo per anniversario digitale — BeGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AnniversarioOG() {
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
            "linear-gradient(135deg, #FBE3E3 0%, #F2BFC0 55%, #E8A0A0 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decor */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 100,
            fontSize: 80,
            opacity: 0.22,
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
            fontSize: 110,
            opacity: 0.18,
            display: "flex",
          }}
        >
          🌹
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: 80,
            fontSize: 88,
            opacity: 0.2,
            display: "flex",
          }}
        >
          💌
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 100,
            right: 100,
            fontSize: 72,
            opacity: 0.22,
            display: "flex",
          }}
        >
          ✨
        </div>

        {/* Hero emoji */}
        <div
          style={{
            fontSize: 240,
            lineHeight: 1,
            marginBottom: 28,
            filter: "drop-shadow(0 14px 36px rgba(120,40,60,.32))",
            display: "flex",
          }}
        >
          💞
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#C8941E",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: 16,
            display: "flex",
          }}
        >
          Regalo di anniversario
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "#1a1a1a",
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
          <span>Il vostro tempo, </span>
          <span style={{ color: "#D4537E", marginLeft: 18 }}>insieme</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 30,
            color: "#5a3a3a",
            fontWeight: 500,
            display: "flex",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Foto, video, canzoni e parole della vostra storia in un pacco animato.
        </div>

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            bottom: 46,
            fontSize: 38,
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
    { ...size, emoji: "twemoji" }
  );
}
