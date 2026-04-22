/**
 * GET /api/profile/me
 *
 * Ritorna il profilo dell'utente loggato. Usato dal client per
 * sapere se ha già uno username (e quindi se deve mostrare il
 * modal di onboarding), e per mostrare handle/display_name
 * nella TopBar.
 *
 * Response:
 *   200 { id, email, username, display_name, avatar_url }
 *   401 { error: "unauthorized" }
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) userId = data.user.id;
  }
  if (!userId) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) userId = data.user.id;
  }
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, username, display_name, avatar_url, notify_gift_received, notify_gift_opened, notify_reaction")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[profile/me] error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // is_admin: flag calcolato server-side comparando l'email con
  // ADMIN_EMAILS env var. Lo restituiamo nel response così il client
  // (TopBar) può mostrare/nascondere pulsanti admin senza dover
  // fetchare endpoint dedicati. La lista completa resta server-only.
  return NextResponse.json({
    ...data,
    is_admin: isAdminEmail(data?.email),
  });
}
