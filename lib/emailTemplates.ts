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
 *
 * Internazionalizzazione: ogni template accetta un parametro
 * `locale` opzionale ("it" | "en"). Default = "it" per
 * retrocompatibilità — gli ambienti che non passano il parametro
 * continuano a inviare email in italiano. Per ja/zh facciamo
 * fallback a inglese in attesa di traduzioni dedicate.
 */

import { appUrl } from "./email";

export type EmailLocale = "it" | "en" | "ja" | "zh";

/** Riduce il locale supportato dai template a it|en. ja/zh fallback en. */
function resolveLocale(loc?: EmailLocale): "it" | "en" {
  if (loc === "en" || loc === "ja" || loc === "zh") return "en";
  return "it";
}

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
  locale: "it" | "en";
  preheader: string;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { locale, preheader, headline, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;
  const footerWhy = locale === "en"
    ? "You're getting this email because you use BeGift."
    : "Ricevi questa email perche' usi BeGift.";
  const manageNotif = locale === "en" ? "Manage notifications" : "Gestisci notifiche";
  const tagline = locale === "en"
    ? "BeGift — the digital gift that moves people"
    : "BeGift — il regalo digitale che emoziona";
  const lang = locale === "en" ? "en" : "it";
  return `<!doctype html>
<html lang="${lang}">
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
              ${footerWhy}
              <a href="${appUrl()}/settings" style="color:#888;">${manageNotif}</a> ·
              <a href="${appUrl()}/privacy" style="color:#888;">Privacy</a>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:11px;color:#aaa;">${tagline}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Template specifici ─────────────────────────────────────────────

export function giftOpenedTemplate(p: GiftOpenedParams, locale?: EmailLocale): RenderedEmail {
  const loc = resolveLocale(locale);
  const url = `${appUrl()}/gift/${p.giftId}`;
  const opens = p.openCount ?? 1;
  const isReopen = opens > 1;
  let subject: string, headline: string, body: string, preheader: string, ctaLabel: string;
  if (loc === "en") {
    subject = isReopen
      ? `🎁 ${p.recipientName} reopened your gift (${opens}x)`
      : `🎁 ${p.recipientName} opened your gift`;
    headline = isReopen
      ? `${p.recipientName} reopened it`
      : `${p.recipientName} opened it!`;
    body = isReopen
      ? `<p style="margin:0 0 12px;">Good sign: <strong>${escapeHtml(p.recipientName)}</strong> came back to your gift. It's the <strong>${opens}${ordinalSuffix(opens)}</strong> time they've opened it — they care.</p>`
      : `<p style="margin:0 0 12px;">The gift you prepared for <strong>${escapeHtml(p.recipientName)}</strong> has been opened. Go check if they left a reaction.</p>`;
    preheader = isReopen ? `Reopened ${opens} times — they really care` : "Go check if they left a reaction";
    ctaLabel = "Open the gift";
  } else {
    subject = isReopen
      ? `🎁 ${p.recipientName} ha riaperto il tuo regalo (${opens}ª volta)`
      : `🎁 ${p.recipientName} ha aperto il tuo regalo`;
    headline = isReopen
      ? `${p.recipientName} l'ha riaperto`
      : `${p.recipientName} l'ha aperto!`;
    body = isReopen
      ? `<p style="margin:0 0 12px;">Buon segno: <strong>${escapeHtml(p.recipientName)}</strong> e' tornato/a sul regalo che gli/le hai mandato. E' la <strong>${opens}ª</strong> volta che lo apre — significa che ci tiene.</p>`
      : `<p style="margin:0 0 12px;">Il regalo che hai preparato per <strong>${escapeHtml(p.recipientName)}</strong> e' stato aperto. Vai a vedere se ha lasciato una reazione.</p>`;
    preheader = isReopen ? `Riaperto ${opens} volte — ci tiene davvero` : "Vai a vedere se ha lasciato una reazione";
    ctaLabel = "Apri il regalo";
  }
  return {
    subject,
    html: shell({ locale: loc, preheader, headline, bodyHtml: body, ctaLabel, ctaUrl: url }),
    text: `${headline}\n\n${stripHtml(body)}\n\n${ctaLabel}: ${url}`,
  };
}

