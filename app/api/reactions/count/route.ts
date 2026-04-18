export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const since = req.nextUrl.searchParams.get("since") ?? "1970-01-01";

  const { count } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .gt("created_at", since);

  return NextResponse.json({ count: count ?? 0 });
}
