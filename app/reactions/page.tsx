import { createSupabaseServer } from "@/lib/supabase/server";
import ReactionsClient from "./ReactionsClient";

export const dynamic = "force-dynamic";

export default async function ReactionsPage() {
  const supabase = createSupabaseServer();

  const { data: reactions } = await supabase
    .from("reactions")
    .select("*, gifts(recipient_name, id)")
    .order("created_at", { ascending: false });

  return <ReactionsClient initialReactions={reactions ?? []} />;
}
