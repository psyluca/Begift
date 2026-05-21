"use client";

/**
 * Immagine card del catalogo con fallback automatico.
 *
 * Problema riscontrato 2026-05-21: le immagini delle esperienze (sia GYG
 * che VVT) talvolta non si caricano in produzione perche':
 *   - l'image_url e' null (seed senza immagine)
 *   - l'host blocca hotlinking (403/CORS) verso il dominio Vercel
 *   - l'URL e' temporaneamente fuori uso
 *
 * In tutti questi casi vogliamo che la card NON resti vuota o con un'area
 * trasparente che fa "scappare" il titolo: mostriamo un placeholder
 * categoria-specifico (emoji su gradient) cosi' la card mantiene comunque
 * un'identita' visiva forte e leggibile.
 *
 * Il fallback gira anche lato server (SSR) quando src e' null/empty:
 * partiamo subito col placeholder e non chiediamo nemmeno il caricamento.
 */
import { useState } from "react";

export default function CatalogCardImage({
  src,
  alt,
  placeholderEmoji,
  placeholderGradient,
}: {
  src: string | null;
  alt: string;
  placeholderEmoji: string;
  placeholderGradient: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  if (showPlaceholder) {
    return (
      <div
        style={{
          width: "100%",
          height: 170,
          background: placeholderGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
        }}
        aria-hidden
      >
        {placeholderEmoji}
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src!}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: "100%",
        height: 170,
        objectFit: "cover",
        background: "#f0ece6",
        display: "block",
      }}
    />
  );
}
