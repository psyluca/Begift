/**
 * POST /api/profile/check-username
 *
 * Verifica se uno username è disponibile. Usato dal modal di
 * onboarding per dare feedback in tempo reale all'utente mentre
 * scrive (debounced lato client a ~400ms).
 *
 * Body: { handle: string }
 * Response:
 *   { available: true }  → lo puoi usare
 *   { available: false, reason: "taken" | "invalid" | "reserved" }
 *
 * Non richiede auth — è un check read-only, non leakka informazioni
 * utili (chiunque potrebbe provare a registrarsi per scoprire se un
 * handle esiste, e il nostro vincolo univocità lo renderebbe
 * scoperto comunque).
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateUsername, normalizeHandle } from "@/lib/username";

export async function POST(req: NextRequest) {
  const { handle: raw } = await req.json();
  if (typeof raw !== "string") {
    return NextResponse.json({ available: false, reason: "invalid" }, { status: 400 });
  }

  // Normalizzazione forzata (il client potrebbe mandare formato non pulito)
  const handle = normalizeHandle(raw);
  const validation = validateUsername(handle);
  if (!validation.ok) {
    return NextResponse.json({
      available: false,
      reason: validation.reason === "reserved" ? "reserved" : "invalid",
    });
  }

  // Query esistenza via service_role (bypass RLS per la lookup).
  // Uso lower() per coerenza con l'unique index case-insensitive,
  // anche se handle è già lowercase post-normalize.
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", handle)
    .limit(1)
    .maybeSingle();

  if (data) {
    return NextResponse.json({ available: false, reason: "taken" });
  }
  return NextResponse.json({ available: true });
}
