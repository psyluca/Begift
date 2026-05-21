/**
 * Notifica utente quando un nuovo draft email è pronto.
 *
 * Riutilizza il sistema Resend gia' esistente in lib/email.ts.
 * Invio email transazionale con CTA per completare il draft.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";

interface NotifyOptions {
  draftId: string;
  userId: string;
  title?: string;
  detectedMerchant?: string;
}

/**
 * Manda email all'utente che un draft e' pronto.
 * Non blocca l'esecuzione se Resend non e' configurato (logga warning).
 */
export async function notifyDraftReady(opts: NotifyOptions): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[notify-draft] RESEND_API_KEY not set, skipping notification");
    return;
  }

  // Fetch user email
  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, display_name, notify_email")
    .eq("id", opts.userId)
    .maybeSingle();

  if (!profile?.email || profile.notify_email === false) {
    return; // Utente ha disabilitato notifiche email
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://begift.app";
  const draftUrl = `${appUrl}/draft/${opts.draftId}`;
  const recipientName = profile.display_name || "ciao";

  const subject = opts.title
    ? `🎁 Il tuo regalo "${opts.title}" e' pronto da completare`
    : `🎁 Il tuo nuovo regalo BeGift e' pronto`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:system-ui,sans-serif;background:#f7f5f2">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;padding:32px 24px">
    <p style="font-size:14px;color:#888;margin:0 0 8px">Ciao ${escapeHtml(recipientName)},</p>
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 16px;letter-spacing:-0.3px">
      Ho letto la tua mail e ho preparato il pacco
    </h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px">
      Ho estratto le informazioni dall'email che hai inoltrato${opts.detectedMerchant ? ` da <strong>${escapeHtml(opts.detectedMerchant)}</strong>` : ""}.
      ${opts.title ? `Il pacco "${escapeHtml(opts.title)}" e' pronto da personalizzare.` : "Il pacco e' pronto da personalizzare."}
    </p>
    <p style="text-align:center;margin:32px 0">
      <a href="${draftUrl}" style="background:#D4537E;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 8px 24px rgba(212,83,126,.3)">
        Apri il pacco e completalo →
      </a>
    </p>
    <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0">
      Bastano pochi secondi: aggiungi un messaggio personale per chi ricevera' il regalo, e invialo.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px">
    <p style="font-size:11px;color:#aaa;line-height:1.5;margin:0">
      Hai ricevuto questa mail perche' hai attivato il servizio "Inoltro mail → regalo automatico"
      su BeGift. <a href="${appUrl}/settings#email-parser" style="color:#888">Disattiva</a> ·
      <a href="${appUrl}/privacy" style="color:#888">Privacy</a>
    </p>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "BeGift <hi@begift.app>",
        to: profile.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "no body");
      console.error("[notify-draft] resend error", res.status, errText.slice(0, 200));
    }
  } catch (e) {
    console.error("[notify-draft] exception", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
