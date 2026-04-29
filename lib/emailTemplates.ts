/**
 * Template HTML email transazionali BeGift.
 *
 * Stile: minimale, mobile-first, no immagini esterne (rendering
 * affidabile in Gmail/Outlook/Apple Mail), inline CSS, tabelle dove
 * serve compatibilita' Outlook desktop.
 *
 * Brand: rosa accent #D4537E, deep #1a1a1a, beige #f7f5f2. Logo
 * testuale "BeGift" in header per non dipendere da CDN immagini.
 *
 * Ogni template ritorna:
 *   { subject, html, text }
 * - text e' la versione plain richiesta da molti client per non
 *   finire in spam (multipart/alternative).
 *
 * IMPORTANTE: nessun dato personale del destinatario (foto, file)
 * viene incluso nel body email. Mostriamo solo nomi + link al gift
 * sull'app: il destinatario ha gia' acconsentito a creare il gift,
 * il creator vede contenuti tramite link autenticato.
 */

import { appUrl } from "./email";

export interface GiftOpenedParams {
  /** Nome del destinatario che ha aperto (es. "Maria") — gia'
   *  presente in gifts.recipient_name. */
  recipientName: string;
  /** ID del gift per costruire il link. */
  giftId: string;
  /** Numero totale di aperture (incluso questa). Se > 1 personalizziamo. */
  openCount?: number;
}

export interface ReactionParams {
  recipientName: string;
  giftId: string;
  /** Tipo di reazione: emoji | text | photo | video. */
  reactionType: "emoji" | "text" | "photo" | "video";
  /** Solo per type=emoji o text: contenuto preview (max 80 char). */
  preview?: string;
}

export interface WelcomeParams {
  /** Display name o username, fallback "amico". */
  name?: string;
}

export interface FestaMammaAnnounceParams {
  /** Display name o username, fallback "ciao". */
  name?: string;
  /** Giorni mancanti alla Festa della Mamma — calcolato dal mittente
   *  cosi' la mail e' fresca anche se inviata a 3gg dall'evento. */
  daysLeft: number;
}

