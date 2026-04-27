/**
 * /settings/reminders → REDIRECT a /ricorrenze
 *
 * La pagina e' stata promossa al primo livello con la sua propria
 * voce nella bottom nav (vedi components/BottomNav.tsx). Il vecchio
 * URL resta funzionante via redirect server-side per non rompere
 * eventuali bookmark, link condivisi, o riferimenti negli screenshot
 * della community.
 */

import { redirect } from "next/navigation";

export default function SettingsRemindersRedirect() {
  redirect("/ricorrenze");
}
