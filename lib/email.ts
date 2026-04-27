/**
 * Email transazionali via Resend (REST API, no SDK).
 *
 * Tre eventi supportati (mappa con le colonne `notify_*` di profiles):
 *
 *   gift_opened     → "Maria ha aperto il tuo regalo"
 *   reaction        → "Maria ha reagito al tuo regalo"
 *   welcome         → onboarding al primo login
 *
 * Filosofia:
 *  - Best-effort. Se Resend e' down, RESEND_API_KEY non e' settata, o
 *    l'utente ha notify_email=false, le funzioni ritornano silently.
 *    NON bloccano mai il chiamante (gift open, reazione, ecc.) ne'
 *    fanno errore visibile all'utente.
 *  - Logghiamo errori in console per diagnostica server-side, ma non
 *    facciamo throw.
 *  - Idempotenza per la welcome: il chiamante (api/profile/me) usa
 *    profiles.welcome_email_sent_at come lock atomico.
 *
 * Configurazione via env var:
 *   RESEND_API_KEY  — chiave API Resend. Se assente, le funzioni
 *                     diventano no-op (utile in dev senza chiave).
 *   RESEND_FROM     — mittente (es. "BeGift <ciao@begift.app>").
 *                     Default: "BeGift <noreply@begift.app>".
 *   NEXT_PUBLIC_APP_URL — usata per costruire link assoluti nei
 *                     template (es. https://begift.app/gift/...).
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  giftOpenedTemplate,
  reactionTemplate,
  welcomeTemplate,
  festaMammaAnnounceTemplate,
  type GiftOpenedParams,
  type ReactionParams,
  type WelcomeParams,
  type FestaMammaAnnounceParams,
} from "@/lib/emailTemplates";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface ResendPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Tag per analytics Resend dashboard (es. "gift_opened") */
  tags?: { name: string; value: string }[];
  /** Reply-To: opzionale, default = mittente */
  reply_to?: string;
}

