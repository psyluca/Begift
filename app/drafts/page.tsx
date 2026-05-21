/**
 * /drafts
 *
 * Entry point della lista bozze. Server thin che renderizza il
 * client component. L'auth check e' fatto client-side via
 * fetchAuthed (Bearer da localStorage), allineato al pattern
 * di /settings.
 *
 * Storia: prima questa pagina era server component con check
 * server-side via createSupabaseServer. Problema: gli utenti che
 * hanno sessione solo via localStorage (Bearer) e non via cookie
 * venivano sempre redirezionati a /auth/login. Fix 2026-05-16.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EMAIL_PARSER
 */

import { notFound } from "next/navigation";
import DraftsClient from "./DraftsClient";

export const dynamic = "force-dynamic";

export default function DraftsPage() {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    notFound();
  }
  return <DraftsClient />;
}
