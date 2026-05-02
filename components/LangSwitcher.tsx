"use client";
import { useI18n } from "@/lib/i18n";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E", MUTED = "#888";

const LANGS = [
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ja", label: "JA", flag: "🇯🇵" },
  { code: "zh", label: "ZH", flag: "🇨🇳" },
];

/**
 * Oltre a impostare la lingua nel context client (che persiste in
 * localStorage), salviamo la scelta server-side via POST /api/profile/locale.
 * Serve per le email transazionali: il backend legge users.preferred_locale
 * per scegliere la variant IT vs EN dei template Resend. Se l'utente non
 * è loggato, la chiamata fallisce silenziosamente: la UI continua a
 * funzionare con il solo localStorage come fonte di verità.
 */
async function syncLocaleServerSide(locale: string) {
  try {
    await fetchAuthed("/api/profile/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
  } catch {
    /* non loggato o errore di rete — UI già aggiornata via localStorage */
  }
}

export default function LangSwitcher({ style }: { style?: React.CSSProperties }) {
  const { locale, setLocale } = useI18n();
  const handlePick = (code: string) => {
    setLocale(code);
    syncLocaleServerSide(code);
  };
  return (
    <div className="topbar-lang" style={{ display: "flex", ...style }}>
      {LANGS.map((l, i) => (
        <button
          key={l.code}
          onClick={() => handlePick(l.code)}
          style={{
            background: locale === l.code ? ACCENT : "#fff",
            color: locale === l.code ? "#fff" : MUTED,
            border: "1.5px solid #e0dbd5",
            borderRadius:
              i === 0
                ? "20px 0 0 20px"
                : i === LANGS.length - 1
                ? "0 20px 20px 0"
                : "0",
            padding: "5px 10px",
            fontSize: 11,
            cursor: "pointer",
            fontWeight: 700,
            marginLeft: i > 0 ? "-1.5px" : 0,
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, lineHeight: 1 }}>
            <span className="topbar-lang-flag" style={{ fontSize: 13 }}>{l.flag}</span>
            <span className="topbar-lang-label" style={{ fontSize: 9 }}>{l.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
