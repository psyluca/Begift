/**
 * GET /api/g/[token]
 *
 * Endpoint pubblico (no auth) per la pagina apertura cliente. Restituisce
 * i dati necessari a renderizzare il pacco business: messaggio,
 * packaging, coupon (titolo + validita' + URL file), brand della
 * massaggiatrice (nome attivita').
 *
 * NON espone: creator_id, business_account_id, dati interni dell'account
 * business o dell'utente.
 *
 * Side effect: setta opened_at al primo GET (se ancora NULL).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  if (!token || token.length < 10 || token.length > 32) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: giftRaw, error } = await admin
    .from("gifts")
    .select(
      "id, recipient_name, message, packaging, coupon_file_url, " +
        "template_data, business_account_id, opened_at, created_at, " +
        "is_business_gift"
    )
    .eq("open_token", token)
    .eq("is_business_gift", true)
    .maybeSingle();

  if (error) {
    console.error("[api/g GET] db error", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  if (!giftRaw) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const gift = giftRaw as unknown as {
    id: string;
    recipient_name: string;
    message: string | null;
    packaging: unknown;
    coupon_file_url: string | null;
    template_data: { coupon_title?: string | null; coupon_validity?: string | null } | null;
    business_account_id: string | null;
    opened_at: string | null;
    created_at: string;
    is_business_gift: boolean;
  };

  // Fetch brand del business (nome attivita', logo, accent color)
  const { data: businessRaw } = gift.business_account_id
    ? await admin
        .from("business_accounts")
        .select("business_name, logo_url, brand_color")
        .eq("id", gift.business_account_id)
        .maybeSingle()
    : { data: null };
  const business = businessRaw as unknown as {
    business_name: string;
    logo_url: string | null;
    brand_color: string | null;
  } | null;

  // Side effect: set opened_at al primo GET (mantiene reactions sender side)
  if (!gift.opened_at) {
    void admin
      .from("gifts")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", gift.id)
      .then(({ error: updateErr }) => {
        if (updateErr) {
          console.warn(
            "[api/g GET] failed to set opened_at",
            updateErr.message
          );
        }
      });
  }

  const td = gift.template_data || {};

  return NextResponse.json({
    recipient_name: gift.recipient_name,
    message: gift.message,
    packaging: gift.packaging,
    coupon: {
      title: td.coupon_title || null,
      validity: td.coupon_validity || null,
      file_url: gift.coupon_file_url,
    },
    business: business
      ? {
          name: business.business_name,
          logo_url: business.logo_url || null,
          brand_color: business.brand_color || null,
        }
      : null,
    opened_at: gift.opened_at,
    created_at: gift.created_at,
  });
}
