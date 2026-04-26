/**
 * downloadMedia — helper cross-platform per salvare un'immagine (o
 * altro media) sul dispositivo del destinatario di un gift.
 *
 * Strategia per ottenere "Save to Photos / Save to Downloads":
 *
 *  1. Tentativo nativo: Web Share API con `files`. Su iOS ≥15 e
 *     Android moderni questo apre il sheet di sistema con "Save to
 *     Photos" / "Save Image" — il modo piu' user-friendly. Funziona
 *     pero' solo da gesto utente (click handler) e con file ≤ ~50MB.
 *
 *  2. Fallback A (desktop / Android browser): fetch + blob URL + tag
 *     <a download>. Click programmatico — il browser scarica il file
 *     nella cartella Download.
 *
 *  3. Fallback B (iOS Safari < 15 o quando download attribute viene
 *     ignorato): apre l'immagine in nuova tab. L'utente deve fare
 *     long-press → "Salva immagine". Mostriamo un alert con istruzioni
 *     se siamo costretti a fallare a questo modo.
 *
 * Note iOS: l'attributo `download` viene spesso ignorato e il browser
 * naviga via dalla pagina del gift (perdendo lo stato). Per questo
 * Web Share API e' di gran lunga preferibile su iOS.
 */

export interface DownloadOptions {
  /** URL dell'immagine (puo' essere remoto, idealmente same-origin
   *  o CORS-enabled). */
  url: string;
  /** Nome con cui salvare il file. Default: dedotto dall'URL o
   *  "begift-foto.jpg". */
  filename?: string;
  /** Mostrato se il fallback finale (nuova tab) viene attivato.
   *  Default: messaggio italiano. */
  longPressHint?: string;
}

/** Detect rough iOS (incluso iPad in modalita' desktop). Non e' una
 *  scienza esatta, basta come euristica per scegliere il path. */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad in iPadOS 13+ si presenta come Mac. Cerchiamo anche maxTouchPoints.
  const iPadOS = /Mac/.test(ua) && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

/** Estrae un nome file plausibile dall'URL. */
function inferFilename(url: string, fallback = "begift-foto.jpg"): string {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://begift.app");
    const last = u.pathname.split("/").pop() || "";
    if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return last;
  } catch (_) { /* ignore */ }
  return fallback;
}

export async function downloadMedia(opts: DownloadOptions): Promise<void> {
  const url = opts.url;
  const filename = opts.filename || inferFilename(url);
  const hint = opts.longPressHint || "Tocca a lungo l'immagine e poi 'Salva immagine'.";

  // Step 1 — Web Share API con file. iOS adora questo path.
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) throw new Error(`fetch failed ${r.status}`);
    const blob = await r.blob();
    const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

    const nav = navigator as Navigator & { canShare?: (data: { files?: File[] }) => boolean; share?: (data: { files?: File[]; title?: string }) => Promise<void> };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: filename });
        return;
      } catch (e: unknown) {
        // L'utente ha cancellato il sheet di sistema. Non e' un
        // errore: termina qui senza fallback (altrimenti partirebbe
        // un secondo download "fantasma").
        const err = e as { name?: string };
        if (err?.name === "AbortError") return;
        // Altri errori → continua col fallback.
      }
    }

    // Step 2 — Fallback download via blob URL + <a download>.
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    // Non aggiungere a DOM su iOS: piu' affidabile click() diretto.
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (_) { /* ignore */ }
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    // Step 3 — su iOS il <a download> spesso naviga senza scaricare:
    // se siamo su iOS apriamo anche in nuova tab + alert con
    // istruzioni long-press (il browser rispetta solo l'apertura,
    // l'utente fa il save manualmente).
    if (isIOS()) {
      // Apri l'originale (non blob, che iOS non sa salvare nei Photos)
      // con noopener per non perdere il referrer del gift.
      const w = window.open(url, "_blank", "noopener,noreferrer");
      // Se i popup sono bloccati, w e' null — mostriamo l'hint.
      if (!w) alert(hint);
    }
  } catch (e) {
    console.warn("[downloadMedia] fallback to alert", e);
    // Ultima spiaggia: apri in nuova tab.
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) alert(hint);
  }
}
