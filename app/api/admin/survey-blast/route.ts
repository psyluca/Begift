/**
 * POST /api/admin/survey-blast
 *
 * Endpoint admin per re-invio mass della mail invito al sondaggio
 * post-gift. Differenza con il cron normale (/api/cron/survey-invites):
 *
 * - Cron normale: pesca solo creator con gift_opens negli ultimi 7gg.
 *   Logica time-based, automatica, daily.
 * - Survey blast: pesca TUTTI gli utenti registered con notify_email=true
 *   che NON hanno mai risposto al sondaggio. Manuale, on-demand, una
 *   tantum dopo un evento di lancio.
 *
 * Caso d'uso: dopo Festa Mamma 2026 abbiamo ricevuto solo 2 risposte
 * sondaggio. Vogliamo aumentare il sample size invitando esplicitamente
 * tutti gli utenti che non hanno ancora compilato.
 *
 * Idempotenza: per ogni utente verifichiamo che NON abbia survey_responses
 * prima di inviare. Re-eseguire il blast più volte è safe — gli utenti
 * che hanno risposto nel frattempo vengono saltati.
 *
 * Auth: solo admin via isAdminEmail (allowlist server-side).
 *
 * Body opzionale: nessuno. È un'azione one-shot.
 *
 * Response: {
 *   eligible: numero utenti da invitare,
 *   sent: numero mail effettivamente partite,
 *   skipped: { no_email, opted_out, send_failed, no_api_key, already_responded }
 * }
 */

import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { sendSurveyInvite, appUrl } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuti — basta per qualche centinaio di mail

export async function POST(req: NextRequest) {
  // ── Auth admin ──────────────────────────────────────────────────────
  let userEmail: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) userEmail = data.user.email ?? null;
  }
  if (!userEmail) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) userEmail = data.user.email ?? null;
  }
  if (!userEmail || !isAdminEmail(userEmail)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ── Trova candidati: utenti con email + notify_email=true che NON
  //    hanno mai compilato il sondaggio.
  const admin = createSupabaseAdmin();
  const { data: candidates, error: candidatesErr } = await admin
    .from("profiles")
    .select("id, email, display_name, username, notify_email, preferred_locale")
    .not("email", "is", null);
  if (candidatesErr || !candidates) {
    console.error("[admin/survey-blast] candidates query error", candidatesErr);
    return NextResponse.json({ error: "server", detail: candidatesErr?.message }, { status: 500 });
  }

  // ── Trova chi ha già risposto al sondaggio ──────────────────────────
  const { data: respondents, error: respErr } = await admin
    .from("survey_responses")
    .select("user_id")
    .not("user_id", "is", null);
  if (respErr) {
    console.error("[admin/survey-blast] respondents query error", respErr);
    return NextResponse.json({ error: "server", detail: respErr.message }, { status: 500 });
  }
  const respondedIds = new Set((respondents ?? []).map((r) => r.user_id as string));

  // ── Filtra: non-respondenti, notify_email on ─────────────────────────
  type Candidate = {
    id: string;
    email: string;
    display_name: string | null;
    username: string | null;
    notify_email: boolean | null;
    preferred_locale: string | null;
  };
  const eligible = (candidates as Candidate[]).filter((c) =>
    !respondedIds.has(c.id) && c.notify_email !== false
  );

  // ── Invio (sequenziale, con pausa per non saturare Resend) ──────────
  const surveyBaseUrl = process.env.SURVEY_TALLY_URL || `${appUrl()}/sondaggio`;
  let sent = 0;
  const skipped = {
    no_email: 0,
    opted_out: 0,
    send_failed: 0,
    no_api_key: 0,
    already_sent: 0,
  };

  for (const user of eligible) {
    // URL personalizzato con userId per tracciamento (no giftId perché
    // potrebbero non avere creato gift — blast generale).
    const url = new URL(surveyBaseUrl);
    url.searchParams.set("userId", user.id);
    const surveyUrl = url.toString();

    const displayName = (user.display_name || user.username) ?? undefined;

    // IMPORTANTE: sendSurveyInvite usa lock atomico su
    // profiles.survey_invite_sent_at. Per riuso esplicito del blast,
    // resettiamo prima il flag a NULL così l'invio parte. Pattern
    // sicuro perché l'idempotenza vera è su survey_responses (sopra).
    await admin
      .from("profiles")
      .update({ survey_invite_sent_at: null })
      .eq("id", user.id);

    const r = await sendSurveyInvite(user.id, {
      name: displayName,
      surveyUrl,
    });

    if (r.sent) sent++;
    else if (r.reason === "already_sent") skipped.already_sent++;
    else if (r.reason === "opted_out") skipped.opted_out++;
    else if (r.reason === "no_email") skipped.no_email++;
    else if (r.reason === "no_api_key") skipped.no_api_key++;
    else skipped.send_failed++;

    // Pausa 220ms per non saturare rate Resend (5 mail/s free tier)
    await new Promise((resolve) => setTimeout(resolve, 220));
  }

  return NextResponse.json({
    eligible: eligible.length,
    sent,
    skipped,
  });
}
