"use client";

/**
 * PackagingPicker — UI condivisa per personalizzare il pacchetto regalo.
 *
 * Usata in:
 *  - /gift/[id]/edit (percorso parsing: dopo aver completato la mail
 *    inoltrata, l'utente arriva qui per decorare il pacco)
 *  - /create step 4 (percorso "crea": dopo messaggio, l'utente sceglie
 *    carta, nastro, fiocco, animazione, suono)
 *
 * Prima del 2026-05-23 i due flussi avevano UI diverse (parsing: preset
 * cards + swatch tondi + pill rows; create: bottoni quadrati inline).
 * Luca ha chiesto di uniformare al design del parsing — questo file
 * estrae quell'UI in un componente riusabile, e aggiunge l'upload MP3
 * (che era solo nel create).
 *
 * Props:
 *  - pkg / onPkgChange: stato Packaging controllato
 *  - customSoundUrl / customSoundName / customSoundTitle: upload audio
 *    custom; quando settati, packaging.sound diventa "custom" (extra,
 *    fuori dall'enum tipizzato — usato come marker runtime)
 *  - onCustomSound*Change: setter per i 3 campi sopra
 *  - showThemePicker: mostra il selettore Special Edition (default false)
 *  - theme / onThemeChange: tema corrente quando showThemePicker=true
 */

import GiftSVG from "@/components/GiftSVG";
import { useUpload } from "@/hooks/useUpload";
import type { Packaging } from "@/types";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const CARD = "#fff";
const BORDER = "#e8e4de";

// Preset visivi che pre-popolano carta+nastro+fiocco+animazione+suono.
// Subset coerente coi tile di /create — qui in formato grid 3-col.
interface Preset {
  id: string;
  label: string;
  emoji: string;
  pkg: Packaging;
}
const PRESETS: Preset[] = [
  { id: "classico",  label: "Classico",  emoji: "🎁", pkg: { paperColor: "#D85A5A", ribbonColor: "#E8C84A", bowColor: "#E8C84A", bowType: "classic", openAnimation: "lift",    sound: "bells"  } },
  { id: "festoso",   label: "Festoso",   emoji: "🎉", pkg: { paperColor: "#E8C84A", ribbonColor: "#D85A5A", bowColor: "#D85A5A", bowType: "rosette", openAnimation: "explode", sound: "pop"    } },
  { id: "romantico", label: "Romantico", emoji: "🌹", pkg: { paperColor: "#E8A0A0", ribbonColor: "#E8C84A", bowColor: "#E8C84A", bowType: "classic", openAnimation: "lift",    sound: "chime"  } },
  { id: "elegante",  label: "Elegante",  emoji: "✨", pkg: { paperColor: "#1A3A6B", ribbonColor: "#E8C84A", bowColor: "#E8C84A", bowType: "star",    openAnimation: "unfold",  sound: "magic"  } },
  { id: "kawaii",    label: "Kawaii",    emoji: "🌸", pkg: { paperColor: "#F5C6C6", ribbonColor: "#F8F5ED", bowColor: "#F8F5ED", bowType: "pompom",  openAnimation: "unfold",  sound: "kawaii" } },
  { id: "natura",    label: "Natura",    emoji: "🌿", pkg: { paperColor: "#3B8C5A", ribbonColor: "#D85A5A", bowColor: "#E8C84A", bowType: "classic", openAnimation: "unfold",  sound: "bells"  } },
];

const COLOR_SWATCHES = [
  "#D85A5A", "#E8C84A", "#3B8C5A", "#1A3A6B", "#6B5BCC",
  "#D4537E", "#F5C6C6", "#8EC49A", "#E8A0A0", "#F5E8D5",
  "#1a1a1a", "#FFFFFF",
];

const BOW_TYPES: { id: Packaging["bowType"]; label: string }[] = [
  { id: "classic", label: "Classico" },
  { id: "star",    label: "Stella"   },
  { id: "rosette", label: "Rosetta"  },
  { id: "simple",  label: "Semplice" },
  { id: "pompom",  label: "Pompom"   },
];

const ANIMATIONS: { id: Packaging["openAnimation"]; label: string }[] = [
  { id: "lift",    label: "Solleva"   },
  { id: "unfold",  label: "Apri"      },
  { id: "explode", label: "Esplodi"   },
  { id: "spin",    label: "Ruota"     },
  { id: "shatter", label: "Frantuma"  },
];

