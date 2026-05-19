"use client";

/**
 * Dashboard BeGift Business — client component.
 *
 * Mostra: header con nome business, stats (totale + aperti), bottone
 * "Nuovo pacco", lista pacchi inviati (recenti prima) con stato + reazioni.
 *
 * Empty states:
 *   - utente non loggato → "Accedi"
 *   - utente loggato senza business_account → "Account business non attivo,
 *     contatta Luca"
 *   - business_account attivo, lista vuota → "Crea il tuo primo pacco"
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";
const CARD = "#fff";

interface BusinessAccount {
  id: string;
  business_name: string;
  contact_email: string;
  brand_color: string | null;
  logo_url: string | null;
  status: string;
}

interface Stats {
  total_gifts: number;
  opened_gifts: number;
}

interface GiftRow {
  id: string;
  recipient_name: string;
  message: string | null;
  opened_at: string | null;
  created_at: string;
  open_token: string | null;
  coupon_file_url: string | null;
  reactions_count: number;
}

type FetchState =
  | { kind: "loading" }
  | { kind: "unauthorized" }
  | { kind: "no_account" }
  | { kind: "ready"; business: BusinessAccount; stats: Stats; gifts: GiftRow[] }
  | { kind: "error"; message: string };

export default function BusinessDashboardClient() {
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  useEffect(() => {
    void loadData(setState);
  }, []);

  if (state.kind === "loading") return <LoadingShell />;
  if (state.kind === "unauthorized") return <UnauthShell />;
  if (state.kind === "no_account") return <NoAccountShell />;
  if (state.kind === "error") return <ErrorShell message={state.message} />;

  const { business, stats, gifts } = state;
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "20px 16px 80px",
        fontFamily: "system-ui, sans-serif",
        color: INK,
      }}
    >
      {/* Header business */}
      <header style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>BeGift Business</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0" }}>
          {business.business_name}
        </h1>
      </header>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <StatCard label="Pacchi inviati" value={stats.total_gifts} />
        <StatCard label="Aperti" value={stats.opened_gifts} />
      </div>

      {/* CTA */}
      <Link
        href="/business/new-pack"
        style={{
          display: "block",
          background: ACCENT,
          color: "#fff",
          textAlign: "center",
          padding: "12px 16px",
          borderRadius: 50,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        + Nuovo pacco coupon
      </Link>

      {/* Lista pacchi */}
      <p
        style={{
          fontSize: 11,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          margin: "0 0 8px",
        }}
      >
        Pacchi recenti
      </p>
      {gifts.length === 0 ? (
        <EmptyListShell />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {gifts.map((g) => (
            <GiftCard key={g.id} gift={g} />
          ))}
        </div>
      )}
    </main>
  );
}

// ────────────────────────────────────────────────────────────────

async function loadData(setState: (s: FetchState) => void) {
  try {
    const meRes = await fetchAuthed("/api/business/me");
    if (meRes.status === 401) {
      setState({ kind: "unauthorized" });
      return;
    }
    if (meRes.status === 404) {
      setState({ kind: "no_account" });
      return;
    }
    if (!meRes.ok) {
      setState({ kind: "error", message: `me: ${meRes.status}` });
      return;
    }
    const meData = (await meRes.json()) as {
      business: BusinessAccount;
      stats: Stats;
    };

    const giftsRes = await fetchAuthed("/api/business/gifts");
    if (!giftsRes.ok) {
      setState({ kind: "error", message: `gifts: ${giftsRes.status}` });
      return;
    }
    const giftsData = (await giftsRes.json()) as { gifts: GiftRow[] };

    setState({
      kind: "ready",
      business: meData.business,
      stats: meData.stats,
      gifts: giftsData.gifts || [],
    });
  } catch (e) {
    setState({ kind: "error", message: (e as Error).message });
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: SOFT_BG,
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>{value}</div>
    </div>
  );
}

function GiftCard({ gift }: { gift: GiftRow }) {
  const isOpened = !!gift.opened_at;
  const created = new Date(gift.created_at).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
  const openUrl = gift.open_token ? `/g/${gift.open_token}` : null;
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
            {gift.recipient_name}
          </div>
          {gift.message && (
            <div
              style={{
                fontSize: 12,
                color: MUTED,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {gift.message}
            </div>
          )}
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
            {created}
            {gift.reactions_count > 0 && (
              <span style={{ marginLeft: 8, color: ACCENT }}>
                ❤️ {gift.reactions_count}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              background: isOpened ? "#E1F5EE" : SOFT_BG,
              color: isOpened ? "#0F6E56" : MUTED,
              fontWeight: 500,
            }}
          >
            {isOpened ? "aperto" : "inviato"}
          </span>
          {openUrl && (
            <button
              type="button"
              onClick={() => copyLink(openUrl)}
              style={{
                background: "transparent",
                color: ACCENT,
                border: `1px solid ${ACCENT}`,
                borderRadius: 50,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Copia link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function copyLink(path: string) {
  const full = `${window.location.origin}${path}`;
  void navigator.clipboard.writeText(full);
  alert("Link copiato negli appunti:\n" + full);
}

function LoadingShell() {
  return (
    <main style={{ padding: 40, textAlign: "center", color: MUTED, fontFamily: "system-ui, sans-serif" }}>
      Caricamento…
    </main>
  );
}

function UnauthShell() {
  return (
    <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: INK }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Accedi</h1>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
        Per usare la dashboard Business devi essere loggato.
      </p>
      <Link
        href="/login?next=/business"
        style={{
          display: "inline-block",
          background: ACCENT,
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 50,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Accedi
      </Link>
    </main>
  );
}

function NoAccountShell() {
  return (
    <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: INK, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Account business non attivo</h1>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
        Non risulti registrata/o come account business su BeGift. Se vuoi attivarne uno per il tuo studio o attività,
        scrivi una mail a{" "}
        <a href="mailto:psyluca@gmail.com" style={{ color: ACCENT }}>
          psyluca@gmail.com
        </a>
        .
      </p>
    </main>
  );
}

function ErrorShell({ message }: { message: string }) {
  return (
    <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: INK }}>
      <p style={{ color: "#A32D2D" }}>Errore: {message}</p>
    </main>
  );
}

function EmptyListShell() {
  return (
    <div
      style={{
        background: SOFT_BG,
        borderRadius: 12,
        padding: "20px 16px",
        textAlign: "center",
        color: MUTED,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      Non hai ancora creato pacchi.<br />
      Clicca su <strong style={{ color: INK }}>+ Nuovo pacco coupon</strong> per cominciare.
    </div>
  );
}
