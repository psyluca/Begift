import SettingsRemindersClient from "./SettingsRemindersClient";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsRemindersPage() {
  const sb = createSupabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) {
    redirect("/auth/login?next=/settings/reminders");
  }
  return <SettingsRemindersClient />;
}
