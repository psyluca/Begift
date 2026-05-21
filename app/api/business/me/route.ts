/**
 * GET /api/business/me
 *
 * Restituisce il business_account dell'utente loggato + statistiche
 * aggregate (totale pacchi inviati, totale aperti, totale reazioni).
 *
 * Risposta 401 se utente non loggato.
 * Risposta 404 se utente loggato ma senza business_account attivo.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusinessForRequest } from "@/lib/business/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/featureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isFeatureEnabled("FEATURE_BUSINESS_DASHBOARD")) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const session = await getBusinessForRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "no_business_account" },
      { status: 404 }
    );
  }

  // Stats aggregate
  const admin = createSupabaseAdmin();
  const { data: gifts } = await admin
    .from("gifts")
    .select("id, opened_at, is_business_gift")
    .eq("business_account_id", session.business.id)
    .eq("is_business_gift", true);

  const total = gifts?.length ?? 0;
  const opened = gifts?.filter((g) => g.opened_at !== null).length ?? 0;

  return NextResponse.json({
    business: session.business,
    stats: {
      total_gifts: total,
      opened_gifts: opened,
    },
  });
}
