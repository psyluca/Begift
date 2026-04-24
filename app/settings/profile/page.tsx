/**
 * /settings/profile
 *
 * Pagina per modificare lo username univoco dopo l'onboarding.
 * Stesso flusso di validazione real-time del modal di onboarding,
 * ma qui e' opzionale (l'utente ha gia' un handle).
 *
 * NON fa gate server-side sulla sessione: la sessione degli utenti
 * che hanno fatto login via Google OAuth (flowType: implicit) vive
 * solo in localStorage, non nei cookie SSR. Un server-side
 * auth.getUser() su quegli utenti fallisce e un redirect a
 * /auth/login li butta fuori anche se in realta' sono loggati.
 * Il client SettingsProfileClient chiama /api/profile/me con
 * fetchAuthed (che legge il token da localStorage) e gestisce
 * autonomamente lo stato non-loggato.
 *
 * Bug fix: 2026-04-24 — gli utenti Google OAuth venivano sbattuti
 * fuori cliccando "Cambia nome utente".
 */

import SettingsProfileClient from "./SettingsProfileClient";

export const dynamic = "force-dynamic";

export default function SettingsProfilePage() {
  return <SettingsProfileClient />;
}
