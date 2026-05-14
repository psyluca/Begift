/**
 * /draft/[id]
 *
 * Pagina di completion per gift_drafts pre-popolati dal parser email.
 * L'utente vede il pacco gia' 80% pronto e aggiunge il messaggio
 * emozionale prima di inviarlo come gift vero.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EMAIL_PARSER=true
 *
 * POC: rendering minimale, no styling avanzato. Quando confermeremo
 * il pattern, sostituiremo con il design system BeGift standard.
 */

import { notFound, redirect } from "next/navigation";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import DraftCompletionClient from "./DraftCompletionClient";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  params,
}: {
  params: { id: string };
}) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    notFound();
  }

  // Auth check
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/auth/login?next=/draft/${params.id}`);
  }

  // Fetch draft via service_role (bypassa RLS per consistency, poi verifica ownership)
  const admin = createSupabaseAdmin();
  const { data: draft, error } = await admin
    .from("gift_drafts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !draft) notFound();
  if (draft.user_id !== userData.user.id) notFound();
  if (draft.status === "completed") {
    // Gia' completato, redirect al gift creato
    if (draft.gift_id) redirect(`/gift/${draft.gift_id}/manage`);
    notFound();
  }

  return (
    <DraftCompletionClient
      draftId={draft.id}
      status={draft.status}
      detectedMerchant={draft.detected_merchant}
      parsedContent={draft.parsed_content}
      sourceEmailFrom={draft.source_email_from}
      sourceEmailSubject={draft.source_email_subject}
      parserConfidence={draft.parser_confidence}
    />
  );
}
