/**
 * POST /api/business/upload-coupon
 *
 * Upload del file coupon (PDF/immagine) nel bucket business-coupons.
 * Path: <business_account_id>/<timestamp>-<random>.<ext>
 *
 * Body: multipart/form-data con campo "file"
 * Risposta: { url: signed URL valida ~1 anno }
 *
 * Max file size: 10MB (enforce-ato anche lato Storage).
 * Mime accettati: application/pdf, image/png, image/jpeg, image/webp
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusinessForRequest } from "@/lib/business/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/featureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_BYTES = 10 * 1024 * 1024;
// Validita signed URL: 1 anno (in secondi). I coupon hanno validita'
// dichiarata dalla cliente (es. 6 mesi), il signed URL deve durare
// almeno quanto la validita' del coupon stesso. 1 anno copre la
// maggior parte dei casi. Quando scade, refresh via /api/g/[token].
const SIGNED_URL_TTL_S = 365 * 24 * 3600;

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled("FEATURE_BUSINESS_DASHBOARD")) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const session = await getBusinessForRequest(req);
  if (!session) {
    return NextResponse.json({ error: "no_business_account" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json(
      { error: "unsupported_mime", detail: `mime '${file.type}' not allowed` },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", detail: "max 10MB" },
      { status: 400 }
    );
  }

  // Path: <business_id>/<timestamp>-<random>.<ext>
  const ext = guessExtension(file.type, file.name);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${session.business.id}/${ts}-${rand}${ext}`;

  const admin = createSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("business-coupons")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error("[business/upload-coupon]", uploadErr.message);
    return NextResponse.json(
      { error: "upload_failed", detail: uploadErr.message },
      { status: 500 }
    );
  }

  // Genera signed URL pubblica (bucket e' private)
  const { data: signedData, error: signedErr } = await admin.storage
    .from("business-coupons")
    .createSignedUrl(path, SIGNED_URL_TTL_S);

  if (signedErr || !signedData) {
    return NextResponse.json(
      { error: "sign_url_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signedData.signedUrl,
    path,
    mime: file.type,
    size: file.size,
  });
}

function guessExtension(mime: string, filename: string): string {
  // Preferiamo l'ext del filename se valida; fallback su mime
  const m = filename.match(/\.[a-zA-Z0-9]+$/);
  if (m) return m[0].toLowerCase();
  switch (mime) {
    case "application/pdf":
      return ".pdf";
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return ".bin";
  }
}
