import type { Metadata } from "next";
import LabClient from "./LabClient";

export const metadata: Metadata = {
  title: "BeGift Lab — Experience v2",
  description: "Sandbox interno per la nuova esperienza di apertura regalo",
  robots: { index: false, follow: false },
};

/**
 * /lab — Hidden sandbox route for the new gift-opening experience (v2).
 *
 * NOT linked from any navigation. Accessible only by typing the URL.
 * Blocked from search engines via `robots: noindex,nofollow`.
 *
 * See: components/experience/README.md
 */
export default function LabPage() {
  return <LabClient />;
}
