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
import { sendWelcomeEmail } from "@/lib/email";
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
  // Select base: colonne che esistono dalla migration 008 in poi.
  // Le colonne nuove della migration 017 (notify_email,
  // welcome_email_sent_at) sono lette in una query separata robusta
  // sotto, cosi' il /me non si rompe se la migration non e' ancora
  // stata eseguita su un ambiente.
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, username, display_name, avatar_url, notify_gift_received, notify_gift_opened, notify_reaction")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[profile/me] error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // Welcome email: best-effort. Tenta di leggere la colonna
  // welcome_email_sent_at; se la migration 017 non c'e', skip silente.
  // Lock atomico via UPDATE ... IS NULL: se 0 righe aggiornate, un'altra
  // chiamata concorrente ha gia' preso lo slot e non inviamo doppio.
  let welcomeFlags: { welcome_email_sent_at: string | null; notify_email: boolean } | null = null;
  try {
    const { data: extra, error: extraErr } = await admin
      .from("profiles")
      .select("welcome_email_sent_at, notify_email")
      .eq("id", userId)
      .single();
    if (!extraErr && extra) {
      welcomeFlags = extra as { welcome_email_sent_at: string | null; notify_email: boolean };
    }
  } catch { /* migration 017 non eseguita: skip */ }

  if (welcomeFlags && welcomeFlags.welcome_email_sent_at == null && data?.email && welcomeFlags.notify_email) {
    try {
      const { data: claimed } = await admin
        .from("profiles")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", userId)
        .is("welcome_email_sent_at", null)
        .select("id")
        .maybeSingle();
      if (claimed) {
        // Fire-and-forget: non blocca GET /me.
        sendWelcomeEmail(userId, {
          name: data.display_name || data.username || undefined,
        }).catch((e) => console.error("[profile/me] welcome email failed", e));
      }
    } catch (e) {
      console.warn("[profile/me] welcome lock skipped", e);
    }
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
