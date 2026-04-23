/**
 * GET /api/admin/reports       — lista segnalazioni (admin only)
 * PATCH /api/admin/reports     — aggiorna status (admin only)
 *
 * Auth: Bearer o cookie, admin check via isAdminEmail.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

async function resolveAdminEmail(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data } = await admin.auth.getUser(token);
    if (data.user?.email) return data.user.email;
  }
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function GET(req: NextRequest) {
  const email = await resolveAdminEmail(req);
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const statusFilter = req.nextUrl.searchParams.get("status");
  const admin = createSupabaseAdmin();
  let query = admin
    .from("reports")
    .select("*, gifts(id, recipient_name, sender_alias, content_type, creator_id, created_at)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter) query = query.eq("status", statusFilter);
  const { data, error } = await query;

  if (error) {
    console.error("[admin/reports] list error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const email = await resolveAdminEmail(req);
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body?.id;
  const status: string | undefined = body?.status;
  const adminNotes: string | undefined = body?.admin_notes;
  const deleteGift: boolean = body?.delete_gift === true;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (status && !["pending", "reviewing", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  // Resolve reviewer id
  let reviewerId: string | null = null;
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    reviewerId = data.user?.id ?? null;
  } catch { /* ignore */ }

  const admin = createSupabaseAdmin();

  // Opzionale: delete del gift correlato se azione è "resolved"
  // con delete_gift=true
  if (deleteGift) {
    const { data: report } = await admin
      .from("reports")
      .select("gift_id")
      .eq("id", id)
      .single();
    const giftId = (report as { gift_id?: string } | null)?.gift_id;
    if (giftId) {
      await admin.from("gifts").delete().eq("id", giftId);
    }
  }

  const update: Record<string, string | null> = {};
  if (status) {
    update.status = status;
    update.reviewed_at = new Date().toISOString();
    if (reviewerId) update.reviewer_id = reviewerId;
  }
  if (adminNotes !== undefined) update.admin_notes = adminNotes || null;

  const { error } = await admin.from("reports").update(update).eq("id", id);
  if (error) {
    console.error("[admin/reports] patch error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
