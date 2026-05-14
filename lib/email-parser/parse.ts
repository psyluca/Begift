/**
 * Email parser entry point.
 *
 * Prende una InboundEmail, identifica il merchant, chiama Claude API
 * con prompt strutturato, parsa il JSON di output, valida lo schema.
 *
 * Ritorna ParseResult con success/failure e dati estratti.
 *
 * Implementazione: usa il SDK ufficiale `@anthropic-ai/sdk` invece di
 * fetch raw. In dev mode Next.js ha bug con il global fetch (HTTP agent
 * issues, "fetch failed" intermittenti); il SDK ufficiale usa un agent
 * propio che bypassa il problema.
 */

import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, detectMerchant } from "./prompts";
import type {
  InboundEmail,
  ParsedEmailContent,
  ParseResult,
  SupportedMerchant,
} from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/**
 * Parsa una email forwardata estraendo dati strutturati.
 *
 * @param email - email da parsare
 * @param opts.model - override modello Claude (default haiku)
 * @returns ParseResult con content o error
 */
export async function parseEmail(
  email: InboundEmail,
  opts: { model?: string } = {}
): Promise<ParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      content: null,
      status: "failed",
      error: "ANTHROPIC_API_KEY not configured",
    };
  }

  const merchant = detectMerchant(email);
  const prompt = buildPrompt(email, merchant);
  const model = opts.model || process.env.EMAIL_PARSER_MODEL || DEFAULT_MODEL;

  const startedAt = Date.now();

  // SDK ufficiale Anthropic: gestisce HTTP agent, retry built-in,
  // timeout configurabili. Robusto in dev mode Next.js.
  const anthropic = new Anthropic({
    apiKey,
    maxRetries: 2, // retry automatico su errori transitori (network, 5xx)
    timeout: 30_000, // 30s timeout
  });

  let apiResponse: Awaited<ReturnType<typeof anthropic.messages.create>>;
  try {
    apiResponse = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (e) {
    const error = e as Error & { status?: number; error?: { message?: string } };
    const duration = Date.now() - startedAt;
    return {
      content: null,
      status: "failed",
      error: error.status
        ? `Anthropic API error ${error.status}: ${error.error?.message || error.message}`
        : `Anthropic SDK error: ${error.message}`,
      llm_model_used: model,
      duration_ms: duration,
    };
  }

  const duration = Date.now() - startedAt;

  const textBlock = apiResponse.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return {
      content: null,
      status: "failed",
      error: "No text block in Claude response",
      llm_model_used: model,
      duration_ms: duration,
    };
  }

  // Estrai JSON dalla risposta (potrebbe avere markdown fence o testo extra)
  const jsonText = extractJson(textBlock.text);
  if (!jsonText) {
    return {
      content: null,
      status: "failed",
      error: `No JSON found in response: ${textBlock.text.slice(0, 200)}`,
      llm_model_used: model,
      duration_ms: duration,
    };
  }

  let parsed: ParsedEmailContent;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return {
      content: null,
      status: "failed",
      error: `Invalid JSON: ${(e as Error).message}`,
      llm_model_used: model,
      duration_ms: duration,
    };
  }

  // Valida schema minimo
  const validation = validateContent(parsed, merchant);
  if (!validation.valid) {
    return {
      content: parsed, // restituiamo comunque, marcato come low_confidence
      status: "low_confidence",
      error: `Schema validation: ${validation.errors.join("; ")}`,
      llm_model_used: model,
      tokens_input: apiResponse.usage?.input_tokens,
      tokens_output: apiResponse.usage?.output_tokens,
      duration_ms: duration,
    };
  }

  // Override merchant con quello detected (in caso LLM si sbagli)
  if (merchant !== "unknown" && parsed.merchant !== merchant) {
    parsed.merchant = merchant;
    parsed.warnings = [
      ...(parsed.warnings || []),
      `Merchant detected from sender (${merchant}) override LLM value (${parsed.merchant})`,
    ];
  }

  // Confidence threshold
  const finalStatus: ParseResult["status"] =
    typeof parsed.confidence === "number" && parsed.confidence < 0.5
      ? "low_confidence"
      : "success";

  return {
    content: parsed,
    status: finalStatus,
    llm_model_used: model,
    tokens_input: apiResponse.usage?.input_tokens,
    tokens_output: apiResponse.usage?.output_tokens,
    duration_ms: duration,
  };
}

/**
 * Estrae il primo blocco JSON valido dal testo di Claude.
 * Gestisce sia output puri sia output con markdown code fences.
 */
function extractJson(text: string): string | null {
  // Caso 1: JSON puro
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  // Caso 2: dentro markdown code fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Caso 3: cerca il primo blocco { ... } bilanciato
  let depth = 0;
  let start = -1;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (trimmed[i] === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        return trimmed.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Validazione schema minima del parsed content.
 * Non e' uno schema completo (sarebbe over-engineering per il POC),
 * controlla solo i campi essenziali.
 */
function validateContent(
  c: Partial<ParsedEmailContent>,
  expectedMerchant: SupportedMerchant
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!c.merchant) errors.push("missing 'merchant'");
  if (!c.type) errors.push("missing 'type'");
  if (typeof c.confidence !== "number") errors.push("missing or invalid 'confidence'");
  if (c.confidence !== undefined && (c.confidence < 0 || c.confidence > 1)) {
    errors.push("'confidence' out of range [0,1]");
  }

  // Per merchant noti, controlla che ci siano almeno alcuni campi essenziali
  if (expectedMerchant !== "unknown" && c.confidence !== undefined && c.confidence > 0.5) {
    if (!c.title) errors.push("missing 'title' for known merchant");
  }

  return { valid: errors.length === 0, errors };
}

// Re-export types per consumer comodi
export type { InboundEmail, ParsedEmailContent, ParseResult, SupportedMerchant } from "./types";
export { detectMerchant } from "./prompts";
