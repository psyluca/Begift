/**
 * POST /api/admin/announce/festa-mamma
 *
 * Invia la campagna email "festa_mamma_2026" a tutti gli utenti
 * registrati che soddisfano i criteri:
 *
 *  - hanno una email valida
 *  - notify_email = true (non hanno disattivato le email)
 *  - email_campaigns_sent NON contiene gia' "festa_mamma_2026"
 *
 * Dry-run di default: senza body { confirm: true } ritorna soltanto
 * il conteggio + i primi 5 candidati come sample. Per inviare per
 * davvero, body { confirm: true }.
 *
 * Auth: ADMIN_EMAILS env var (stesso pattern delle altre route admin).
 *
 * Body opzionale:
 *   {
 *     confirm?: boolean,   // default false → dry-run
 *     daysLeft?: number,   // override del calcolo automatico
 *     limit?: number,      // max destinatari per chiamata (default 1000)
 *     batchDelayMs?: number // pausa tra mail per non sfondare il rate
 *                            limit Resend. Default 200ms = 5 mail/sec.
 *   }
 *
 * Response:
 *   200 {
 *     dry_run: boolean,
 *     campaign_id: "festa_mamma_2026",
 *     candidates: N,
 *     sample: [{ email, name }, ...],
 *     // SOLO se confirm=true:
 *     sent: N,
 *     skipped: { already_sent, opted_out, no_email, send_failed },
 *     errors: [{ user_id, reason }, ...]
 *   }
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { sendFestaMammaAnnounce, type CampaignSendResult } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuti — basta per qualche centinaio di mail

const CAMPAIGN_ID = "festa_mamma_2026";
const FESTA_MAMMA_TARGET = { month: 5, day: 11 }; // 11 maggio 2026

function daysUntilFestaMamma(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), FESTA_MAMMA_TARGET.month - 1, FESTA_MAMMA_TARGET.day);
  if (target.getTime() < today.getTime()) {
    // Festa Mamma e' gia' passata quest'anno → prossimo anno
    target = new Date(now.getFullYear() + 1, FESTA_MAMMA_TARGET.month - 1, FESTA_MAMMA_TARGET.day);
  }
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

async function resolveAdminEmail(req: NextRequest): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await admin.auth.getUser(token);
    if (data.user?.email) return data.user.email;
  }
  return null;
}

export async function POST(req: NextRequest) {
  // Auth admin
  const callerEmail = await resolveAdminEmail(req);
  if (!isAdminEmail(callerEmail)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Body parsing
  const body = await req.json().catch(() => ({}));
  const confirm = body.confirm === true;
  const daysLeftOverride: number | null = typeof body.daysLeft === "number" ? body.daysLeft : null;
  const limit: number = Math.max(1, Math.min(2000, Number(body.limit) || 1000));
  const batchDelayMs: number = Math.max(0, Math.min(2000, Number(body.batchDelayMs) || 200));

  const daysLeft = daysLeftOverride ?? daysUntilFestaMamma();
  const admin = createSupabaseAdmin();

  // Trova candidati: hanno email, notify_email=true, NON hanno la
  // campagna gia' segnata. Per la jsonb-contains-key in PostgREST si
  // usa il filtro `cs` (contains)? In realta' Supabase non espone un
  // operatore "non-contiene-chiave" nativo. Strategia robusta:
  // selezioniamo TUTTO + filtriamo in JS. Per <5000 utenti e una
  // campagna sporadica e' assolutamente OK (1 query, ~200kb max).
  const { data: rows, error } = await admin
    .from("profiles")
    .select("id, email, display_name, username, notify_email, email_campaigns_sent")
    .not("email", "is", null);
  if (error) {
    console.error("[announce/festa-mamma] query error", error);
    return NextResponse.json({ error: "server", detail: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    email: string;
    display_name: string | null;
    username: string | null;
    notify_email: boolean;
    email_campaigns_sent: Record<string, string> | null;
  };

  const candidates: Row[] = ((rows ?? []) as Row[]).filter((r) => {
    if (!r.email) return false;
    if (r.notify_email === false) return false;
    const sent = r.email_campaigns_sent ?? {};
    if (sent[CAMPAIGN_ID]) return false;
    return true;
  });

  const truncated = candidates.slice(0, limit);
  const sample = truncated.slice(0, 5).map((r) => ({
    email: r.email,
    name: r.display_name || r.username || null,
  }));

  if (!confirm) {
    return NextResponse.json({
      dry_run: true,
      campaign_id: CAMPAIGN_ID,
      days_left: daysLeft,
      candidates: candidates.length,
      will_send_to: truncated.length,
      sample,
    });
  }

  // INVIO REALE
  let sent = 0;
  const skipped = { already_sent: 0, opted_out: 0, no_email: 0, send_failed: 0, no_api_key: 0 };
  const errors: { user_id: string; reason?: string }[] = [];

  for (let i = 0; i < truncated.length; i++) {
    const r = truncated[i];
    try {
      const res: CampaignSendResult = await sendFestaMammaAnnounce(r.id, {
        name: r.display_name || r.username || undefined,
        daysLeft,
      });
      if (res.sent) {
        sent++;
      } else if (res.reason === "already_sent") {
        skipped.already_sent++;
      } else if (res.reason === "opted_out") {
        skipped.opted_out++;
      } else if (res.reason === "no_email") {
        skipped.no_email++;
      } else if (res.reason === "no_api_key") {
        skipped.no_api_key++;
        errors.push({ user_id: r.id, reason: "no_api_key" });
      } else {
        skipped.send_failed++;
        errors.push({ user_id: r.id, reason: res.reason });
      }
    } catch (e) {
      console.error("[announce/festa-mamma] send exception for", r.id, e);
      errors.push({ user_id: r.id, reason: "exception" });
    }
    // Pausa tra mail per non saturare il rate Resend (default 5/s su
    // piano free; 10/s su piani paid). 200ms = ~5 mail/s che sta
    // sotto il limite gratis.
    if (i < truncated.length - 1 && batchDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    }
  }

  return NextResponse.json({
    dry_run: false,
    campaign_id: CAMPAIGN_ID,
    days_left: daysLeft,
    candidates: candidates.length,
    will_send_to: truncated.length,
    sent,
    skipped,
    errors: errors.slice(0, 50), // primi 50 — non gonfiare la response
  });
}
