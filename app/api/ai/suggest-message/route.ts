import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/ai/suggest-message
 *
 * Genera 3 proposte di messaggio per il gift che il mittente sta
 * componendo. Chiamata lato server (la chiave Anthropic non è mai
 * esposta al client).
 *
 * Body JSON:
 *   {
 *     recipientName: string,       // "Maria", "Mamma", "papà", ecc.
 *     senderName?: string,
 *     occasion?: string,           // "compleanno", "laurea", "San Valentino", libero
 *     tone?: "affettuoso" | "formale" | "scherzoso" | "poetico",
 *     contentHint?: string,        // eventuale descrizione del regalo/contesto
 *     locale?: "it" | "en" | "ja" | "zh"
 *   }
 *
 * Risposta 200:
 *   { suggestions: [string, string, string] }
 *
 * Risposte di errore:
 *   400 { error: "invalid_input" }
 *   401 { error: "not_authenticated" }   // l'utente deve essere loggato
 *   429 { error: "rate_limited" }
 *   500 { error: "ai_unavailable" | "internal" }
 *
 * Modello: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`). Haiku è il
 * tier più economico di Anthropic, ideale per questo use-case che
 * chiede output brevi, creativi ma non long-form. Costo tipico per
 * richiesta: <€0.001.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // non cacheare

// Soft rate limit in-memory per istanza serverless: max 10 richieste
// per utente ogni 10 minuti. Non persiste tra deploy / invocazioni
// diverse, ma protegge comunque da hammering accidentale.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateState = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const cur = rateState.get(userId);
  if (!cur || now - cur.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateState.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (cur.count >= RATE_LIMIT_MAX) return false;
  cur.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ai/suggest-message] ANTHROPIC_API_KEY not set");
    return NextResponse.json({ error: "ai_unavailable" }, { status: 500 });
  }

  // Auth check — l'assistente AI è riservato a utenti loggati per
  // prevenire abuso costi.
  const sb = createSupabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const userId = userData.user.id;

  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = parseInput(body);
  if (!input.ok) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const prompt = buildPrompt(input.value);

  // Chiamata REST diretta ad Anthropic — nessuna SDK required.
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[ai/suggest-message] Anthropic error:", response.status, errText);
      return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
    }

    const data = await response.json();
    // Struttura attesa: { content: [{ type: "text", text: "..." }], ... }
    const text: string = data?.content?.[0]?.text ?? "";
    if (!text) {
      return NextResponse.json({ error: "empty_response" }, { status: 502 });
    }

    const suggestions = parseSuggestions(text);
    if (suggestions.length < 1) {
      return NextResponse.json({ error: "parse_failed" }, { status: 502 });
    }

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (e) {
    console.error("[ai/suggest-message] fetch exception:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ── Validation / parsing ──

interface Input {
  recipientName: string;
  senderName?: string;
  occasion?: string;
  tone: "affettuoso" | "formale" | "scherzoso" | "poetico";
  contentHint?: string;
  locale: "it" | "en" | "ja" | "zh";
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function parseInput(body: unknown): Parsed<Input> {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_input" };
  const b = body as Record<string, unknown>;

  const recipientName = typeof b.recipientName === "string" ? b.recipientName.trim().slice(0, 60) : "";
  if (!recipientName) return { ok: false, error: "missing_recipient" };

  const senderName = typeof b.senderName === "string" ? b.senderName.trim().slice(0, 60) : undefined;
  const occasion = typeof b.occasion === "string" ? b.occasion.trim().slice(0, 80) : undefined;
  const contentHint = typeof b.contentHint === "string" ? b.contentHint.trim().slice(0, 200) : undefined;

  const allowedTones = ["affettuoso", "formale", "scherzoso", "poetico"] as const;
  const tone = (allowedTones as readonly string[]).includes(b.tone as string)
    ? (b.tone as Input["tone"])
    : "affettuoso";

  const allowedLocales = ["it", "en", "ja", "zh"] as const;
  const locale = (allowedLocales as readonly string[]).includes(b.locale as string)
    ? (b.locale as Input["locale"])
    : "it";

  return { ok: true, value: { recipientName, senderName, occasion, tone, contentHint, locale } };
}

function buildPrompt(i: Input): string {
  const langInstr: Record<Input["locale"], string> = {
    it: "Rispondi in italiano.",
    en: "Reply in English.",
    ja: "日本語で答えてください.",
    zh: "请用中文回答.",
  };
  const toneDescIt: Record<Input["tone"], string> = {
    affettuoso: "caldo, sincero, pieno di affetto",
    formale: "rispettoso, elegante, misurato",
    scherzoso: "divertente, ironico, leggero",
    poetico: "evocativo, metaforico, emotivo",
  };
  const toneDesc = toneDescIt[i.tone];

  const lines: string[] = [];
  lines.push(`Sto creando un regalo digitale personalizzato. Mi servono 3 proposte di messaggio diverse per accompagnarlo.`);
  lines.push(``);
  lines.push(`CONTESTO:`);
  lines.push(`- Destinatario: ${i.recipientName}`);
  if (i.senderName) lines.push(`- Mittente: ${i.senderName}`);
  if (i.occasion) lines.push(`- Occasione: ${i.occasion}`);
  if (i.contentHint) lines.push(`- Contesto/contenuto del regalo: ${i.contentHint}`);
  lines.push(`- Tono richiesto: ${i.tone} (${toneDesc})`);
  lines.push(``);
  lines.push(`REGOLE:`);
  lines.push(`- Ogni proposta deve essere 2-4 frasi, max 280 caratteri.`);
  lines.push(`- Proposte chiaramente diverse tra loro (angolature, lunghezze, emozione).`);
  lines.push(`- NON usare il nome del mittente dentro il testo (lo firma lui dopo).`);
  lines.push(`- Usa il nome del destinatario in modo naturale, non per forza sempre.`);
  lines.push(`- Niente hashtag, niente emoji eccessive (max 1-2 dove naturali).`);
  lines.push(`- ${langInstr[i.locale]}`);
  lines.push(``);
  lines.push(`FORMATO DELLA RISPOSTA (strict):`);
  lines.push(`Rispondi SOLO con 3 blocchi separati da "---" (tre trattini su una riga a parte). Nessun'altra frase, nessun titolo, nessun numero, nessuna introduzione.`);
  lines.push(``);
  lines.push(`Esempio formato:`);
  lines.push(`Primo messaggio proposto qui.`);
  lines.push(`---`);
  lines.push(`Secondo messaggio proposto qui.`);
  lines.push(`---`);
  lines.push(`Terzo messaggio proposto qui.`);

  return lines.join("\n");
}

function parseSuggestions(text: string): string[] {
  // Normalizza e splitta su "---" (con qualunque whitespace attorno)
  const parts = text
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Tolgo numerazioni "1.", "1)", "-", "•" all'inizio (se il modello ignora il formato)
  const cleaned = parts.map((p) => p.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim());

  // Rimuovo eventuali virgolette wrapping ("…" o "...")
  const unquoted = cleaned.map((p) =>
    p.replace(/^["«"]/, "").replace(/["»"]$/, "").trim()
  );

  return unquoted.slice(0, 3);
}
