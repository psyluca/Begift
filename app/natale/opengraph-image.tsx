import { ImageResponse } from "next/og";

/**
 * Open Graph image per /natale — landing SEO stagionale.
 *
 * Palette verde bosco + nastro rosso + accenti oro.
 * Emoji 🎄 centrale.
 *
 * Distinta da:
 *  - /anniversario (rosa antico + oro)
 *  - /matrimonio (avorio + oro)
 *  - /san-valentino (rosso passione + rosa)
 */

export const alt = "Regalo di Natale digitale — BeGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function NataleOG() {
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
            "linear-gradient(135deg, #E8F2EA 0%, #8FBF9D 55%, #3B8C5A 100%)",
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
          ❄️
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
          ✨
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
          🔔
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
          ❄️
        </div>

        {/* Hero emoji */}
        <div
          style={{
            fontSize: 240,
            lineHeight: 1,
            marginBottom: 28,
            filter: "drop-shadow(0 14px 36px rgba(20,60,30,.36))",
            display: "flex",
          }}
        >
          🎄
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
          Regalo di Natale
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "#fffaf0",
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
          <span>Per chi è </span>
          <span style={{ color: "#D85A5A", marginLeft: 18 }}>lontano</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 30,
            color: "#fffaf0",
            fontWeight: 500,
            display: "flex",
            textAlign: "center",
            maxWidth: 820,
            opacity: 0.95,
          }}
        >
          Foto, video, lettere e voucher in un pacco che si apre la Vigilia.
        </div>

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            bottom: 46,
            fontSize: 38,
            fontWeight: 900,
            color: "#fffaf0",
            display: "flex",
            alignItems: "center",
            letterSpacing: "-.015em",
          }}
        >
          <span>Be</span>
          <span style={{ color: "#D85A5A" }}>Gift</span>
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji" }
  );
}
