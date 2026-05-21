/**
 * POST /api/support/chat
 *
 * Endpoint del Support Concierge AI agent.
 *
 * Body:
 *   {
 *     session_id: string,        // hex 16ch generato client-side
 *     message: string,           // nuovo messaggio dell'utente
 *     history: Array<{role, content}>, // ultime N turn (max 10), inviate dal client
 *     context: { current_url?: string }
 *   }
 *
 * Response:
 *   {
 *     reply: string,
 *     escalate: boolean,
 *     actions?: Array<{type:"link", label, href}>
 *   }
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE
 *
 * Auth: opzionale. Se Bearer/cookie validi, user_id salvato nella chat
 * per future analytics. Se anon, chat funziona ugualmente.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/support/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.SUPPORT_CONCIERGE_MODEL || "claude-sonnet-4-5";
const MAX_HISTORY = 10;

interface ChatBody {
  session_id?: string;
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  context?: { current_url?: string };
}

interface ChatResponse {
  reply: string;
  escalate: boolean;
  actions?: Array<{ type: "link"; label: string; href: string }>;
}

/** Risolve user_id da Bearer o cookies (opzionale per il concierge). */
async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data } = await admin.auth.getUser(token);
    if (data.user) return data.user.id;
  }
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user.id;
  } catch {
    /* niente cookies, OK procediamo anon */
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.session_id || typeof body.session_id !== "string") {
    return NextResponse.json(
      { error: "missing_session_id" },
      { status: 400 }
    );
  }
  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "missing_message" }, { status: 400 });
  }
  if (body.message.length > 2000) {
    return NextResponse.json(
      { error: "message_too_long", detail: "max 2000 char" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[support/chat] ANTHROPIC_API_KEY not configured");
    return NextResponse.json(
      { error: "configuration_error" },
      { status: 500 }
    );
  }

  const userId = await getUserId(req);

  // Profilo display name (opzionale, per personalizzazione "Ciao Luca!")
  let userDisplayName: string | undefined;
  if (userId) {
    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    userDisplayName = profile?.display_name || undefined;
  }

  const systemPrompt = buildSystemPrompt({
    current_url: body.context?.current_url,
    user_loggedin: !!userId,
    user_display_name: userDisplayName,
  });

  // Costruisci messaggi: ultime N history + nuovo messaggio
  const historyTrimmed = (body.history || []).slice(-MAX_HISTORY);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...historyTrimmed,
    { role: "user", content: body.message },
  ];

  const anthropic = new Anthropic({
    apiKey,
    maxRetries: 1,
    timeout: 20_000,
  });

  let apiResponse: Awaited<ReturnType<typeof anthropic.messages.create>>;
  try {
    apiResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    console.error(
      "[support/chat] Anthropic error",
      err.status,
      err.message
    );
    return NextResponse.json(
      {
        reply:
          "Ops, scusa, ho avuto un problema tecnico. Riprova fra un secondo. Se persiste, scrivi direttamente a Luca: psyluca@gmail.com",
        escalate: false,
      },
      { status: 200 }
    );
  }

  // Estrai il JSON dalla risposta
  const textBlock = apiResponse.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      {
        reply: "Non sono sicuro di aver capito. Prova a rifrasare?",
        escalate: false,
      },
      { status: 200 }
    );
  }

  const parsed = parseJsonReply(textBlock.text);
  if (!parsed) {
    // Fallback se l'LLM non rispetta il formato JSON
    return NextResponse.json<ChatResponse>(
      {
        reply: textBlock.text.slice(0, 800),
        escalate: false,
      },
      { status: 200 }
    );
  }

  // Persisti la chat (best-effort, non blocca la risposta)
  const admin = createSupabaseAdmin();
  const metadata = body.context || {};
  void admin
    .from("support_chats")
    .insert([
      {
        session_id: body.session_id,
        user_id: userId,
        role: "user",
        content: body.message,
        metadata,
        escalated: false,
      },
      {
        session_id: body.session_id,
        user_id: userId,
        role: "assistant",
        content: parsed.reply,
        metadata: { ...metadata, actions: parsed.actions || [] },
        escalated: parsed.escalate,
      },
    ])
    .then((res) => {
      if (res.error)
        console.warn("[support/chat] db insert failed", res.error.message);
    });

  // Se escalation, manda email a Luca (fire-and-forget)
  if (parsed.escalate) {
    void escalateToLuca({
      sessionId: body.session_id,
      userId,
      userDisplayName,
      lastMessage: body.message,
      lastReply: parsed.reply,
      currentUrl: body.context?.current_url,
      history: historyTrimmed,
    }).catch((e) => {
      console.warn("[support/chat] escalation email failed", e);
    });
  }

  return NextResponse.json<ChatResponse>(parsed, { status: 200 });
}

