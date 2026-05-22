/**
 * GET /api/admin/support/sessions
 *
 * Aggrega le ultime sessioni del Support Concierge per la dashboard
 * admin `/admin/support`. Restituisce per ogni session_id:
 *   - first_at / last_at (range temporale)
 *   - turn_count (numero messaggi totali)
 *   - has_escalation (true se almeno 1 turn ha escalated=true)
 *   - last_user_message (preview ultimo messaggio utente)
 *   - last_assistant_reply (preview ultima risposta concierge)
 *   - user_id (se utente loggato)
 *
 * Query params (opzionali):
 *   - ?onlyEscalated=1  → filtra solo sessioni con escalation
 *   - ?limit=N          → default 50, max 200
 *
 * Auth: admin user (whitelist ADMIN_EMAILS). Stesso pattern di
 * /api/admin/catalog/runs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest): Promise<{
  ok: true;
  email: string;
} | { ok: false; res: NextResponse }> {
  let email: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) email = data.user.email ?? null;
  }
  if (!email) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  if (!isAdminEmail(email)) {
    return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, email: email! };
}

interface SessionSummary {
  session_id: string;
  user_id: string | null;
  first_at: string;
  last_at: string;
  turn_count: number;
  has_escalation: boolean;
  last_user_message: string | null;
  last_assistant_reply: string | null;
  last_url: string | null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const onlyEscalated = url.searchParams.get("onlyEscalated") === "1";
  const limit = Math.min(
    200,
    parseInt(url.searchParams.get("limit") || "50", 10) || 50
  );

  const admin = createSupabaseAdmin();

  // Fetch ultimi ~1000 turn per costruire l'aggregato in memoria.
  // Per ora 1000 e' abbondante per il volume previsto (<200 chat/mese).
  // Se in futuro cresce, fare RPC SQL aggregata server-side.
  const { data: turns, error } = await admin
    .from("support_chats")
    .select("session_id, user_id, role, content, metadata, escalated, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: error.message },
      { status: 500 }
    );
  }

  // Aggrega per session_id
  const bySession = new Map<string, SessionSummary>();
  for (const t of (turns || []) as Array<{
    session_id: string;
    user_id: string | null;
    role: string;
    content: string;
    metadata: { current_url?: string } | null;
    escalated: boolean;
    created_at: string;
  }>) {
    let s = bySession.get(t.session_id);
    if (!s) {
      s = {
        session_id: t.session_id,
        user_id: t.user_id,
        first_at: t.created_at,
        last_at: t.created_at,
        turn_count: 0,
        has_escalation: false,
        last_user_message: null,
        last_assistant_reply: null,
        last_url: null,
      };
      bySession.set(t.session_id, s);
    }
    s.turn_count += 1;
    s.has_escalation ||= t.escalated;
    // turns is DESC, so first iteration is the most recent; capture last_*
    if (t.role === "user" && !s.last_user_message) {
      s.last_user_message = t.content.slice(0, 200);
    }
    if (t.role === "assistant" && !s.last_assistant_reply) {
      s.last_assistant_reply = t.content.slice(0, 200);
    }
    if (!s.last_url && t.metadata?.current_url) {
      s.last_url = t.metadata.current_url;
    }
    // first_at = oldest seen (since DESC iteration, every new one is older)
    if (t.created_at < s.first_at) s.first_at = t.created_at;
    if (t.created_at > s.last_at) s.last_at = t.created_at;
    if (!s.user_id && t.user_id) s.user_id = t.user_id;
  }

  let sessions = Array.from(bySession.values()).sort(
    (a, b) => (a.last_at < b.last_at ? 1 : -1)
  );
  if (onlyEscalated) {
    sessions = sessions.filter((s) => s.has_escalation);
  }
  sessions = sessions.slice(0, limit);

  // Stats globali
  const totalSessions = bySession.size;
  const totalEscalations = Array.from(bySession.values()).filter(
    (s) => s.has_escalation
  ).length;
  const totalTurns = (turns || []).length;

  return NextResponse.json({
    sessions,
    stats: {
      total_sessions: totalSessions,
      total_escalations: totalEscalations,
      total_turns_in_window: totalTurns,
      window_size: 1000,
    },
  });
}
