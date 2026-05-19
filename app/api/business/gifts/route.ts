/**
 * Business gifts API
 *
 * GET  /api/business/gifts      → lista pacchi del business loggato (recenti prima)
 * POST /api/business/gifts      → crea nuovo pacco business
 *
 * Solo per business_account in stato 'active'.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusinessForRequest, generateOpenToken } from "@/lib/business/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/featureFlags";
import type { Packaging } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBusinessGiftBody {
  recipient_name: string;
  message?: string | null;
  coupon_file_url: string;        // URL gia' uploadato via /api/business/upload-coupon
  packaging: Packaging;
  /** Tipo del coupon (libero, es. "Massaggio 60min", "Buono €50") */
  coupon_title?: string | null;
  /** Validità descrittiva (es. "6 mesi", "fino al 31/12") */
  coupon_validity?: string | null;
}

const DEFAULT_PACKAGING: Packaging = {
  paperColor: "#F4C0D1",
  ribbonColor: "#D4537E",
  bowColor: "#D4537E",
  bowType: "classic",
  openAnimation: "lift",
  sound: "bells",
};

export async function GET(req: NextRequest) {
  if (!isFeatureEnabled("FEATURE_BUSINESS_DASHBOARD")) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const session = await getBusinessForRequest(req);
  if (!session) {
    return NextResponse.json({ error: "no_business_account" }, { status: 404 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("gifts")
    .select(
      "id, recipient_name, message, opened_at, created_at, open_token, " +
        "coupon_file_url, packaging"
    )
    .eq("business_account_id", session.business.id)
    .eq("is_business_gift", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[business/gifts GET]", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Cast: le colonne is_business_gift/open_token/coupon_file_url sono
  // nuove (migration 025) e non ancora in generated types Supabase.
  type BusinessGiftRow = {
    id: string;
    recipient_name: string;
    message: string | null;
    opened_at: string | null;
    created_at: string;
    open_token: string | null;
    coupon_file_url: string | null;
    packaging: unknown;
  };
  const rows = (data ?? []) as unknown as BusinessGiftRow[];

  // Conta reazioni per ogni gift
  const giftIds = rows.map((g) => g.id);
  let reactionsByGift: Record<string, number> = {};
  if (giftIds.length > 0) {
    const { data: reactions } = await admin
      .from("reactions")
      .select("gift_id")
      .in("gift_id", giftIds);
    reactionsByGift = ((reactions ?? []) as Array<{ gift_id: string }>).reduce<
      Record<string, number>
    >((acc, r) => {
      acc[r.gift_id] = (acc[r.gift_id] || 0) + 1;
      return acc;
    }, {});
  }

  return NextResponse.json({
    gifts: rows.map((g) => ({
      ...g,
      reactions_count: reactionsByGift[g.id] || 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled("FEATURE_BUSINESS_DASHBOARD")) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const session = await getBusinessForRequest(req);
  if (!session) {
    return NextResponse.json({ error: "no_business_account" }, { status: 404 });
  }

  let body: CreateBusinessGiftBody;
  try {
    body = (await req.json()) as CreateBusinessGiftBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.recipient_name?.trim()) {
    return NextResponse.json({ error: "missing_recipient_name" }, { status: 400 });
  }
  if (!body.coupon_file_url?.trim()) {
    return NextResponse.json({ error: "missing_coupon_file_url" }, { status: 400 });
  }

  const openToken = generateOpenToken();
  const packaging = body.packaging || DEFAULT_PACKAGING;

  // Metadata business salvati in template_data (campo jsonb gia' esistente
  // su gifts, migration 013). Vantaggio: niente nuova colonna.
  const templateData = {
    coupon_title: body.coupon_title?.trim().slice(0, 200) || null,
    coupon_validity: body.coupon_validity?.trim().slice(0, 200) || null,
  };

  const admin = createSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    creator_id: session.userId,
    recipient_name: body.recipient_name.trim().slice(0, 100),
    message: body.message?.trim().slice(0, 1000) || null,
    packaging,
    content_type: null,
    content_url: null,
    is_business_gift: true,
    business_account_id: session.business.id,
    coupon_file_url: body.coupon_file_url,
    open_token: openToken,
    template_type: "business_coupon",
    template_data: templateData,
  };
  const { data, error } = await admin
    .from("gifts")
    .insert(insertPayload)
    .select("id, open_token")
    .single();

  if (error || !data) {
    console.error("[business/gifts POST]", error?.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  const row = data as unknown as { id: string; open_token: string };

  // URL pubblica per la pagina apertura cliente
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://begift.app";
  const openUrl = `${baseUrl}/g/${row.open_token}`;

  return NextResponse.json({
    gift_id: row.id,
    open_token: row.open_token,
    open_url: openUrl,
  });
}
