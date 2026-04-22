/**
 * /settings/profile
 *
 * Pagina per modificare lo username univoco dopo l'onboarding.
 * Stesso flusso di validazione real-time del modal di onboarding,
 * ma qui è opzionale (l'utente ha già un handle).
 *
 * Se l'utente non è loggato → redirect /auth/login
 * Se l'utente è loggato ma non ha ancora handle → il modal globale
 * di onboarding scatta comunque e prende il sopravvento.
 */

import SettingsProfileClient from "./SettingsProfileClient";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsProfilePage() {
  const sb = createSupabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) {
    redirect("/auth/login?next=/settings/profile");
  }
  return <SettingsProfileClient />;
}
