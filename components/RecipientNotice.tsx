"use client";

/**
 * RecipientNotice — informativa breve mostrata al destinatario di un
 * gift al PRIMO apri-regalo. Scopo: trasparenza GDPR su trattamento
 * dati di terzi (foto/audio del destinatario caricati senza che lui
 * sia un utente registrato della piattaforma) e visibilita' del
 * canale di segnalazione.
 *
 * Pattern UX: appare in basso come piccolo banner sticky, dismissable
 * con la X. Persistito in localStorage per gift_id (chiave stabile),
 * cosi' al secondo apri-regalo dello stesso gift non riappare e non
 * disturba l'esperienza.
 *
 * Posizionamento: sopra il bottom nav, sotto il contenuto del gift.
 * Z-index alto ma non blocking: l'utente puo' continuare a interagire
 * col regalo mentre lo legge. Click sui link interni segue la rotta
 * normale (non chiude il banner — lo chiude solo la X).
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  giftId: string;
  /** Nome o alias di chi ha mandato il gift, se disponibile. Usato
   *  nel testo "inviato da X" — fallback "una persona". */
  senderLabel?: string | null;
  /** Slot opzionale per override del bottone "Segnala" (es. attivare
   *  un dialog gia' presente nella pagina). Se omesso, link a mailto:abuse. */
  onReport?: () => void;
}

export function RecipientNotice({ giftId, senderLabel, onReport }: Props) {
  const storageKey = `begift_recipient_notice_${giftId}`;
  // Default false: evitiamo flash su SSR. L'effect attiva la
  // visibilita' solo se l'utente non ha gia' chiuso il banner.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        // Piccolo delay per non sovrapporsi all'animazione di apertura
        // del regalo (la magia visiva viene prima).
        const t = setTimeout(() => setShow(true), 1800);
        return () => clearTimeout(t);
      }
    } catch (_) { /* localStorage bloccato → mostra */ setShow(true); }
  }, [storageKey]);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch (_) { /* ignore */ }
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="Informativa privacy destinatario"
      style={{
        position: "fixed",
        // 78px = altezza approssimativa del BottomNav. Su gift page
        // potrebbe non esserci, ma se c'e' non lo coprimao.
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: 460,
        zIndex: 60,
        background: "rgba(26,26,26,0.96)",
        color: "#fff",
        borderRadius: 14,
        padding: "12px 14px",
        boxShadow: "0 10px 32px rgba(0,0,0,.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "rnSlideUp .4s cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      <style>{`@keyframes rnSlideUp { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div aria-hidden style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>🔒</div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            Stai vedendo un contenuto privato
          </div>
          <div style={{ opacity: 0.85 }}>
            {senderLabel ? <>Inviato da <strong>{senderLabel}</strong>. </> : null}
            Se contiene tue immagini o dati personali e non hai dato il consenso, puoi{" "}
            {onReport ? (
              <button
                type="button"
                onClick={onReport}
                style={{ background: "none", border: "none", color: "#ffb6c8", fontWeight: 600, padding: 0, cursor: "pointer", textDecoration: "underline", font: "inherit" }}
              >
                segnalarlo
              </button>
            ) : (
              <a href="mailto:abuse@begift.app?subject=Segnalazione%20contenuto" style={{ color: "#ffb6c8", fontWeight: 600 }}>segnalarlo</a>
            )}
            {" "}o richiederne la rimozione scrivendo a{" "}
            <a href="mailto:privacy@begift.app" style={{ color: "#ffb6c8", fontWeight: 600 }}>privacy@begift.app</a>.{" "}
            <Link href="/privacy" style={{ color: "#ffb6c8" }}>Privacy</Link>.
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Chiudi informativa"
          style={{
            background: "rgba(255,255,255,.12)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 26, height: 26,
            fontSize: 14,
            cursor: "pointer",
            lineHeight: 1,
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >×</button>
      </div>
    </div>
  );
}
