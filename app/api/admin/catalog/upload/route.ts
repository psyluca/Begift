/**
 * /api/admin/catalog/upload
 *
 * POST multipart/form-data con campo "file" = CSV del catalogo manuale.
 *
 * Colonne attese nel CSV (header case-insensitive, ordine libero):
 *
 *   Obbligatorie:
 *     - title             titolo dell'esperienza
 *     - category          food|outdoor|culture|wellness|travel|gear|music|show|sport
 *     - partner_slug      'getyourguide' o 'awin' (o uno slug futuro)
 *     - external_url      URL pagina partner (la usiamo come "tracking template"
 *                         + fallback se affiliate_url_template e' vuoto)
 *
 *   Opzionali:
 *     - external_id       ID univoco. Se vuoto: generato da slug(partner + title)
 *     - description
 *     - image_url
 *     - price_min_eur     numero intero (es. 45). Verra' convertito *100 in cents.
 *     - price_max_eur
 *     - city
 *     - country           default IT
 *     - duration_minutes
 *     - tags              separati da virgola interno (es. "couples,romantic,must-see")
 *                         IMPORTANTE: se la riga ha virgole, racchiudere il campo tra "..."
 *     - rating            decimale 0-5
 *     - reviews_count     intero
 *     - affiliate_url_template
 *                         opzionale; se vuoto usiamo external_url come template
 *                         (sostituiamo {gift_id} runtime)
 *     - active            true/false, default true
 *
 * Output:
 *   { stats: { fetched, inserted, updated, skipped, errors, duration_ms },
 *     errors: [ {row, message}, ... up to 20 ] }
 *
 * Auth: admin user (whitelist ADMIN_EMAILS) come per /api/admin/catalog/runs.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { parseCsv } from "@/lib/catalog/csv_parser";
import type {
  ExperienceCategory,
  ExperienceTag,
} from "@/types/experiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VALID_CATEGORIES: ExperienceCategory[] = [
  "food",
  "outdoor",
  "culture",
  "wellness",
  "travel",
  "gear",
  "music",
  "show",
  "sport",
];

const VALID_TAGS: ExperienceTag[] = [
  "couples",
  "family",
  "friends",
  "solo",
  "romantic",
  "date-night",
  "adventure",
  "relax",
  "foodie",
  "wine",
  "art",
  "history",
  "music",
  "hiking",
  "sea",
  "mountains",
  "photography",
  "must-see",
  "hands-on",
  "flexible",
  "voucher",
  "half-day",
  "full-day",
  "multi-day",
  "summer",
  "winter",
  "all-season",
  "international",
  "local",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parsePriceCents(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function parseBool(raw: string, defaultVal: boolean): boolean {
  if (!raw) return defaultVal;
  const lower = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y", "si", "sì"].includes(lower)) return true;
  if (["false", "0", "no", "n"].includes(lower)) return false;
  return defaultVal;
}

async function requireAdmin(req: NextRequest) {
  let email: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data } = await admin.auth.getUser(token);
    if (data.user) email = data.user.email ?? null;
  }
  if (!email) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  if (!isAdminEmail(email)) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, email: email! };
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_CATALOG_IMPORT !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  // Estrai file
  let csvContent: string;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "missing_file", hint: "Form field 'file' required" },
        { status: 400 }
      );
    }
    csvContent = await (file as File).text();
  } catch (e) {
    return NextResponse.json(
      { error: "form_parse_failed", message: (e as Error).message },
      { status: 400 }
    );
  }

  const rows = parseCsv(csvContent);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "empty_csv", hint: "Il CSV non contiene righe oltre l'header" },
      { status: 400 }
    );
  }

  const startTs = Date.now();
  const admin = createSupabaseAdmin();

  // Cache partner_id by slug
  const { data: partners } = await admin
    .from("experience_partners")
    .select("id, slug");
  const partnerBySlug = new Map<string, string>(
    (partners || []).map((p) => [p.slug as string, p.id as string])
  );

  const stats = {
    fetched: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duration_ms: 0,
  };
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const rowNum = i + 2; // 1-based, +1 per header
    try {
      const title = r.title?.trim();
      if (!title) {
        stats.skipped += 1;
        errors.push({ row: rowNum, message: "title vuoto" });
        continue;
      }

      const category = (r.category || "").trim().toLowerCase() as ExperienceCategory;
      if (!VALID_CATEGORIES.includes(category)) {
        stats.errors += 1;
        errors.push({
          row: rowNum,
          message: `category invalida: '${r.category}' (valide: ${VALID_CATEGORIES.join(", ")})`,
        });
        continue;
      }

      const partnerSlug = (r.partner_slug || "").trim().toLowerCase();
      if (!partnerSlug) {
        stats.errors += 1;
        errors.push({ row: rowNum, message: "partner_slug vuoto" });
        continue;
      }
      const partnerId = partnerBySlug.get(partnerSlug);
      if (!partnerId) {
        stats.errors += 1;
        errors.push({
          row: rowNum,
          message: `partner_slug sconosciuto: '${partnerSlug}' (valid: ${Array.from(partnerBySlug.keys()).join(", ")})`,
        });
        continue;
      }

      const externalId =
        r.external_id?.trim() || `manual-${partnerSlug}-${slugify(title)}`;
      const externalUrl = r.external_url?.trim() || null;
      const description = r.description?.trim() || null;
      const imageUrl = r.image_url?.trim() || null;
      const priceMinCents = parsePriceCents(r.price_min_eur || r.price_min || "");
      const priceMaxCents = parsePriceCents(r.price_max_eur || r.price_max || "");
      const city = r.city?.trim() || null;
      const country = (r.country || "IT").trim().toUpperCase().slice(0, 2);
      const duration =
        r.duration_minutes && /^\d+$/.test(r.duration_minutes)
          ? parseInt(r.duration_minutes, 10)
          : null;

      // Tags: stringa separata da virgola interno (CSV gestisce il quoting)
      // OPPURE separato da pipe | per sicurezza se non sappiamo se Numbers
      // ha esportato correttamente le virgole interne. Supportiamo entrambi.
      const rawTags = (r.tags || "")
        .split(/[,|]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean) as ExperienceTag[];
      const tags = rawTags.filter((t) => VALID_TAGS.includes(t));

      const rating =
        r.rating && /^-?\d+([.,]\d+)?$/.test(r.rating)
          ? parseFloat(r.rating.replace(",", "."))
          : null;
      const reviewsCount =
        r.reviews_count && /^\d+$/.test(r.reviews_count)
          ? parseInt(r.reviews_count, 10)
          : 0;

      // affiliate_url_template: priorita' a colonna esplicita, fallback a external_url.
      // experiences.affiliate_url_template e' NOT NULL: usiamo external_url o
      // un placeholder safe se entrambi mancano.
      const affiliateTemplate =
        r.affiliate_url_template?.trim() ||
        externalUrl ||
        `https://example.com/{gift_id}`;

      const active = parseBool(r.active || "", true);

      const importHash = crypto
        .createHash("sha256")
        .update(
          [title, String(priceMinCents ?? ""), city || "", imageUrl || ""].join("|")
        )
        .digest("hex");

      // Upsert: lookup per external_id
      const { data: existing } = await admin
        .from("experiences")
        .select("id, source")
        .eq("external_id", externalId)
        .maybeSingle();

      const payload = {
        partner_id: partnerId,
        external_id: externalId,
        external_url: externalUrl,
        title,
        description,
        image_url: imageUrl,
        city,
        country,
        category,
        tags,
        price_min_cents: priceMinCents,
        price_max_cents: priceMaxCents,
        currency: "EUR",
        duration_minutes: duration,
        rating,
        reviews_count: reviewsCount,
        affiliate_url_template: affiliateTemplate,
        source: "manual",
        import_hash: importHash,
        last_synced_at: new Date().toISOString(),
        active,
      };

      if (existing) {
        const { error: updErr } = await admin
          .from("experiences")
          .update(payload)
          .eq("id", existing.id);
        if (updErr) {
          stats.errors += 1;
          errors.push({ row: rowNum, message: `update: ${updErr.message}` });
        } else {
          stats.updated += 1;
        }
      } else {
        const { error: insErr } = await admin.from("experiences").insert(payload);
        if (insErr) {
          stats.errors += 1;
          errors.push({ row: rowNum, message: `insert: ${insErr.message}` });
        } else {
          stats.inserted += 1;
        }
      }
    } catch (e) {
      stats.errors += 1;
      errors.push({ row: rowNum, message: (e as Error).message });
    }
  }

  stats.duration_ms = Date.now() - startTs;

  // Audit row
  try {
    await admin.from("catalog_sync_runs").insert({
      source: "manual_upload",
      trigger: "manual",
      status: stats.errors === 0 ? "success" : "partial",
      finished_at: new Date().toISOString(),
      fetched: stats.fetched,
      filtered: stats.fetched,
      inserted: stats.inserted,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
      duration_ms: stats.duration_ms,
      notes: {
        filename: "csv_upload",
        first_errors: errors.slice(0, 20),
      },
    });
  } catch {
    // best-effort, l'audit fallisce ma l'upload e' andato
  }

  return NextResponse.json({ stats, errors: errors.slice(0, 20) }, { status: 200 });
}
