/**
 * Harness per test manuale del parser su fixture.
 *
 * Uso:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx lib/email-parser/__fixtures__/run-test.ts <fixture-name>
 *
 * Esempio:
 *   npx tsx lib/email-parser/__fixtures__/run-test.ts ticketone-vasco
 *
 * Output: JSON parsed + telemetry (tokens, durata, confidence).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { parseEmail } from "../parse";
import type { InboundEmail } from "../types";

async function main() {
  const fixtureName = process.argv[2];
  if (!fixtureName) {
    console.error("Usage: npx tsx run-test.ts <fixture-name>");
    console.error("Available fixtures: ticketone-vasco, smartbox-weekend");
    process.exit(1);
  }

  const path = join(__dirname, `${fixtureName}.txt`);
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (e) {
    console.error(`Cannot read fixture ${path}: ${(e as Error).message}`);
    process.exit(1);
  }

  // Parse RFC822 minimale (From/Subject/Date headers + body)
  const lines = raw.split("\n");
  let headersEnd = 0;
  const headers: Record<string, string> = {};
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "") {
      headersEnd = i;
      break;
    }
    const match = lines[i].match(/^([^:]+):\s*(.*)$/);
    if (match) headers[match[1].toLowerCase()] = match[2];
  }
  const body = lines.slice(headersEnd + 1).join("\n");

  const email: InboundEmail = {
    fromAddress: extractEmail(headers["from"] || ""),
    fromName: extractName(headers["from"] || ""),
    forwardedByEmail: "test@begift.app",
    subject: headers["subject"] || "(no subject)",
    bodyText: body,
    attachments: [],
    receivedAt: new Date().toISOString(),
  };

  console.log("─".repeat(60));
  console.log(`Fixture: ${fixtureName}`);
  console.log(`From: ${email.fromAddress}`);
  console.log(`Subject: ${email.subject}`);
  console.log(`Body length: ${email.bodyText.length} chars`);
  console.log("─".repeat(60));
  console.log("Calling Claude API...");
  console.log();

  const result = await parseEmail(email);

  console.log("RESULT");
  console.log("─".repeat(60));
  console.log(`Status: ${result.status}`);
  if (result.error) console.log(`Error: ${result.error}`);
  console.log(`Model: ${result.llm_model_used}`);
  console.log(`Tokens: ${result.tokens_input} in / ${result.tokens_output} out`);
  console.log(`Duration: ${result.duration_ms}ms`);
  console.log();
  console.log("CONTENT:");
  console.log(JSON.stringify(result.content, null, 2));
  console.log("─".repeat(60));

  // Cost estimation (Haiku ~ $0.80/M input + $4/M output as of 2026)
  if (result.tokens_input && result.tokens_output) {
    const costUsd =
      (result.tokens_input * 0.8) / 1_000_000 +
      (result.tokens_output * 4) / 1_000_000;
    console.log(`Estimated cost: $${costUsd.toFixed(5)} (~€${(costUsd * 0.92).toFixed(5)})`);
  }
}

function extractEmail(value: string): string {
  const m = value.match(/<([^>]+)>/);
  if (m) return m[1];
  return value.trim();
}

function extractName(value: string): string | undefined {
  const m = value.match(/^([^<]+?)\s*</);
  if (m) return m[1].trim().replace(/^"|"$/g, "");
  return undefined;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
