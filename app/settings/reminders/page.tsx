/**
 * /settings/reminders
 *
 * Nessun gate server-side: il cookie-based auth di createSupabaseServer
 * è flaky su PWA iOS (abbiamo visto il bug in più punti, tra cui qui
 * — Luca veniva redirectato a /auth/login anche se loggato). Il client
 * chiama /api/reminders con fetchAuthed (Bearer dal localStorage),
 * che è affidabile. Se non loggato, la prima GET ritorna 401 e
 * SettingsRemindersClient mostra un messaggio.
 */

import SettingsRemindersClient from "./SettingsRemindersClient";

export const dynamic = "force-dynamic";

export default function SettingsRemindersPage() {
  return <SettingsRemindersClient />;
}
