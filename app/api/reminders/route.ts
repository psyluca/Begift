/**
 * API ricorrenze (reminders):
 *  GET    /api/reminders       — lista ricorrenze dell'utente
 *  POST   /api/reminders       — crea nuova ricorrenza
 *  DELETE /api/reminders?id=X  — cancella (verifica ownership)
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
  const { data, error } = await admin
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: true })
    .order("day", { ascending: true });

  if (error) {
    console.error("[reminders] list error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const recipientName: string = String(body?.recipient_name ?? "").trim();
  const month = Number(body?.month);
  const day = Number(body?.day);
  const year = body?.year ? Number(body.year) : null;
  const occasionType: string = String(body?.occasion_type ?? "birthday");
  const notifyDaysBefore = body?.notify_days_before != null ? Number(body.notify_days_before) : 3;

  // Validazione
  if (!recipientName) {
    return NextResponse.json({ error: "recipient_name required" }, { status: 400 });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return NextResponse.json({ error: "invalid day" }, { status: 400 });
  }
  if (!["birthday", "anniversary", "name_day", "graduation", "other"].includes(occasionType)) {
    return NextResponse.json({ error: "invalid occasion_type" }, { status: 400 });
  }
  if (!Number.isInteger(notifyDaysBefore) || notifyDaysBefore < 0 || notifyDaysBefore > 30) {
    return NextResponse.json({ error: "invalid notify_days_before" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("reminders")
    .insert({
      user_id: userId,
      recipient_name: recipientName,
      month,
      day,
      year,
      occasion_type: occasionType,
      notify_days_before: notifyDaysBefore,
    })
    .select()
    .single();

  if (error) {
    console.error("[reminders] insert error", error);
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
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // ownership check

  if (error) {
    console.error("[reminders] delete error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