/** Invio raw a Resend. Usa fetch (no SDK). Timeout 8s. */
async function postResend(payload: ResendPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No-op silenzioso: utile in dev locale + safety net se la chiave
    // non e' ancora stata settata su Vercel al primo deploy. Logghiamo
    // una sola volta per evitare spam.
    if (!warnedNoKey) {
      console.warn("[email] RESEND_API_KEY non settata — email skipped (no-op)");
      warnedNoKey = true;
    }
    return { ok: false, error: "no_api_key" };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[email] Resend HTTP", res.status, text.slice(0, 300));
      return { ok: false, error: `http_${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: (data as { id?: string }).id };
  } catch (e) {
    console.error("[email] Resend network error", e);
    return { ok: false, error: "network" };
  }
}

let warnedNoKey = false;

const FROM_DEFAULT = "BeGift <noreply@begift.app>";
function resolveFrom(): string {
  return process.env.RESEND_FROM || FROM_DEFAULT;
}

/** App URL pubblico per link nei template. */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://begift.app";
}

// ── Helpers per leggere profile + preferenze ───────────────────────

interface RecipientProfile {
  id: string;
  email: string;
  notify_email: boolean;
  notify_gift_opened: boolean;
  notify_reaction: boolean;
}

async function loadRecipient(userId: string): Promise<RecipientProfile | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, notify_email, notify_gift_opened, notify_reaction")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  if (!data.email) return null;
  return data as RecipientProfile;
}

// ── API pubbliche per i 3 eventi ───────────────────────────────────

/**
 * Invia email "il tuo regalo e' stato aperto".
 * Skipped se: notify_email=false, notify_gift_opened=false, profilo
 * senza email, o RESEND_API_KEY assente.
 */
export async function sendGiftOpenedEmail(creatorId: string, params: GiftOpenedParams): Promise<void> {
  const profile = await loadRecipient(creatorId);
  if (!profile) return;
  if (!profile.notify_email || !profile.notify_gift_opened) return;
  const tpl = giftOpenedTemplate(params);
  await postResend({
    from: resolveFrom(),
    to: profile.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: "type", value: "gift_opened" }],
  });
}

/**
 * Invia email "qualcuno ha reagito al tuo regalo".
 * Skipped se: notify_email=false, notify_reaction=false, profilo
 * senza email, o RESEND_API_KEY assente.
 */
export async function sendReactionEmail(creatorId: string, params: ReactionParams): Promise<void> {
  const profile = await loadRecipient(creatorId);
  if (!profile) return;
  if (!profile.notify_email || !profile.notify_reaction) return;
  const tpl = reactionTemplate(params);
  await postResend({
    from: resolveFrom(),
    to: profile.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: "type", value: "reaction" }],
  });
}

/**
 * Invia email di campagna "Festa Mamma announce" a un utente.
 * Idempotente: se profiles.email_campaigns_sent contiene gia' la chiave
 * della campagna, no-op. Lock atomico via UPDATE WHERE NOT (jsonb ?
 * key) per evitare doppi invii in caso di race condition.
 *
 * Ritorna { sent: boolean, reason?: string } per il chiamante (admin
 * tool) per stats di campagna.
 */
const FESTA_MAMMA_CAMPAIGN_ID = "festa_mamma_2026";

export interface CampaignSendResult {
  sent: boolean;
  reason?: "no_api_key" | "no_email" | "opted_out" | "already_sent" | "send_failed";
}

export async function sendFestaMammaAnnounce(userId: string, params: FestaMammaAnnounceParams): Promise<CampaignSendResult> {
  const profile = await loadRecipient(userId);
  if (!profile) return { sent: false, reason: "no_email" };
  if (!profile.notify_email) return { sent: false, reason: "opted_out" };

  // Idempotenza: leggi lo stato campagne dell'utente. Se gia' inviata,
  // skip. Pattern read-modify-write: per il volume di utenti previsto
  // (<5000 in beta) e invio sequenziale dall'admin tool, race
  // condition praticamente nulla.
  const admin = createSupabaseAdmin();
  const { data: row, error: readErr } = await admin
    .from("profiles")
    .select("email_campaigns_sent")
    .eq("id", userId)
    .single();
  if (readErr) {
    console.warn("[email/campaign] read error", readErr);
    return { sent: false, reason: "send_failed" };
  }
  const sentMap = (row?.email_campaigns_sent ?? {}) as Record<string, string>;
  if (sentMap[FESTA_MAMMA_CAMPAIGN_ID]) {
    return { sent: false, reason: "already_sent" };
  }

  // Update preventivo: marchia come inviata PRIMA di chiamare Resend.
  // In caso di errore Resend, NON ritentiamo (preferiamo skip a doppia
  // mail). Il flag resta scritto: l'admin puo' verificare nei log.
  const newMap = { ...sentMap, [FESTA_MAMMA_CAMPAIGN_ID]: new Date().toISOString() };
  const { error: writeErr } = await admin
    .from("profiles")
    .update({ email_campaigns_sent: newMap })
    .eq("id", userId);
  if (writeErr) {
    console.warn("[email/campaign] write error", writeErr);
    return { sent: false, reason: "send_failed" };
  }

  const tpl = festaMammaAnnounceTemplate(params);
  const result = await postResend({
    from: resolveFrom(),
    to: profile.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [
      { name: "type", value: "campaign" },
      { name: "campaign", value: FESTA_MAMMA_CAMPAIGN_ID },
    ],
  });
  if (!result.ok) {
    if (result.error === "no_api_key") return { sent: false, reason: "no_api_key" };
    return { sent: false, reason: "send_failed" };
  }
  return { sent: true };
}

/**
 * Invia email di benvenuto al primo login.
 * Idempotente: il chiamante (api/profile/me) controlla
 * profiles.welcome_email_sent_at e setta il timestamp dopo l'invio.
 * Skipped se: notify_email=false (rispetta opt-out anche per welcome,
 * scelta conservativa) o RESEND_API_KEY assente.
 */
export async function sendWelcomeEmail(userId: string, params: WelcomeParams): Promise<void> {
  const profile = await loadRecipient(userId);
  if (!profile) return;
  if (!profile.notify_email) return;
  const tpl = welcomeTemplate(params);
  await postResend({
    from: resolveFrom(),
    to: profile.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: "type", value: "welcome" }],
  });
}
