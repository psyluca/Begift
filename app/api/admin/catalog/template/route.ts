/**
 * GET /api/admin/catalog/template
 *
 * Restituisce un CSV con header + 2 righe d'esempio (1 GYG, 1 VVT) +
 * commenti inline su ogni colonna. Pensato per essere scaricato da
 * /admin/catalog → "Scarica template" → aperto in Numbers/Excel/Sheets,
 * compilato con N righe, riesportato come CSV e ricaricato.
 *
 * Auth: admin user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest): Promise<boolean> {
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
  return isAdminEmail(email);
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const lines: string[] = [];
  // Header
  lines.push(
    [
      "external_id",
      "partner_slug",
      "title",
      "description",
      "image_url",
      "price_min_eur",
      "price_max_eur",
      "city",
      "country",
      "category",
      "duration_minutes",
      "tags",
      "external_url",
      "affiliate_url_template",
      "rating",
      "reviews_count",
      "active",
    ].join(",")
  );

  // Esempio GYG
  lines.push(
    [
      "manual-getyourguide-colosseo-tour-guidato",
      "getyourguide",
      "Colosseo: tour guidato con accesso prioritario",
      "Visita il Colosseo con guida esperta in italiano. Skip-the-line ingresso prioritario.",
      "https://cdn.getyourguide.com/img/tour/colosseum-guided.jpg",
      "45",
      "",
      "Roma",
      "IT",
      "culture",
      "120",
      `"couples,must-see,art,history"`,
      "https://www.getyourguide.com/rome-l33/colosseum-skip-the-line-t1234/",
      "",
      "4.7",
      "12450",
      "true",
    ].join(",")
  );

  // Esempio VVT
  lines.push(
    [
      "vt-vasco-live-2026-stadio-milano",
      "awin",
      "Vasco Live 2026 — Stadio San Siro Milano",
      "Concerto Vasco Rossi allo Stadio Meazza di Milano, tour estivo 2026.",
      "https://www.vivaticket.com/it/images/vasco-2026.jpg",
      "65",
      "150",
      "Milano",
      "IT",
      "music",
      "180",
      `"music,must-see,friends,summer"`,
      "https://www.vivaticket.com/it/ticket/vasco-live-2026/270804",
      "",
      "",
      "",
      "true",
    ].join(",")
  );

  // Commenti finali
  lines.push("");
  lines.push("# COME COMPILARE:");
  lines.push("# - partner_slug: 'getyourguide' per esperienze/tour | 'awin' per biglietti VivaTicket");
  lines.push("# - category: food | outdoor | culture | wellness | travel | gear | music | show | sport");
  lines.push("# - tags: lista separata da virgola DENTRO le virgolette (es. \"couples,must-see\")");
  lines.push("# - country: codice ISO 2 lettere (IT, FR, ES...)");
  lines.push("# - external_id: lasciare vuoto per auto-generare da titolo (raccomandato)");
  lines.push("# - affiliate_url_template: lasciare vuoto se uguale a external_url");
  lines.push("# - active: true (default) | false (nascosta dal catalogo)");
  lines.push("# - Cancellare queste righe '#' prima dell'upload se Numbers non le esporta");

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="begift_catalog_template.csv"',
    },
  });
}
