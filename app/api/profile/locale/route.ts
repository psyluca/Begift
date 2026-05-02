/**
 * POST /api/profile/locale
 *
 * Salva la lingua preferita dell'utente nel DB. Chiamato dal
 * LangSwitcher quando l'utente cambia lingua. Persistere il valore
 * server-side serve per le email transazionali: emailTemplates.ts
 * legge users.preferred_locale per generare la variant giusta.
 *
 * Idempotente: chiamare con la stessa locale due volte non ha effetti
 * collaterali. Best-effort: se la migration 020 non è ancora stata
 * eseguita, il route ritorna 200 silenzioso senza scrivere nulla
 * (il client continua comunque a usare localStorage per la UI).
 *
 * Body:
 *   { locale: "it" | "en" | "ja" | "zh" }
 *
 * Response:
 *   200 { ok: true }
 *   400 { error: "invalid_locale" }
 *   401 { error: "unauthorized" }
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_LOCALES = ["it", "en", "ja", "zh"] as const;
type AllowedLocale = (typeof ALLOWED_LOCALES)[number];

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) userId = data.user.id;
  }
  if (!userId) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) userId = data.user.id;
  }
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const locale = (body.locale || "").toLowerCase().trim() as AllowedLocale;
  if (!ALLOWED_LOCALES.includes(locale)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  // Best-effort: se la colonna preferred_locale non esiste ancora
  // (migration 020 non eseguita), lo update fallisce ma noi ritorniamo
  // 200 silenzioso. Il client continua a funzionare con localStorage
  // come unica fonte fino a quando la migration non è in produzione.
  const admin = createSupabaseAdmin();
  try {
    const { error } = await admin
      .from("profiles")
      .update({ preferred_locale: locale })
      .eq("id", userId);
    if (error) {
      // Probabile migration mancante. Non rompere il client.
      console.warn("[profile/locale] update skipped:", error.message);
    }
  } catch (e) {
    console.warn("[profile/locale] update exception:", e);
  }

  return NextResponse.json({ ok: true });
}