/** Parser robusto JSON dalla risposta LLM (anche se wrappata in code fence). */
function parseJsonReply(text: string): ChatResponse | null {
  const trimmed = text.trim();
  let jsonStr = trimmed;

  // Strip markdown fence se presente
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  // Find first {...} balanced if non-pure-JSON
  if (!jsonStr.startsWith("{")) {
    const start = jsonStr.indexOf("{");
    if (start < 0) return null;
    let depth = 0;
    let end = -1;
    for (let i = start; i < jsonStr.length; i++) {
      if (jsonStr[i] === "{") depth++;
      else if (jsonStr[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end < 0) return null;
    jsonStr = jsonStr.slice(start, end);
  }

  try {
    const parsed = JSON.parse(jsonStr) as ChatResponse;
    if (typeof parsed.reply !== "string") return null;
    return {
      reply: parsed.reply,
      escalate: !!parsed.escalate,
      actions: Array.isArray(parsed.actions) ? parsed.actions : undefined,
    };
  } catch {
    return null;
  }
}

/** Invia mail a Luca con cronologia + contesto chat. */
async function escalateToLuca(opts: {
  sessionId: string;
  userId: string | null;
  userDisplayName?: string;
  lastMessage: string;
  lastReply: string;
  currentUrl?: string;
  history: Array<{ role: string; content: string }>;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[support/escalate] RESEND_API_KEY not set, skipping");
    return;
  }

  const lucaEmail = process.env.SUPPORT_ESCALATION_EMAIL || "psyluca@gmail.com";
  const historyHtml = opts.history
    .map(
      (h) =>
        `<p style="margin:8px 0"><strong>${h.role}:</strong> ${escapeHtml(h.content)}</p>`
    )
    .join("");

  const subject = `🆘 Concierge escalation — ${opts.userDisplayName || (opts.userId ? "utente loggato" : "anonimo")}`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#D4537E">🆘 Concierge ha escalato a te</h2>
  <p><strong>Session:</strong> ${escapeHtml(opts.sessionId)}</p>
  <p><strong>Utente:</strong> ${opts.userId ? escapeHtml(opts.userId) : "anonimo"}${opts.userDisplayName ? ` (${escapeHtml(opts.userDisplayName)})` : ""}</p>
  <p><strong>Pagina:</strong> ${opts.currentUrl ? `<code>${escapeHtml(opts.currentUrl)}</code>` : "n/a"}</p>
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
  <h3>Cronologia chat</h3>
  ${historyHtml}
  <div style="background:#fff5f8;border:1px solid #f9c8d9;border-radius:8px;padding:12px;margin-top:16px">
    <p style="margin:0 0 6px"><strong>Ultimo user:</strong> ${escapeHtml(opts.lastMessage)}</p>
    <p style="margin:0"><strong>Risposta concierge:</strong> ${escapeHtml(opts.lastReply)}</p>
  </div>
  <p style="margin-top:24px;font-size:12px;color:#888">L'utente attende risposta entro 24h. Rispondi via email o internamente nel sistema BeGift.</p>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "BeGift <hi@begift.app>",
      to: lucaEmail,
      subject,
      html,
    }),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
