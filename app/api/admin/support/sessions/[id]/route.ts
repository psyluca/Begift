/**
 * GET /api/admin/support/sessions/[id]
 *
 * Ritorna la cronologia completa di una singola sessione concierge,
 * ordinata cronologicamente (oldest → newest).
 *
 * Auth: admin user (whitelist ADMIN_EMAILS).
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
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) email = data.user.email ?? null;
  }
  if (!email) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  return isAdminEmail(email);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { data: turns, error } = await admin
    .from("support_chats")
    .select("id, role, content, metadata, escalated, created_at, user_id")
    .eq("session_id", params.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    session_id: params.id,
    turns: turns || [],
  });
}
