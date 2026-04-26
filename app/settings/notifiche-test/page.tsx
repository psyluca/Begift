import type { Metadata } from "next";
import NotificheTestClient from "./NotificheTestClient";

export const metadata: Metadata = {
  title: "Test notifiche — BeGift",
  alternates: { canonical: "/settings/notifiche-test" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NotificheTestPage() {
  return <NotificheTestClient />;
}