const SOUNDS: { id: Packaging["sound"]; label: string }[] = [
  { id: "bells",  label: "🔔 Campanelle" },
  { id: "pop",    label: "💥 Pop"        },
  { id: "magic",  label: "✨ Magia"      },
  { id: "woosh",  label: "💨 Woosh"      },
  { id: "chime",  label: "🎐 Chime"      },
  { id: "kawaii", label: "🌸 Kawaii"     },
  { id: "none",   label: "🔇 Silenzio"   },
];

const THEMES: { id: NonNullable<Packaging["theme"]>; label: string }[] = [
  { id: "standard",   label: "🎁 Standard"    },
  { id: "easter",     label: "🥚 Pasqua"      },
  { id: "graduation", label: "🎓 Laurea"      },
  { id: "birthday",   label: "🎂 Compleanno"  },
  { id: "kawaii",     label: "✨ Kawaii"      },
];

// ── Preview sounds (Web Audio API fallback) ──────────────────────
// Stessa logica di /create (playPreview) — replicata qui per non
// dipendere da CreateGiftClient. Se il sample remote fallisce o il
// browser blocca, ricade su sintesi.
const DEFAULT_SOUND_URLS: Record<string, string> = {
  bells: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/339822__inspectorj__hand-bells-cluster.wav",
  magic: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/350352__robinhood76__06741-good-news-magic-ding.wav",
  woosh: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/611475__jwsounddesign__woosh-long-cinematic.wav",
  chime: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/660863__drooler__chime-improper.flac",
  pop:   "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/789793__quatricise__pop-4.wav",
};

function playPreview(id: string, customUrl?: string) {
  if (id === "none") return;
  const url = customUrl || DEFAULT_SOUND_URLS[id];
  if (url) {
    try {
      const a = new Audio(url);
      a.volume = 0.7;
      // Se il file fallisce, NON falliamo silenziosamente — invochiamo
      // la sintesi come fallback. Cosi' l'utente sente sempre qualcosa
      // anche se il bucket Supabase ha file mancanti / 404.
      a.play().catch(() => playSynth(id));
      return;
    } catch (_) {
      // continua sulla sintesi
    }
  }
  playSynth(id);
}

function playSynth(id: string) {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const mg = ctx.createGain();
    mg.gain.value = 0.5;
    mg.connect(ctx.destination);
    const now = ctx.currentTime;

    if (id === "bells") {
      [523.25, 659.26, 783.99, 1046.5].forEach((f, i) => {
        const t = now + i * 0.1;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.2, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        o.connect(g); g.connect(mg);
        o.start(t); o.stop(t + 1.3);
      });
    } else if (id === "magic") {
      [880, 1109, 1319, 1568, 1760, 2093].forEach((f, i) => {
        const t = now + i * 0.07;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f * 0.5, t);
        o.frequency.linearRampToValueAtTime(f, t + 0.05);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        o.connect(g); g.connect(mg);
        o.start(t); o.stop(t + 0.5);
      });
    } else if (id === "pop") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(80, now);
      o.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.connect(g); g.connect(mg);
      o.start(now); o.stop(now + 0.2);
      [800, 1200, 1600].forEach((f, i) => {
        const t = now + 0.1 + i * 0.06;
        const wo = ctx.createOscillator(), wg = ctx.createGain();
        wo.type = "sine";
        wo.frequency.setValueAtTime(f, t);
        wo.frequency.linearRampToValueAtTime(f * 1.5, t + 0.2);
        wg.gain.setValueAtTime(0.12, t);
        wg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        wo.connect(wg); wg.connect(mg);
        wo.start(t); wo.stop(t + 0.3);
      });
    } else if (id === "woosh") {
      const bl = ctx.sampleRate * 0.8;
      const wb = ctx.createBuffer(1, bl, ctx.sampleRate);
      const wd = wb.getChannelData(0);
      for (let i = 0; i < bl; i++) wd[i] = (Math.random() * 2 - 1) * Math.sin((i / bl) * Math.PI);
      const ws = ctx.createBufferSource(); ws.buffer = wb;
      const fi = ctx.createBiquadFilter();
      fi.type = "bandpass";
      fi.frequency.setValueAtTime(1200, now);
      fi.frequency.exponentialRampToValueAtTime(200, now + 0.6);
      fi.Q.value = 1.5;
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0, now);
      wg.gain.linearRampToValueAtTime(0.5, now + 0.1);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      ws.connect(fi); fi.connect(wg); wg.connect(mg);
      ws.start(now);
    } else if (id === "chime") {
      [523.25, 659.26, 783.99, 880, 1046.5, 1174.66].forEach((f, i) => {
        const t = now + i * 0.11;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        o.connect(g); g.connect(mg);
        o.start(t); o.stop(t + 1.2);
      });
    } else if (id === "kawaii") {
      [523.25, 659.26, 783.99, 880, 783.99, 659.26, 1046.5].forEach((f, i) => {
        const t = now + i * 0.12;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        o.connect(g); g.connect(mg);
        o.start(t); o.stop(t + 0.6);
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = "sine"; o2.frequency.value = f * 3;
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.04, t + 0.01);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o2.connect(g2); g2.connect(mg);
        o2.start(t); o2.stop(t + 0.35);
      });
    }
  } catch (_) { /* ignore audio errors */ }
}

