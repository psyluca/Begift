/**
 * downloadMedia — helper cross-platform per salvare un'immagine sul
 * dispositivo del destinatario di un gift.
 *
 * Strategia (rivista 2026-04-26 dopo bug iOS "about:blank"):
 *
 *  - iOS:
 *      1. Web Share API (Save to Photos). Se l'utente cancella → STOP.
 *         Non eseguiamo MAI fallback dopo un AbortError, altrimenti
 *         apriremmo about:blank in PWA e l'utente resta incastrato.
 *      2. Se la share API non e' disponibile o fallisce per motivo
 *         diverso da cancel → apri l'immagine in nuova tab (l'utente
 *         long-press per salvare). Niente blob+a.download su iOS:
 *         non rispetta `download` e naviga via dalla pagina.
 *
 *  - Non-iOS (Android, desktop):
 *      1. fetch + blob + <a download>. Funziona ovunque.
 *      2. Se il fetch fallisce (CORS, rete) → apri in nuova tab.
 *
 * Ritorno esplicito: il chiamante (es. "Scarica tutte" in loop) puo'
 * fermarsi se l'utente ha cancellato, evitando di scatenare share
 * sheets a catena su iOS dopo che il user-gesture e' scaduto.
 */

export type DownloadResult = "success" | "cancelled" | "failed";

export interface DownloadOptions {
  url: string;
  filename?: string;
  longPressHint?: string;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadOS = /Mac/.test(ua) && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

function inferFilename(url: string, fallback = "begift-foto.jpg"): string {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://begift.app");
    const last = u.pathname.split("/").pop() || "";
    if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return last;
  } catch (_) { /* ignore */ }
  return fallback;
}

export async function downloadMedia(opts: DownloadOptions): Promise<DownloadResult> {
  const url = opts.url;
  const filename = opts.filename || inferFilename(url);
  const hint = opts.longPressHint || "Tocca a lungo l'immagine e poi 'Salva immagine'.";
  const ios = isIOS();

  // ── iOS path ──────────────────────────────────────────────────
  if (ios) {
    try {
      const r = await fetch(url, { mode: "cors" });
      if (!r.ok) throw new Error(`fetch failed ${r.status}`);
      const blob = await r.blob();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string }) => Promise<void>;
      };
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        try {
          await nav.share({ files: [file], title: filename });
          return "success";
        } catch (e: unknown) {
          const err = e as { name?: string };
          if (err?.name === "AbortError") {
            // L'utente ha esplicitamente cancellato. STOP, niente
            // fallback. Aprire una nuova tab qui equivarrebbe ad
            // "about:blank nero" su iOS PWA.
            return "cancelled";
          }
          // Altri errori (NotAllowedError quando user-gesture e'
          // scaduto in un loop) → fallback nuova tab sotto.
          console.warn("[downloadMedia/ios] share failed non-abort", err);
        }
      }
    } catch (e) {
      console.warn("[downloadMedia/ios] fetch/share path failed", e);
    }
    // Fallback iOS: nuova tab. Su iOS PWA window.open puo' essere
    // bloccato (popup blocker non c'e' ma il PWA non sempre apre
    // tabs esterni); in quel caso alert con istruzioni.
    try {
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) {
        alert(hint);
        return "failed";
      }
      return "success";
    } catch (_) {
      alert(hint);
      return "failed";
    }
  }

  // ── Non-iOS (Android, desktop) ────────────────────────────────
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) throw new Error(`fetch failed ${r.status}`);
    const blob = await r.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (_) { /* ignore */ }
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    return "success";
  } catch (e) {
    console.warn("[downloadMedia] blob fallback failed, opening new tab", e);
    try {
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) {
        alert(hint);
        return "failed";
      }
      return "success";
    } catch (_) {
      alert(hint);
      return "failed";
    }
  }
}
