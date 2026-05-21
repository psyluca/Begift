/**
 * /draft/[id]
 *
 * Entry point per la pagina di completion bozza. Server thin che
 * renderizza DraftLoaderClient (client component) che fetcha il draft
 * via fetchAuthed (Bearer/cookies) e poi rende DraftCompletionClient.
 *
 * Storia: prima era server component con auth check via
 * createSupabaseServer (solo cookie). Per gli utenti con sessione
 * salvata in localStorage (Bearer) il check falliva sempre, redirect
 * a /auth/login anche se loggati. Fix 2026-05-16.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EMAIL_PARSER=true
 */

import { notFound } from "next/navigation";
import DraftLoaderClient from "./DraftLoaderClient";

export const dynamic = "force-dynamic";

export default function DraftPage({
  params,
}: {
  params: { id: string };
}) {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    notFound();
  }
  return <DraftLoaderClient draftId={params.id} />;
}
