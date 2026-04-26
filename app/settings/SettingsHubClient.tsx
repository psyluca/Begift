"use client";

/**
 * SettingsHubClient — pagina unica con tutte le impostazioni utente.
 * Progettata per sostituire /settings/profile e /settings/reminders
 * (che ora redirectano qui con scroll all'anchor relativa).
 *
 * Struttura a sezioni card. Ogni sezione è autonoma (può ricaricarsi)
 * e usa fetchAuthed per robust auth.
 */

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchAuthed } from "@/lib/clientAuth";
import { useAuth } from "@/hooks/useAuth";
import LangSwitcher from "@/components/LangSwitcher";
import Link from "next/link";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e8e4de";
const OK_GREEN = "#3B8C5A";
const ERR_RED = "#B71C1C";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  notify_gift_received: boolean;
  notify_gift_opened: boolean;
  notify_reaction: boolean;
}

interface Reminder {
  id: string;
  recipient_name: string;
  month: number;
  day: number;
  occasion_type: string;
  notify_days_before: number;
}

const OCCASION_EMOJI: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💍",
  name_day: "🎊",
  graduation: "🎓",
  other: "✨",
};

export default function SettingsHubClient() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isStandalone, setIsStandalone] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setNeedsLogin(false);
    try {
      const [profileRes, remindersRes] = await Promise.all([
        fetchAuthed("/api/profile/me"),
        fetchAuthed("/api/reminders"),
      ]);
      if (profileRes.status === 401 || remindersRes.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (profileRes.ok) setProfile(await profileRes.json());
      if (remindersRes.ok) setReminders(await remindersRes.json());
    } catch (e) {
      console.error("[settings] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Detect PWA + push permission
    if (typeof window !== "undefined") {
      const nav = window.navigator as { standalone?: boolean };
      const standalone = nav.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches;
      setIsStandalone(!!standalone);
      if ("Notification" in window) {
        setPushPermission(Notification.permission);
      } else {
        setPushPermission("unsupported");
      }
    }
  }, []);

  const toggleNotification = async (key: keyof Profile, current: boolean) => {
    if (!profile) return;
    // Optimistic update
    setProfile({ ...profile, [key]: !current } as Profile);
    try {
      const res = await fetchAuthed("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !current }),
      });
      if (!res.ok) {
        // Rollback
        setProfile({ ...profile });
      }
    } catch (e) {
      console.error("[settings] toggle failed", e);
      setProfile({ ...profile }); // rollback
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm(t("settings_profile.loading") ? "Eliminare questa ricorrenza?" : "Delete?")) return;
    try {
      const res = await fetchAuthed(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (e) { console.error("[settings] delete reminder failed", e); }
  };

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚙️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 10px" }}>Accedi per gestire le impostazioni</h1>
        <a href="/auth/login?next=/settings" style={{ background: ACCENT, color: "#fff", borderRadius: 40, padding: "13px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 12 }}>
          Accedi
        </a>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "28px 20px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 6px", letterSpacing: "-.5px" }}>
          ⚙️ Impostazioni
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 22px" }}>
          Gestisci profilo, notifiche, ricorrenze e preferenze.
        </p>

        {/* ── PROFILO ──────────────────────────────────── */}
        <Section title="👤 Profilo" id="profile">
          {loading && !profile ? (
            <div style={{ color: MUTED, fontSize: 13, padding: "6px 0" }}>Caricamento…</div>
          ) : profile ? (
            <>
              <Row
                label="Nome utente"
                value={profile.username ? `@${profile.username}` : <em style={{ color: MUTED }}>non impostato</em>}
              />
              <Row label="Email" value={<span style={{ fontSize: 12 }}>{profile.email}</span>} />
              <Link href="/settings/profile" style={{
                display: "block", textAlign: "center",
                marginTop: 10, padding: "10px",
                background: "transparent", color: ACCENT,
                border: `1.5px solid ${ACCENT}`, borderRadius: 40,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                Cambia nome utente
              </Link>
            </>
          ) : null}
        </Section>

        {/* ── NOTIFICHE ────────────────────────────────── */}
        <Section title="🔔 Notifiche" id="notifications">
          {pushPermission === "unsupported" ? (
            <div style={{ fontSize: 13, color: MUTED, padding: "8px 0", lineHeight: 1.5 }}>
              Il tuo browser non supporta le notifiche push.
            </div>
          ) : pushPermission === "denied" ? (
            <div style={{ fontSize: 13, color: ERR_RED, padding: "8px 0", lineHeight: 1.5 }}>
              Le notifiche sono bloccate. Abilitale dalle impostazioni del browser per BeGift.
            </div>
          ) : pushPermission === "default" ? (
            <div style={{ padding: "6px 0" }}>
              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 8px", lineHeight: 1.5 }}>
                Non hai ancora dato il permesso alle notifiche push. Attivale per ricevere un avviso quando arriva qualcosa di importante.
              </p>
              <p style={{ fontSize: 11, color: MUTED, margin: "0 0 12px", lineHeight: 1.5, opacity: 0.85 }}>
                Usiamo le notifiche solo per avvisarti di regali ricevuti, aperture dei tuoi regali e reazioni. Puoi revocare il consenso in qualsiasi momento dalle impostazioni del browser o da questa pagina. Dettagli nella{" "}
                <a href="/privacy" style={{ color: ACCENT, textDecoration: "none" }}>Privacy Policy</a>.
              </p>
              <EnablePushButton onEnabled={() => setPushPermission("granted")} />
            </div>
          ) : profile ? (
            <>
              <ToggleRow
                label="Quando ricevo un regalo"
                checked={profile.notify_gift_received}
                onToggle={() => toggleNotification("notify_gift_received", profile.notify_gift_received)}
              />
              <ToggleRow
                label="Quando il mio regalo viene aperto"
                checked={profile.notify_gift_opened}
                onToggle={() => toggleNotification("notify_gift_opened", profile.notify_gift_opened)}
              />
              <ToggleRow
                label="Quando qualcuno reagisce al mio regalo"
                checked={profile.notify_reaction}
                onToggle={() => toggleNotification("notify_reaction", profile.notify_reaction)}
              />
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: MUTED }}>
                Permesso browser: <strong style={{ color: OK_GREEN }}>attivo</strong>
              </div>
            </>
          ) : null}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/notifiche" style={{
              display: "block", textAlign: "center",
              padding: "10px",
              background: "transparent", color: ACCENT,
              border: `1.5px solid ${ACCENT}`, borderRadius: 40,
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              📥 Storico notifiche
            </Link>
            <Link href="/settings/notifiche-test" style={{
              display: "block", textAlign: "center",
              padding: "10px",
              background: "transparent", color: MUTED,
              border: `1.5px solid ${BORDER}`, borderRadius: 40,
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              🧪 Test notifiche
            </Link>
          </div>
        </Section>

        {/* ── RICORRENZE ───────────────────────────────── */}
        <Section title="🎂 Ricorrenze" id="reminders">
          {loading ? (
            <div style={{ color: MUTED, fontSize: 13, padding: "6px 0" }}>Caricamento…</div>
          ) : reminders.length === 0 ? (
            <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 12px", lineHeight: 1.5 }}>
              Aggiungi compleanni e anniversari per ricevere un promemoria quando si avvicinano.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {reminders.map((r) => {
                const emoji = OCCASION_EMOJI[r.occasion_type] ?? "✨";
                const dd = String(r.day).padStart(2, "0");
                const mm = String(r.month).padStart(2, "0");
                return (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", background: LIGHT, borderRadius: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <strong style={{ color: DEEP }}>{r.recipient_name}</strong>
                      <span style={{ color: MUTED, fontSize: 11, marginLeft: 6 }}>
                        · {dd}/{mm} · avviso {r.notify_days_before}gg prima
                      </span>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      aria-label="Elimina"
                      style={{
                        background: "transparent", border: "none",
                        fontSize: 14, color: "#E24B4A", cursor: "pointer",
                        padding: "4px 6px", lineHeight: 1,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/settings/reminders" style={{
            display: "block", textAlign: "center",
            padding: "10px",
            background: "transparent", color: ACCENT,
            border: `1.5px solid ${ACCENT}`, borderRadius: 40,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            + Aggiungi ricorrenza
          </Link>
        </Section>

        {/* ── LINGUA ───────────────────────────────────── */}
        <Section title="🌍 Lingua" id="language">
          <div style={{ padding: "4px 0" }}>
            <LangSwitcher />
          </div>
        </Section>

        {/* ── INSTALLAZIONE ───────────────────────────── */}
        <Section title="📲 Installazione" id="install">
          {isStandalone ? (
            <div style={{ fontSize: 13, color: OK_GREEN, fontWeight: 600 }}>
              ✓ BeGift è installata sul tuo dispositivo
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 10px", lineHeight: 1.5 }}>
                Installa BeGift come app sul tuo dispositivo per un'esperienza più veloce e ricevere notifiche.
              </p>
              <Link href="/install" style={{
                display: "block", textAlign: "center",
                padding: "10px",
                background: "transparent", color: ACCENT,
                border: `1.5px solid ${ACCENT}`, borderRadius: 40,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                Come installare →
              </Link>
            </div>
          )}
        </Section>

        {/* ── CONTATTI ─────────────────────────────────── */}
        <Section title="✉️ Contatti" id="contacts">
          <Row
            label="Supporto"
            value={<a href="mailto:support@begift.app" style={{ color: ACCENT, textDecoration: "none", fontSize: 12 }}>support@begift.app</a>}
          />
          <Row
            label="Info generali"
            value={<a href="mailto:info@begift.app" style={{ color: ACCENT, textDecoration: "none", fontSize: 12 }}>info@begift.app</a>}
          />
          <Row
            label="Segnalazioni abusi"
            value={<a href="mailto:abuse@begift.app" style={{ color: ACCENT, textDecoration: "none", fontSize: 12 }}>abuse@begift.app</a>}
          />
        </Section>

        {/* ── LEGALE ───────────────────────────────────── */}
        <Section title="📄 Legale" id="legal">
          <Row
            label={<Link href="/terms" style={{ color: DEEP, textDecoration: "none" }}>Condizioni d&apos;uso</Link>}
            value={<span style={{ color: MUTED }}>›</span>}
          />
          <Row
            label={<Link href="/privacy" style={{ color: DEEP, textDecoration: "none" }}>Privacy Policy</Link>}
            value={<span style={{ color: MUTED }}>›</span>}
          />
          <Row
            label={<Link href="/security" style={{ color: DEEP, textDecoration: "none" }}>Sicurezza / Vulnerability disclosure</Link>}
            value={<span style={{ color: MUTED }}>›</span>}
          />
          <Row
            label={<ExportDataButton />}
            value={null}
          />
        </Section>

        {/* ── ELIMINAZIONE ACCOUNT ───────────────────────── */}
        <Section title="🗑️ Elimina account" id="delete-account">
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px", lineHeight: 1.5 }}>
            Puoi eliminare il tuo account in qualsiasi momento (diritto all&apos;oblio, GDPR art. 17). Verranno cancellati tutti i tuoi regali, ricorrenze, preferenze e dati personali. <strong>L&apos;operazione è irreversibile.</strong>
          </p>
          <DeleteAccountButton />
        </Section>

        {/* ── LOGOUT ───────────────────────────────────── */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => {
              if (confirm("Vuoi davvero uscire?")) signOut();
            }}
            style={{
              background: "transparent",
              color: ERR_RED,
              border: `1.5px solid ${ERR_RED}`,
              borderRadius: 40,
              padding: "12px 28px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Esci dal tuo account
          </button>
        </div>
      </div>
    </main>
  );
}

// ── Sub components ─────────────────────────────────────

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${BORDER}`,
      padding: "14px 16px", marginBottom: 14,
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: "6px 0",
      fontSize: 13, color: MUTED,
    }}>
      <span>{label}</span>
      <span style={{ color: DEEP, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        width: "100%", background: "transparent", border: "none",
        padding: "10px 0", cursor: "pointer", fontFamily: "inherit",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span style={{ fontSize: 13, color: DEEP, textAlign: "left" }}>{label}</span>
      <span style={{
        width: 40, height: 22, borderRadius: 12,
        background: checked ? ACCENT : "#d5d0c8",
        position: "relative", transition: "background .18s",
        flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 2,
          left: checked ? 20 : 2,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", transition: "left .18s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}/>
      </span>
    </button>
  );
}

function EnablePushButton({ onEnabled }: { onEnabled: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        if (perm === "denied") setError("Permesso negato");
        setLoading(false);
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Configurazione push non completata");
        setLoading(false);
        return;
      }
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      await fetchAuthed("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      onEnabled();
    } catch (e) {
      console.error("[enable push] failed", e);
      setError("Errore. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={enable}
        disabled={loading}
        style={{
          width: "100%",
          background: ACCENT, color: "#fff",
          border: "none", borderRadius: 40,
          padding: "11px 18px", fontSize: 13, fontWeight: 800,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          fontFamily: "inherit",
        }}
      >
        {loading ? "Attendi…" : "Attiva notifiche"}
      </button>
      {error && <p style={{ fontSize: 12, color: ERR_RED, margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}

/**
 * DeleteAccountButton — avvia la cancellazione permanente dell'account
 * con doppia conferma (tipica pattern di sicurezza):
 *   1. Conferma modale "Eliminare?"
 *   2. Input "scrivi ELIMINA per confermare"
 *   3. POST /api/profile/delete con { confirm: true }
 *   4. Redirect a "/" dopo successo
 * Tutto il backend cascade cancella automaticamente via FK ON DELETE.
 */
function DeleteAccountButton() {
  const [deleting, setDeleting] = useState(false);

  const confirm2 = async () => {
    if (!confirm("Vuoi davvero eliminare il tuo account? Questa operazione è irreversibile e cancella tutti i tuoi dati.")) return;
    const typed = prompt("Per conferma, scrivi ELIMINA (tutto maiuscolo):");
    if (typed !== "ELIMINA") {
      alert("Eliminazione annullata (testo non corrispondente).");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetchAuthed("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        alert("Account eliminato. Sarai reindirizzato alla home.");
        try {
          localStorage.clear();
        } catch { /* ignore */ }
        window.location.href = "/";
      } else {
        alert("Errore nell'eliminazione. Riprova o contatta privacy@begift.app.");
      }
    } catch (e) {
      console.error("[delete account] failed", e);
      alert("Errore di rete. Riprova.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={confirm2}
      disabled={deleting}
      style={{
        width: "100%",
        background: "transparent",
        color: ERR_RED,
        border: `1.5px solid ${ERR_RED}`,
        borderRadius: 40,
        padding: "12px",
        fontSize: 13,
        fontWeight: 700,
        cursor: deleting ? "wait" : "pointer",
        opacity: deleting ? 0.6 : 1,
        fontFamily: "inherit",
      }}
    >
      {deleting ? "Elaborazione…" : "Elimina definitivamente il mio account"}
    </button>
  );
}

/**
 * ExportDataButton — attiva il download del bundle GDPR art. 20
 * (portabilita'). Chiama GET /api/profile/export che risponde con
 * Content-Disposition: attachment, quindi il browser scarica il JSON
 * senza bisogno di gestire blob manualmente.
 *
 * Nota: il bundle contiene i dati dell'utente in formato JSON leggibile
 * da macchina. Gli URL ai media sono pubblici ma non indicizzati.
 */
function ExportDataButton() {
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      // Usiamo un link temporaneo con token via Authorization header,
      // il che richiede fetch + blob + download programmatico.
      const res = await fetchAuthed("/api/profile/export");
      if (!res.ok) {
        alert("Errore nell'export. Riprova o contatta privacy@begift.app.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `begift-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("[export] failed", e);
      alert("Errore di rete.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={busy}
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        padding: 0,
        color: DEEP,
        fontSize: 14,
        fontFamily: "inherit",
        cursor: busy ? "wait" : "pointer",
      }}
    >
      {busy ? "Preparazione export…" : "Esporta i miei dati (GDPR art. 20)"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
