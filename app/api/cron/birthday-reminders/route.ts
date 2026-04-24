/**
 * GET /api/cron/birthday-reminders
 *
 * Triggered giornalmente da Vercel Cron (vedi vercel.json) alle 9:00 UTC.
 * Per ogni reminder il cui target_date = oggi + notify_days_before,
 * manda una push all'owner con CTA a /create?recipient={name}&occasion={type}
 *
 * Protezione: verifica header Authorization: Bearer <CRON_SECRET>.
 * Vercel Cron imposta automaticamente questo header con il valore
 * di CRON_SECRET env var se configurata. Senza CRON_SECRET settata,
 * l'endpoint è pubblico — accettabile ma sconsigliato (chiunque
 * potrebbe forzare l'invio delle reminder).
 *
 * Logica anti-duplicato: usiamo last_notified_at per garantire che
 * NON si mandino 2 push la stessa giornata anche se il cron viene
 * triggerato più volte o se la schedulazione cambia in corsa.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webPush";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Security check
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const admin = createSupabaseAdmin();
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Fetch TUTTE le reminders (nel mondo reale qui filtriamo per
  // month/day rapidamente con un index — per ora BeGift ha pochi
  // utenti, full scan accettabile). Per scalare: precalcolare
  // next_occurrence_date e filtrare server-side.
  const { data: reminders, error } = await admin
    .from("reminders")
    .select("id, user_id, recipient_name, month, day, year, occasion_type, notify_days_before, last_notified_at");

  if (error) {
    console.error("[cron/birthday] fetch error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  const processed: { id: string; result: string }[] = [];

  for (const r of reminders ?? []) {
    const reminder = r as {
      id: string;
      user_id: string;
      recipient_name: string;
      month: number;
      day: number;
      year: number | null;
      occasion_type: string;
      notify_days_before: number;
      last_notified_at: string | null;
    };

    // Calcola target_date = prossima occorrenza della ricorrenza
    // nell'anno corrente (se già passata, prossima è l'anno dopo)
    const currentYear = now.getFullYear();
    let target = new Date(currentYear, reminder.month - 1, reminder.day);
    if (target < now && (target.getMonth() !== now.getMonth() || target.getDate() !== now.getDate())) {
      target = new Date(currentYear + 1, reminder.month - 1, reminder.day);
    }

    // target - notify_days_before = data in cui dobbiamo mandare la push
    const notifyDate = new Date(target);
    notifyDate.setDate(notifyDate.getDate() - reminder.notify_days_before);
    const notifyIso = notifyDate.toISOString().slice(0, 10);

    // Oggi è il giorno di notifica?
    if (notifyIso !== todayIso) {
      processed.push({ id: reminder.id, result: "skip_not_today" });
      continue;
    }

    // Dedupe: già notificata oggi?
    if (reminder.last_notified_at) {
      const lastIso = reminder.last_notified_at.slice(0, 10);
      if (lastIso === todayIso) {
        processed.push({ id: reminder.id, result: "skip_already_notified" });
        continue;
      }
    }

    // Costruisci payload push
    const daysWord = reminder.notify_days_before === 0
      ? "oggi"
      : reminder.notify_days_before === 1
      ? "domani"
      : `tra ${reminder.notify_days_before} giorni`;

    const occasionLabel = (() => {
      switch (reminder.occasion_type) {
        case "anniversary": return "l'anniversario";
        case "name_day":    return "l'onomastico";
        case "graduation":  return "la laurea";
        case "other":       return "una ricorrenza";
        default:            return "il compleanno";
      }
    })();

    const title = `🎁 ${daysWord.charAt(0).toUpperCase() + daysWord.slice(1)} è ${occasionLabel} di ${reminder.recipient_name}`;
    const body = `Vuoi prepararle un regalo su BeGift? Apri il creatore con tutto già pre-compilato.`;

    const createUrl = `/create?recipient=${encodeURIComponent(reminder.recipient_name)}&occasion=${encodeURIComponent(reminder.occasion_type)}`;

    try {
      const result = await sendPushToUser(reminder.user_id, {
        title,
        body,
        url: createUrl,
        tag: `begift-reminder-${reminder.id}-${target.getFullYear()}`,
      });
      // Aggiorna last_notified_at
      await admin
        .from("reminders")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", reminder.id);
      // Analytics server-side: Plausible accetta pageview fake dal
      // server se forniamo User-Agent e X-Forwarded-For. Non lo
      // facciamo qui per semplicita': l'evento reminder_fired
      // verra' incrementato solo quando l'utente clicca sulla push
      // e atterra in /create?recipient=..., dove tracciamo il deep
      // link nell'istanza client (vedi CreateGiftClient).
      processed.push({
        id: reminder.id,
        result: `sent (${result.sent}/${result.sent + result.failed} endpoints)`,
      });
    } catch (e) {
      console.error("[cron/birthday] send failed", reminder.id, e);
      processed.push({ id: reminder.id, result: "error" });
    }
  }

  return NextResponse.json({
    date: todayIso,
    total: reminders?.length ?? 0,
    processed,
  });
}