// ──────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────

export interface PackagingPickerProps {
  pkg: Packaging;
  onPkgChange: (next: Packaging) => void;
  customSoundUrl?: string;
  customSoundName?: string;
  customSoundTitle?: string;
  onCustomSoundChange?: (url: string, name: string) => void;
  onCustomSoundTitleChange?: (title: string) => void;
  onCustomSoundClear?: () => void;
  showThemePicker?: boolean;
}

// ──────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────

export default function PackagingPicker({
  pkg,
  onPkgChange,
  customSoundUrl,
  customSoundName,
  customSoundTitle,
  onCustomSoundChange,
  onCustomSoundTitleChange,
  onCustomSoundClear,
  showThemePicker = false,
}: PackagingPickerProps) {
  const { upload, uploading } = useUpload();

  const updatePkg = (patch: Partial<Packaging>) => {
    onPkgChange({ ...pkg, ...patch });
  };

  const applyPreset = (preset: Preset) => {
    // Reset custom sound quando si applica un preset (il preset ha
    // gia' un suono predefinito — meglio non confondere l'utente
    // tenendo entrambi attivi). Solo se il caller espone clearcustom.
    if (onCustomSoundClear && customSoundName) onCustomSoundClear();
    onPkgChange(preset.pkg);
  };

  const handleSoundUpload = async (file: File) => {
    if (!onCustomSoundChange) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File troppo grande (max 10MB)");
      return;
    }
    try {
      const url = await upload(file, "gift-media");
      onCustomSoundChange(url, file.name);
      // Mark sound as custom (extra runtime value oltre l'enum tipizzato)
      updatePkg({ sound: "custom" as Packaging["sound"] });
    } catch (e) {
      alert("Upload fallito: " + (e as Error).message);
    }
  };

  const isCustomSoundActive = !!customSoundName;

  return (
    <div>
      {/* Preview live */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: "20px 18px 14px",
          marginBottom: 18,
          textAlign: "center",
        }}
      >
        <div style={{ width: 180, height: 180, margin: "0 auto" }}>
          <GiftSVG
            paper={pkg.paperColor}
            ribbon={pkg.ribbonColor}
            bow={pkg.bowColor}
            bowType={pkg.bowType}
            animated
            theme={pkg.theme || "standard"}
          />
        </div>
      </div>

      {/* Preset rapidi */}
      <Section title="Preset rapidi">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                background: CARD,
                border: `1.5px solid ${BORDER}`,
                borderRadius: 12,
                padding: "10px 8px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: INK,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Color pickers */}
      <Section title="Colore carta">
        <SwatchRow
          value={pkg.paperColor}
          onPick={(c) => updatePkg({ paperColor: c })}
        />
      </Section>
      <Section title="Colore nastro">
        <SwatchRow
          value={pkg.ribbonColor}
          onPick={(c) => updatePkg({ ribbonColor: c })}
        />
      </Section>
      <Section title="Colore fiocco">
        <SwatchRow
          value={pkg.bowColor}
          onPick={(c) => updatePkg({ bowColor: c })}
        />
      </Section>

      {/* Bow type */}
      <Section title="Tipo di fiocco">
        <PillRow
          options={BOW_TYPES}
          value={pkg.bowType}
          onPick={(v) => updatePkg({ bowType: v as Packaging["bowType"] })}
        />
      </Section>

      {/* Theme (special editions) */}
      {showThemePicker && (
        <Section title="Special edition">
          <PillRow
            options={THEMES}
            value={pkg.theme || "standard"}
            onPick={(v) => updatePkg({ theme: v as Packaging["theme"] })}
          />
        </Section>
      )}

      {/* Animation */}
      <Section title="Apertura">
        <PillRow
          options={ANIMATIONS}
          value={pkg.openAnimation}
          onPick={(v) =>
            updatePkg({ openAnimation: v as Packaging["openAnimation"] })
          }
        />
      </Section>

      {/* Sound (preset + preview) */}
      <Section title="Suono">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: onCustomSoundChange ? 12 : 0,
          }}
        >
          {SOUNDS.map((s) => {
            const active =
              s.id === pkg.sound && !isCustomSoundActive;
            return (
              <div
                key={s.id}
                style={{ display: "flex", alignItems: "center" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    // Quando l'utente sceglie un preset, smetti di usare
                    // il suono custom (se presente). Cosi' non resta
                    // appeso un sound="custom" con un preset selezionato.
                    if (onCustomSoundClear && customSoundName)
                      onCustomSoundClear();
                    updatePkg({ sound: s.id as Packaging["sound"] });
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius:
                      s.id !== "none" ? "50px 0 0 50px" : 50,
                    border: `1.5px solid ${active ? ACCENT : BORDER}`,
                    background: active ? ACCENT : CARD,
                    color: active ? "#fff" : INK,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
                {s.id !== "none" && (
                  <button
                    type="button"
                    onClick={() => playPreview(s.id)}
                    aria-label={`Anteprima ${s.label}`}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "0 50px 50px 0",
                      border: `1.5px solid ${active ? ACCENT : BORDER}`,
                      borderLeft: "none",
                      background: active ? "#9c3a5d" : "#faf7f3",
                      color: active ? "#fff" : MUTED,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ▶
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom MP3 upload (opt-in: solo se onCustomSoundChange e' fornito) */}
        {onCustomSoundChange && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: MUTED,
                margin: "10px 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Oppure carica un MP3
            </p>
            {isCustomSoundActive ? (
              <div
                style={{
                  background: "#f0faf5",
                  border: "1px solid #b2dfce",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#1a7a4a",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🎵 {customSoundName}
                  </span>
                  <button
                    type="button"
                    onClick={() => playPreview("custom", customSoundUrl)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1a7a4a",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                    aria-label="Anteprima audio caricato"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCustomSoundClear) onCustomSoundClear();
                      updatePkg({ sound: "bells" });
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#888",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    aria-label="Rimuovi audio caricato"
                  >
                    ×
                  </button>
                </div>
                {onCustomSoundTitleChange && (
                  <input
                    type="text"
                    placeholder="Titolo del brano (opzionale)"
                    value={customSoundTitle || ""}
                    onChange={(e) =>
                      onCustomSoundTitleChange(e.target.value)
                    }
                    style={{
                      width: "100%",
                      fontSize: 12,
                      padding: "6px 10px",
                      border: "1px solid #b2dfce",
                      borderRadius: 8,
                      outline: "none",
                      background: "#fff",
                      color: INK,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            ) : (
              <label
                style={{
                  display: "block",
                  background: CARD,
                  border: "1.5px dashed #d5cfc8",
                  borderRadius: 12,
                  padding: "12px",
                  textAlign: "center",
                  cursor: uploading ? "wait" : "pointer",
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 12, color: MUTED }}>
                  {uploading
                    ? "Carico…"
                    : "MP3, M4A, WAV (max 10MB)"}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await handleSoundUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <h3
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: MUTED,
          margin: "0 0 10px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function SwatchRow({
  value,
  onPick,
}: {
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {COLOR_SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-label={c}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: c,
            border:
              value.toLowerCase() === c.toLowerCase()
                ? `3px solid ${ACCENT}`
                : `1px solid ${BORDER}`,
            cursor: "pointer",
            padding: 0,
          }}
        />
      ))}
      {/* Custom color via native picker */}
      <label
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `conic-gradient(red, orange, yellow, green, blue, purple, red)`,
          border: `1px solid ${BORDER}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#fff",
          textShadow: "0 0 2px #000",
        }}
        title="Colore custom"
      >
        +
        <input
          type="color"
          value={value}
          onChange={(e) => onPick(e.target.value)}
          style={{
            opacity: 0,
            position: "absolute",
            width: 0,
            height: 0,
          }}
        />
      </label>
    </div>
  );
}

function PillRow({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 50,
              border: `1.5px solid ${active ? ACCENT : BORDER}`,
              background: active ? ACCENT : CARD,
              color: active ? "#fff" : INK,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
