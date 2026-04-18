import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServer();
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(5);

  return NextResponse.json(data ?? []);
}
