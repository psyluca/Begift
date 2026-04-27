/**
 * PATCH /api/profile/notifications
 *
 * Aggiorna le preferenze notifiche dell'utente loggato.
 * Body: { notify_gift_received?, notify_gift_opened?, notify_reaction? }
 * Solo i campi presenti vengono aggiornati (partial update).
 *
 * Auth: Bearer token primo, cookie fallback.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_KEYS = ["notify_gift_received", "notify_gift_opened", "notify_reaction", "notify_email"] as const;

export async function PATCH(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));

  // Costruisci l'oggetto update solo con i campi validi presenti nel body
  const update: Record<string, boolean> = {};
  for (const key of ALLOWED_KEYS) {
    if (typeof body?.[key] === "boolean") {
      update[key] = body[key];
    }
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  // Doppio update: prima i campi base (sempre presenti), poi quelli
  // della migration 017 in modo robusto. Cosi' se la 017 non e'
  // ancora stata eseguita su un ambiente, i toggle base continuano a
  // funzionare e notify_email viene semplicemente ignorato.
  const baseUpdate: Record<string, boolean> = {};
  let extraUpdate: Record<string, boolean> | null = null;
  for (const k of Object.keys(update) as (keyof typeof update)[]) {
    if (k === "notify_email") {
      extraUpdate = { ...(extraUpdate ?? {}), notify_email: update[k] };
    } else {
      baseUpdate[k] = update[k];
    }
  }

  let baseResult: Record<string, boolean> = {};
  if (Object.keys(baseUpdate).length > 0) {
    const { data, error } = await admin
      .from("profiles")
      .update(baseUpdate)
      .eq("id", userId)
      .select("notify_gift_received, notify_gift_opened, notify_reaction")
      .single();
    if (error) {
      console.error("[profile/notifications] base update error", error);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
    baseResult = data as Record<string, boolean>;
  }

  let extraResult: Record<string, boolean> = {};
  if (extraUpdate) {
    try {
      const { data, error } = await admin
        .from("profiles")
        .update(extraUpdate)
        .eq("id", userId)
        .select("notify_email")
        .single();
      if (!error && data) extraResult = data as Record<string, boolean>;
    } catch (e) {
      console.warn("[profile/notifications] notify_email skipped (migration 017?)", e);
    }
  }

  return NextResponse.json({ ok: true, ...baseResult, ...extraResult });
}
