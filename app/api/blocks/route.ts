/**
 * API user_blocks:
 *   GET    /api/blocks       — lista degli utenti bloccati dall'utente loggato
 *   POST   /api/blocks       — blocca un utente (body: { blocked_id })
 *   DELETE /api/blocks?id=X  — rimuove un blocco (ownership check)
 *
 * Il blocco è unidirezionale: A blocca B → A non vede gift/reazioni/
 * messaggi di B ma B può continuare a vedere i contenuti pubblici
 * di A (non gli basterebbe perché lato invio abbiamo il gate).
 *
 * Auth: Bearer token prima, cookie fallback.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  // Fetch blocks + profile info dei bloccati (username/email) per UI
  const { data: blocks } = await admin
    .from("user_blocks")
    .select("id, blocked_id, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (!blocks || blocks.length === 0) return NextResponse.json([]);

  const ids = blocks.map((b: { blocked_id: string }) => b.blocked_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, email")
    .in("id", ids);

  const profileMap = new Map<string, { username: string | null; email: string | null }>();
  (profiles ?? []).forEach((p: { id: string; username: string | null; email: string | null }) => {
    profileMap.set(p.id, { username: p.username, email: p.email });
  });

  const result = blocks.map((b: { id: string; blocked_id: string; created_at: string }) => ({
    id: b.id,
    blocked_id: b.blocked_id,
    created_at: b.created_at,
    username: profileMap.get(b.blocked_id)?.username ?? null,
    email: profileMap.get(b.blocked_id)?.email ?? null,
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json().catch(() => ({}));
  if (!blocked_id || typeof blocked_id !== "string") {
    return NextResponse.json({ error: "blocked_id required" }, { status: 400 });
  }
  if (blocked_id === userId) {
    return NextResponse.json({ error: "cannot block yourself" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("user_blocks")
    .insert({ blocker_id: userId, blocked_id })
    .select()
    .single();

  if (error) {
    // 23505 = unique violation (gia bloccato) → ritorna 200 idempotente
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("[blocks] insert error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("user_blocks")
    .delete()
    .eq("id", id)
    .eq("blocker_id", userId);

  if (error) {
    console.error("[blocks] delete error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
