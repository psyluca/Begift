"use client";

/**
 * Wrapper sottile su ParentLetterCreateClient configurato per Festa
 * della Mamma. Mantenuto come file separato per coerenza nominale
 * con la rotta /festa-mamma/crea.
 */

import { ParentLetterCreateClient } from "@/components/ParentLetterCreateClient";
import { MOTHER_TEMPLATE } from "@/lib/parent-templates";

export default function FestaMammaCreateClient() {
  return <ParentLetterCreateClient config={MOTHER_TEMPLATE} />;
}