export function reactionTemplate(p: ReactionParams, locale?: EmailLocale): RenderedEmail {
  const loc = resolveLocale(locale);
  const url = `${appUrl()}/gift/${p.giftId}`;
  const typeLabelIt: Record<ReactionParams["reactionType"], string> = {
    emoji: "ti ha lasciato un'emoji",
    text: "ti ha scritto un messaggio",
    photo: "ti ha mandato una foto",
    video: "ti ha mandato un video",
  };
  const typeLabelEn: Record<ReactionParams["reactionType"], string> = {
    emoji: "left you an emoji",
    text: "wrote you a message",
    photo: "sent you a photo",
    video: "sent you a video",
  };
  const action = (loc === "en" ? typeLabelEn : typeLabelIt)[p.reactionType];
  const subject = loc === "en"
    ? `💌 ${p.recipientName} ${action}`
    : `💌 ${p.recipientName} ${action}`;
  const headline = loc === "en"
    ? `${p.recipientName} replied to you`
    : `${p.recipientName} ti ha risposto`;
  let preview = "";
  if (p.preview && (p.reactionType === "emoji" || p.reactionType === "text")) {
    const trimmed = p.preview.length > 80 ? p.preview.slice(0, 77) + "…" : p.preview;
    preview = `<blockquote style="margin:14px 0;padding:12px 14px;background:#fff5f8;border-left:3px solid #D4537E;border-radius:6px;font-style:italic;color:#3d3d3d;">"${escapeHtml(trimmed)}"</blockquote>`;
  }
  const bodyTop = loc === "en"
    ? `<p style="margin:0 0 12px;"><strong>${escapeHtml(p.recipientName)}</strong> ${action} on the gift you sent.</p>`
    : `<p style="margin:0 0 12px;"><strong>${escapeHtml(p.recipientName)}</strong> ${action} sul regalo che gli/le hai inviato.</p>`;
  const body = `${bodyTop}${preview}`;
  const ctaLabel = loc === "en" ? "See the reaction" : "Vedi la reazione";
  const preheader = p.preview
    ? p.preview.slice(0, 90)
    : (loc === "en" ? "Go see their reaction" : "Vai a vedere la sua reazione");
  return {
    subject,
    html: shell({ locale: loc, preheader, headline, bodyHtml: body, ctaLabel, ctaUrl: url }),
    text: `${headline}\n\n${stripHtml(body)}\n\n${ctaLabel}: ${url}`,
  };
}

export function welcomeTemplate(p: WelcomeParams, locale?: EmailLocale): RenderedEmail {
  const loc = resolveLocale(locale);
  if (loc === "en") {
    const name = p.name?.trim() || "there";
    const subject = "Welcome to BeGift 💝";
    const headline = `Hi ${name}, your first gift is waiting`;
    const body = `
      <p style="margin:0 0 14px;">BeGift is the warmest way to give from afar. No empty packaging: a photo, a song, a well-written message in an animated envelope your recipient opens with real emotion.</p>
      <p style="margin:0 0 8px;font-weight:700;">Three ideas to get started:</p>
      <ul style="margin:0 0 16px 18px;padding:0;line-height:1.7;">
        <li><a href="${appUrl()}/festa-mamma" style="color:#D4537E;">Mother's Day</a> — the letter that grows, in 3 minutes</li>
        <li><a href="${appUrl()}/create" style="color:#D4537E;">A sudden thank-you</a> — to someone who helped you</li>
        <li><a href="${appUrl()}/create" style="color:#D4537E;">A memory revisited</a> — a photo + a song together</li>
      </ul>
      <p style="margin:0 0 8px;color:#888;font-size:13px;">P.S. We're in <strong>public beta</strong>: if something feels off, write to <a href="mailto:ciao@begift.app" style="color:#888;">ciao@begift.app</a>. Your feedback in the next two weeks makes the difference.</p>
    `;
    return {
      subject,
      html: shell({
        locale: loc,
        preheader: "Three ideas to get started — and a tip for Mother's Day",
        headline,
        bodyHtml: body,
        ctaLabel: "Create your first gift",
        ctaUrl: `${appUrl()}/create`,
      }),
      text: `${headline}\n\nBeGift is the warmest way to give from afar. Create your first gift: ${appUrl()}/create\n\nMother's Day: ${appUrl()}/festa-mamma`,
    };
  }
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
      locale: loc,
      preheader: "Tre idee per cominciare — e una raccomandazione per la Festa della Mamma",
      headline,
      bodyHtml: body,
      ctaLabel: "Crea il tuo primo regalo",
      ctaUrl: `${appUrl()}/create`,
    }),
    text: `${headline}\n\nBeGift e' il modo piu' caldo per regalare a distanza. Crea il tuo primo regalo: ${appUrl()}/create\n\nFesta della Mamma: ${appUrl()}/festa-mamma`,
  };
}

