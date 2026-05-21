"use client";

/**
 * Client component per /admin/catalog. Pattern uguale a AdminStatsClient:
 * fetchAuthed → gestisce 403 → renderizza dashboard.
 */

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT = "#f7f5f2";
const BORDER = "#e8e4de";
const OK = "#3b8c5a";
const WARN = "#d97706";
const ERR = "#dc2626";

interface SyncRun {
  id: string;
  source: string;
  trigger: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  fetched: number;
  filtered: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duration_ms: number | null;
  error_message: string | null;
  notes: { pages?: number; mock_mode?: boolean; log?: unknown[] } | null;
}

interface RunsResponse {
  runs: SyncRun[];
  catalog_counts: Record<string, number>;
}

export default function AdminCatalogClient() {
  const [data, setData] = useState<RunsResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">(
    "loading"
  );
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetchAuthed("/api/admin/catalog/runs");
      if (res.status === 403) {
        setState("forbidden");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      setData(await res.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function triggerSync(merchant: "gyg" | "vvt", dryRun: boolean) {
    setSyncing(true);
    setLastResult(null);
    try {
      const params = new URLSearchParams();
      params.set("merchant", merchant);
      if (dryRun) params.set("dryRun", "1");
      const url = `/api/admin/catalog/runs?${params.toString()}`;
      const res = await fetchAuthed(url, { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        const label = merchant === "gyg" ? "GYG" : "VVT";
        setLastResult(
          `OK ${label}${dryRun ? " (dry)" : ""} — ${
            body.stats?.inserted || 0
          } inseriti, ${body.stats?.updated || 0} aggiornati, ${
            body.stats?.skipped || 0
          } skip, ${body.stats?.errors || 0} errori${
            body.stats?.mock_mode ? " · MOCK MODE" : ""
          }.`
        );
        await load();
      } else {
        setLastResult(`Errore: ${body.message || body.error || res.statusText}`);
      }
    } catch (e) {
      setLastResult(`Errore: ${(e as Error).message}`);
    } finally {
      setSyncing(false);
    }
  }

  if (state === "loading") {
    return <Wrap><p style={{ color: MUTED }}>Caricamento…</p></Wrap>;
  }
  if (state === "forbidden") {
    return (
      <Wrap>
        <h1 style={{ color: ERR }}>Accesso negato</h1>
        <p>Solo gli admin (whitelist ADMIN_EMAILS) possono vedere questa pagina.</p>
      </Wrap>
    );
  }
  if (state === "error" || !data) {
    return (
      <Wrap>
        <p style={{ color: ERR }}>Errore nel caricamento.</p>
        <button onClick={load}>Riprova</button>
      </Wrap>
    );
  }

  const lastRun = data.runs[0];

  return (
    <Wrap>
      <h1 style={{ color: INK, fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>
        Catalog Sync
      </h1>
      <p style={{ color: MUTED, margin: "0 0 22px", fontSize: 14 }}>
        Stato del catalogo + storia degli import GYG.
      </p>

      {/* Sezione conteggi catalogo */}
      <Section title="Catalogo corrente (active=true)">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(data.catalog_counts).length === 0 ? (
            <p style={{ color: MUTED, fontSize: 13 }}>Catalogo vuoto.</p>
          ) : (
            Object.entries(data.catalog_counts).map(([src, count]) => (
              <Pill key={src} label={src} value={count} />
            ))
          )}
        </div>
      </Section>

      {/* Azione sync GetYourGuide */}
      <Section title="Sync GetYourGuide (Partner API)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => triggerSync("gyg", false)}
            disabled={syncing}
            style={primaryBtn(syncing)}
          >
            {syncing ? "Sync in corso…" : "Sync GYG ora"}
          </button>
          <button
            onClick={() => triggerSync("gyg", true)}
            disabled={syncing}
            style={secondaryBtn(syncing)}
          >
            Dry run GYG
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>
          Senza <code>GYG_PARTNER_API_KEY</code> gira in mock mode (3 tour finti).
        </p>
      </Section>

      {/* Azione sync VivaTicket */}
      <Section title="Sync VivaTicket (Awin Product Feed)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => triggerSync("vvt", false)}
            disabled={syncing}
            style={primaryBtn(syncing)}
          >
            {syncing ? "Sync in corso…" : "Sync VVT ora"}
          </button>
          <button
            onClick={() => triggerSync("vvt", true)}
            disabled={syncing}
            style={secondaryBtn(syncing)}
          >
            Dry run VVT
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>
          Senza <code>AWIN_VVT_FEED_URL</code> gira in mock mode (3 eventi finti:
          Coldplay Milano, Aida Verona, Bologna FC).
        </p>
      </Section>

      {lastResult && (
        <p
          style={{
            padding: "10px 14px",
            background: lastResult.startsWith("OK") ? "#ecfdf5" : "#fef2f2",
            color: lastResult.startsWith("OK") ? OK : ERR,
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "ui-monospace, monospace",
            marginBottom: 24,
          }}
        >
          {lastResult}
        </p>
      )}

      {/* Ultimo run highlight */}
      {lastRun && (
        <Section title="Ultima sync">
          <RunCard run={lastRun} highlight />
        </Section>
      )}

      {/* Storia run */}
      <Section title={`Storia (${data.runs.length} run)`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.runs.map((r) => (
            <RunCard key={r.id} run={r} />
          ))}
        </div>
      </Section>
    </Wrap>
  );
}

// ───────── helpers visivi ─────────

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT,
        padding: "32px 16px 80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 10px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 13,
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>{" "}
      <strong style={{ color: INK }}>{value}</strong>
    </div>
  );
}

function statusColor(s: string): string {
  if (s === "success") return OK;
  if (s === "partial") return WARN;
  if (s === "error") return ERR;
  if (s === "running") return ACCENT;
  return MUTED;
}

function RunCard({ run, highlight }: { run: SyncRun; highlight?: boolean }) {
  const dur =
    run.duration_ms != null
      ? `${(run.duration_ms / 1000).toFixed(1)}s`
      : run.status === "running"
      ? "…"
      : "—";
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${highlight ? ACCENT : BORDER}`,
        borderRadius: 10,
        padding: highlight ? 16 : 12,
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            background: statusColor(run.status),
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {run.status}
        </span>
        <span style={{ color: MUTED, fontSize: 12 }}>
          {new Date(run.started_at).toLocaleString("it-IT")}
        </span>
        <span style={{ color: MUTED, fontSize: 12 }}>·</span>
        <span style={{ color: MUTED, fontSize: 12 }}>{run.trigger}</span>
        <span style={{ color: MUTED, fontSize: 12 }}>·</span>
        <span style={{ color: MUTED, fontSize: 12 }}>{dur}</span>
        {run.notes?.mock_mode && (
          <span
            style={{
              background: "#fef3c7",
              color: "#92400e",
              fontSize: 11,
              padding: "1px 7px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            MOCK
          </span>
        )}
      </div>
      <div style={{ color: INK, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>
        fetched={run.fetched} · filtered={run.filtered} · ins={run.inserted} ·
        upd={run.updated} · skip={run.skipped} · err={run.errors}
        {run.notes?.pages != null && ` · pages=${run.notes.pages}`}
      </div>
      {run.error_message && (
        <p
          style={{
            marginTop: 6,
            color: ERR,
            fontSize: 12,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {run.error_message}
        </p>
      )}
    </div>
  );
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 18px",
    background: disabled ? "#ccc" : ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "wait" : "pointer",
  };
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 18px",
    background: "#fff",
    color: INK,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "wait" : "pointer",
  };
}
