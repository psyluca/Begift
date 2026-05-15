/**
 * GET /api/experiences/[id]
 *
 * Restituisce dettaglio singola esperienza (con partner inline).
 * Pubblico, no auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ExperienceWithPartner } from "@/types/experiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("[api/experiences/:id] error", error);
    return NextResponse.json(
      { error: "server", detail: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data as ExperienceWithPartner, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