export function festaMammaAnnounceTemplate(p: FestaMammaAnnounceParams, locale?: EmailLocale): RenderedEmail {
  const loc = resolveLocale(locale);
  const days = p.daysLeft;
  if (loc === "en") {
    const name = p.name?.trim() || "hi";
    const urgencyHint =
      days <= 0 ? "is tomorrow" :
      days === 1 ? "is tomorrow" :
      days <= 3 ? `is in ${days} days` :
      days <= 7 ? `is in ${days} days — you're still in time` :
      `is in ${days} days`;
    const subject = days <= 7
      ? `💐 ${days <= 1 ? "Tomorrow" : `In ${days} days`} is Mother's Day — ready?`
      : `💐 Mother's Day — there's a dedicated template`;
    const headline = `Hi ${name}, Mother's Day ${urgencyHint}`;
    const body = `
      <p style="margin:0 0 14px;">We're finishing up BeGift for <strong>Mother's Day</strong>. There's a dedicated template that walks you through 5 questions — out comes a "Letter that grows" that's pretty beautiful, with a photo and a song if you like.</p>
      <p style="margin:0 0 14px;">Time needed: <strong>3 minutes</strong>. Works on mobile too.</p>
      <p style="margin:0 0 8px;font-weight:700;">Three things if you want to do it:</p>
      <ul style="margin:0 0 16px 18px;padding:0;line-height:1.7;">
        <li>A <strong>recent photo</strong> of mom (or you with her)</li>
        <li>A <strong>memory</strong> you share (vacations, a recurring phrase, a kitchen)</li>
        <li>A <strong>song</strong> that connects you — just the name, we'll find it</li>
      </ul>
      <p style="margin:0 0 6px;color:#888;font-size:13px;">P.S. We're about to do the "real" launch these days and every bit of feedback from early users matters a lot. If something feels off, write to <a href="mailto:ciao@begift.app" style="color:#888;">ciao@begift.app</a> — we read everything.</p>
    `;
    return {
      subject,
      html: shell({
        locale: loc,
        preheader: days <= 7
          ? `${days <= 1 ? "Hours" : `${days} days`} left — the Mom template is ready`
          : `${days} days left — there's a dedicated template`,
        headline,
        bodyHtml: body,
        ctaLabel: "Create the gift for mom",
        ctaUrl: `${appUrl()}/festa-mamma`,
        footerNote: "You got this email because you're an early BeGift user. We send few emails per year — no newsletter, only concrete announcements.",
      }),
      text: `${headline}\n\nThere's a dedicated template that walks you through 5 questions — a "Letter that grows", with photo and song if you like.\n\nTime: 3 minutes. Works on mobile too.\n\nCreate: ${appUrl()}/festa-mamma`,
    };
  }
  const name = p.name?.trim() || "ciao";
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
      locale: loc,
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

export function surveyInviteTemplate(p: SurveyInviteParams, locale?: EmailLocale): RenderedEmail {
  const loc = resolveLocale(locale);
  if (loc === "en") {
    const name = p.name?.trim() || "hi";
    const recipient = p.recipientName?.trim();
    const subject = "Got 3 minutes? Help me improve BeGift";
    const headline = `Hi ${name}, I'm asking for max 3 minutes`;
    const recipientLine = recipient
      ? `<p style="margin:0 0 14px;"><strong>${escapeHtml(recipient)}</strong> just opened the gift you created. While the experience is fresh, I'm asking for a few minutes to tell me how it went.</p>`
      : `<p style="margin:0 0 14px;">You just created and sent a gift on BeGift. While the experience is fresh, I'm asking for a few minutes to tell me how it went.</p>`;
    const body = `
      ${recipientLine}
      <p style="margin:0 0 14px;">I'm Luca, the founder. Answers come straight to me and help me decide how BeGift evolves over the next months: what to keep, what to add, what to drop.</p>
      <p style="margin:0 0 8px;font-weight:700;">Three things in particular:</p>
      <ul style="margin:0 0 16px 18px;padding:0;line-height:1.7;">
        <li>What you liked and what you didn't</li>
        <li>If the person you sent the gift to said anything</li>
        <li>If BeGift is something worth paying for (even a little)</li>
      </ul>
      <p style="margin:0 0 6px;color:#888;font-size:13px;">Truly thank you — every answer at this stage is worth ten times an answer six months from now.</p>
    `;
    return {
      subject,
      html: shell({
        locale: loc,
        preheader: "Max 3 minutes to tell me how it went. Answers come straight to the founder.",
        headline,
        bodyHtml: body,
        ctaLabel: "Take the survey (max 3 min)",
        ctaUrl: p.surveyUrl,
        footerNote: "You got this email because you just created a gift on BeGift. We send few emails per year — if you don't want them, manage them in your settings.",
      }),
      text: `${headline}\n\n${stripHtml(recipientLine + body)}\n\nSurvey: ${p.surveyUrl}`,
    };
  }
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
      locale: loc,
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
/** English ordinal suffix: 1st, 2nd, 3rd, 4th... */
function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
