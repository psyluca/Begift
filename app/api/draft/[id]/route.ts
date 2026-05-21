/**
 * GET / DELETE /api/draft/[id]
 *
 * GET: fetch del singolo gift_draft (con ownership check). Usato dalla
 *      pagina /draft/[id] client-rendered per caricare i dati del draft.
 *
 * DELETE: cancella una bozza che l'utente non vuole piu' personalizzare.
 *         Hard delete (riga rimossa dal DB). Ownership check obbligatorio.
 *         Non si puo' cancellare una bozza gia' completata (status=completed):
 *         in quel caso ritorniamo 409 con gift_id, l'utente puo' eliminare
 *         il regalo finale dalla dashboard.
 *
 * Auth: accetta Bearer (header Authorization) o cookie SSR. Pattern
 * gemello a /api/profile/me e /api/drafts.
 *
 * Response GET:
 *   200 OK -> { draft: GiftDraft }
 *   401 unauthorized
 *   404 not found / non e' tuo
 *   409 already_completed (con gift_id per redirect)
 *
 * Response DELETE:
 *   200 OK -> { deleted: true }
 *   401 unauthorized
 *   404 not found / non e' tuo
 *   409 already_completed (con gift_id)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (data.user) return data.user.id;
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: draft, error } = await admin
    .from("gift_drafts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("[api/draft/:id] error", error);
    return NextResponse.json(
      { error: "server", detail: error.message },
      { status: 500 }
    );
  }
  if (!draft) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (draft.user_id !== userId) {
    // Non rivelare l'esistenza del draft di altri utenti
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (draft.status === "completed") {
    return NextResponse.json(
      {
        error: "already_completed",
        gift_id: draft.gift_id,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ draft });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Fetch della riga per ownership check e per sapere se e' completata.
  const { data: draft, error: fetchErr } = await admin
    .from("gift_drafts")
    .select("id, user_id, status, gift_id")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[api/draft/:id DELETE] fetch error", fetchErr);
    return NextResponse.json(
      { error: "server", detail: fetchErr.message },
      { status: 500 }
    );
  }
  if (!draft) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (draft.user_id !== userId) {
    // Non rivelare l'esistenza del draft di altri utenti
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (draft.status === "completed") {
    return NextResponse.json(
      {
        error: "already_completed",
        gift_id: draft.gift_id,
        hint: "La bozza e' stata gia' completata. Per eliminare il regalo, vai sulla dashboard.",
      },
      { status: 409 }
    );
  }

  const { error: delErr } = await admin
    .from("gift_drafts")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId); // doppio safety: filtro user_id anche su delete

  if (delErr) {
    console.error("[api/draft/:id DELETE] error", delErr);
    return NextResponse.json(
      { error: "server", detail: delErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true });
}
