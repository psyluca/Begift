import type { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notifiche — BeGift",
  alternates: { canonical: "/notifiche" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NotifichePage() {
  return <NotificationsClient />;
}
