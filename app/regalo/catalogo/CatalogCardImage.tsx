"use client";

/**
 * Immagine card del catalogo con fallback automatico.
 *
 * Problema riscontrato 2026-05-21: le immagini delle esperienze (GYG, VVT,
 * Awin, ecc.) NON si caricavano in produzione perche' i CDN dei partner
 * bloccano l'hotlinking — un browser su begift.app riceve 403/403 quando
 * chiede direttamente cdn.getyourguide.com/...jpg.
 *
 * Fix 2026-05-21: tutti gli URL esterni passano per il nostro image proxy
 * (/api/img-proxy?u=...) che fa fetch lato server (dove non c'e' Referer
 * problematico) e ritorna i bytes col caching giusto. Vedi la route per
 * dettagli sicurezza (whitelist host, max size, timeout).
 *
 * Fallback rimane: se anche il proxy fallisce (host non whitelisted,
 * immagine 404, ecc.) mostriamo il placeholder categoria-specifico
 * (emoji su gradient) cosi' la card resta presentabile.
 */
import { useState } from "react";

function proxify(url: string): string {
  // Se l'URL e' interno (relativo o stesso dominio) lo usiamo diretto.
  // Se e' esterno, lo passiamo per /api/img-proxy.
  try {
    const u = new URL(url, "https://begift.app");
    if (u.hostname === "begift.app" || u.pathname.startsWith("/api/")) {
      return url;
    }
    return `/api/img-proxy?u=${encodeURIComponent(u.toString())}`;
  } catch {
    return url;
  }
}

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
      src={proxify(src!)}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
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