export interface SurveyInviteParams {
  /** Display name o username, fallback "ciao". */
  name?: string;
  /** URL Tally (o altra piattaforma) del sondaggio.
   *  Tipicamente popolato con userId e giftId come hidden fields per
   *  associare la risposta in survey_responses. */
  surveyUrl: string;
  /** Nome del destinatario del regalo che ha innescato l'invito.
   *  Usato per personalizzare il copy ("Maria ha aperto..."). */
  recipientName?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ── Layout shell condiviso ─────────────────────────────────────────

function shell(opts: {
  preheader: string;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { preheader, headline, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BeGift</title>
</head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;">
  <!-- Preheader: testo invisibile mostrato come anteprima nelle inbox -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f7f5f2;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);">
          <tr>
            <td style="padding:24px 28px 8px;text-align:left;">
              <div style="font-size:14px;font-weight:800;letter-spacing:-0.3px;color:#D4537E;">BeGift</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px;">
              <h1 style="margin:0;font-size:22px;font-weight:800;line-height:1.25;color:#1a1a1a;">${escapeHtml(headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 8px;font-size:15px;line-height:1.6;color:#3d3d3d;">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaLabel && ctaUrl ? `
          <tr>
            <td style="padding:18px 28px 24px;">
              <a href="${escapeAttr(ctaUrl)}" style="display:inline-block;background:#D4537E;color:#ffffff;text-decoration:none;border-radius:40px;padding:13px 28px;font-size:14px;font-weight:700;">
                ${escapeHtml(ctaLabel)}
              </a>
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 28px 22px;border-top:1px solid #efe9e3;font-size:11.5px;line-height:1.6;color:#888;">
              ${footerNote ? `<p style="margin:14px 0 8px;">${footerNote}</p>` : ""}
              Ricevi questa email perche' usi BeGift.
              <a href="${appUrl()}/settings" style="color:#888;">Gestisci notifiche</a> ·
              <a href="${appUrl()}/privacy" style="color:#888;">Privacy</a>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:11px;color:#aaa;">BeGift — il regalo digitale che emoziona</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Template specifici ─────────────────────────────────────────────

export function giftOpenedTemplate(p: GiftOpenedParams): RenderedEmail {
  const url = `${appUrl()}/gift/${p.giftId}`;
  const opens = p.openCount ?? 1;
  const isReopen = opens > 1;
  const subject = isReopen
    ? `🎁 ${p.recipientName} ha riaperto il tuo regalo (${opens}ª volta)`
    : `🎁 ${p.recipientName} ha aperto il tuo regalo`;
  const headline = isReopen
    ? `${p.recipientName} l'ha riaperto`
    : `${p.recipientName} l'ha aperto!`;
  const body = isReopen
    ? `<p style="margin:0 0 12px;">Buon segno: <strong>${escapeHtml(p.recipientName)}</strong> e' tornato/a sul regalo che gli/le hai mandato. E' la <strong>${opens}ª</strong> volta che lo apre — significa che ci tiene.</p>`
    : `<p style="margin:0 0 12px;">Il regalo che hai preparato per <strong>${escapeHtml(p.recipientName)}</strong> e' stato aperto. Vai a vedere se ha lasciato una reazione.</p>`;
  return {
    subject,
    html: shell({
      preheader: isReopen ? `Riaperto ${opens} volte — ci tiene davvero` : "Vai a vedere se ha lasciato una reazione",
      headline,
      bodyHtml: body,
      ctaLabel: "Apri il regalo",
      ctaUrl: url,
    }),
    text: `${headline}\n\n${stripHtml(body)}\n\nApri il regalo: ${url}`,
  };
}

export function reactionTemplate(p: ReactionParams): RenderedEmail {
  const url = `${appUrl()}/gift/${p.giftId}`;
  const typeLabel: Record<ReactionParams["reactionType"], string> = {
    emoji: "ti ha lasciato un'emoji",
    text: "ti ha scritto un messaggio",
    photo: "ti ha mandato una foto",
    video: "ti ha mandato un video",
  };
  const action = typeLabel[p.reactionType];
  const subject = `💌 ${p.recipientName} ${action}`;
  const headline = `${p.recipientName} ti ha risposto`;
  let preview = "";
  if (p.preview && (p.reactionType === "emoji" || p.reactionType === "text")) {
    const trimmed = p.preview.length > 80 ? p.preview.slice(0, 77) + "…" : p.preview;
    preview = `<blockquote style="margin:14px 0;padding:12px 14px;background:#fff5f8;border-left:3px solid #D4537E;border-radius:6px;font-style:italic;color:#3d3d3d;">"${escapeHtml(trimmed)}"</blockquote>`;
  }
  const body = `<p style="margin:0 0 12px;"><strong>${escapeHtml(p.recipientName)}</strong> ${action} sul regalo che gli/le hai inviato.</p>${preview}`;
  return {
    subject,
    html: shell({
      preheader: p.preview ? p.preview.slice(0, 90) : "Vai a vedere la sua reazione",
      headline,
      bodyHtml: body,
      ctaLabel: "Vedi la reazione",
      ctaUrl: url,
    }),
    text: `${headline}\n\n${stripHtml(body)}\n\nVedi: ${url}`,
  };
}

export function welcomeTemplate(p: WelcomeParams): RenderedEmail {
  const name = p.name?.trim() || "ciao";
  const subject = "Benvenuto su BeGift 💝";
  const headline = `Ciao ${name}, il tuo primo regalo ti aspetta`;
  const body = `
    <p style="margin:0 0 14px;">BeGift e' il modo piu' caldo per regalare a distanza. Niente confezioni vuote: una foto, una canzone, un messaggio ben scritto in una busta animata che il tuo destinatario apre con un'emozione vera.</p>
    <p style="margin:0 0 8px;font-weight:700;">Tre idee per cominciare:</p>
    <ul style="margin:0 0 16px 18px;padding:0;line-height:1.7;">
      <li><a href="${appUrl()}/festa-mamma" style="color:#D4537E;">Festa della Mamma</a> — la lettera che cresce, in 3 minuti</li>
      <li><a href="${appUrl()}/create" style="color:#D4537E;">Un grazie improvviso</a> — a chi ti ha aiutato in qualcosa</li>
      <li><a href="${appUrl()}/create" style="color:#D4537E;">Un ricordo riportato</a> — una foto + una canzone insieme</li>
    </ul>
    <p style="margin:0 0 8px;color:#888;font-size:13px;">P.S. Siamo in <strong>beta pubblica</strong>: se trovi qualcosa che non va, scrivici a <a href="mailto:ciao@begift.app" style="color:#888;">ciao@begift.app</a>. Le tue segnalazioni nelle prossime due settimane fanno la differenza.</p>
  `;
  return {
    subject,
    html: shell({
      preheader: "Tre idee per cominciare — e una raccomandazione per la Festa della Mamma",
      headline,
      bodyHtml: body,
      ctaLabel: "Crea il tuo primo regalo",
      ctaUrl: `${appUrl()}/create`,
    }),
    text: `${headline}\n\nBeGift e' il modo piu' caldo per regalare a distanza. Crea il tuo primo regalo: ${appUrl()}/create\n\nFesta della Mamma: ${appUrl()}/festa-mamma`,
  };
}

export function festaMammaAnnounceTemplate(p: FestaMammaAnnounceParams): RenderedEmail {
  const name = p.name?.trim() || "ciao";
  const days = p.daysLeft;
  const urgencyHint =
    days <= 0 ? "è domani" :
    days === 1 ? "è domani" :
    days <= 3 ? `è tra ${days} giorni` :
    days <= 7 ? `è tra ${days} giorni — sei ancora in tempo` :
    `è tra ${days} giorni`;
  const subject = days <= 7
    ? `💐 ${days <= 1 ? "Domani" : `Tra ${days} giorni`} è la Festa della Mamma — pronto?`
    : `💐 Festa della Mamma — c'è un template dedicato`;
  const headline = `Ciao ${name}, la Festa della Mamma ${urgencyHint}`;
  const body = `
    <p style="margin:0 0 14px;">In questi giorni stiamo finendo di preparare BeGift per la <strong>Festa della Mamma</strong>. Volevo dirti che c'è un template dedicato che ti accompagna in 5 domande — esce una "Lettera che cresce" piuttosto bella, con foto e canzone se ti va.</p>
    <p style="margin:0 0 14px;">Tempo stimato: <strong>3 minuti</strong>. Si fa anche dal cellulare.</p>
    <p style="margin:0 0 8px;font-weight:700;">Tre cose se vuoi farlo:</p>
    <ul style="margin:0 0 16px 18px;padding:0;line-height:1.7;">
      <li>Una <strong>foto recente</strong> della mamma (anche di te con lei)</li>
      <li>Un <strong>ricordo</strong> che vi accomuna (vacanze, una frase ricorrente, una cucina)</li>
      <li>Una <strong>canzone</strong> che vi lega — basta il nome, lo cerchiamo noi</li>
    </ul>
    <p style="margin:0 0 6px;color:#888;font-size:13px;">P.S. Stiamo per fare il lancio "vero" proprio in questi giorni e ogni feedback dei primi utenti vale tantissimo. Se trovi qualcosa che non torna, scrivici a <a href="mailto:ciao@begift.app" style="color:#888;">ciao@begift.app</a> — leggiamo tutto.</p>
  `;
  return {
    subject,
    html: shell({
      preheader: days <= 7 ? `Mancano ${days <= 1 ? "ore" : `${days} giorni`} — il template Mamma è pronto` : `Mancano ${days} giorni — c'è il template dedicato`,
      headline,
      bodyHtml: body,
      ctaLabel: "Crea il regalo per la mamma",
      ctaUrl: `${appUrl()}/festa-mamma`,
      footerNote: "Hai ricevuto questa email perchè sei tra i primi utenti BeGift. Mandiamo poche email all'anno — niente newsletter, solo annunci concreti.",
    }),
    text: `${headline}\n\nC'è un template dedicato che ti accompagna in 5 domande — esce una "Lettera che cresce" piuttosto bella, con foto e canzone se ti va.\n\nTempo: 3 minuti. Si fa anche dal cellulare.\n\nCrea: ${appUrl()}/festa-mamma`,
  };
}

export function surveyInviteTemplate(p: SurveyInviteParams): RenderedEmail {
  const name = p.name?.trim() || "ciao";
  const recipient = p.recipientName?.trim();
  const subject = "Hai max 3 minuti? Aiutami a migliorare BeGift";
  const headline = `Ciao ${name}, ti chiedo max 3 minuti`;
  const recipientLine = recipient
    ? `<p style="margin:0 0 14px;"><strong>${escapeHtml(recipient)}</strong> ha appena aperto il regalo che hai creato. Mentre l'esperienza è fresca, ti chiedo pochi minuti per dirmi com'è andata.</p>`
    : `<p style="margin:0 0 14px;">Hai appena creato e inviato un regalo su BeGift. Mentre l'esperienza è fresca, ti chiedo pochi minuti per dirmi com'è andata.</p>`;
  const body = `
    ${recipientLine}
    <p style="margin:0 0 14px;">Sono Luca, il fondatore. Le risposte vanno a me direttamente e mi servono per decidere come BeGift si evolve nei prossimi mesi: cosa tenere, cosa aggiungere, cosa eliminare.</p>
    <p style="margin:0 0 8px;font-weight:700;">Tre cose te le chiedo in particolare:</p>
    <ul style="margin:0 0 16px 18px;padding:0;line-height:1.7;">
      <li>Cosa ti è piaciuto e cosa non ti è piaciuto</li>
      <li>Se la persona a cui hai mandato il regalo ti ha detto qualcosa</li>
      <li>Se BeGift è una cosa per cui valga la pena pagare (anche poco)</li>
    </ul>
    <p style="margin:0 0 6px;color:#888;font-size:13px;">Grazie davvero — ogni risposta in questa fase vale dieci volte una risposta dopo.</p>
  `;
  return {
    subject,
    html: shell({
      preheader: "Max 3 minuti per dirmi com'è andata. Le tue risposte vanno direttamente al fondatore.",
      headline,
      bodyHtml: body,
      ctaLabel: "Compila il sondaggio (max 3 min)",
      ctaUrl: p.surveyUrl,
      footerNote: "Hai ricevuto questa email perchè hai appena creato un regalo su BeGift. Mandiamo poche email all'anno — se non vuoi piu' riceverle, gestiscile dalle tue impostazioni.",
    }),
    text: `${headline}\n\n${stripHtml(recipientLine + body)}\n\nSondaggio: ${p.surveyUrl}`,
  };
}

// ── Util ───────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
