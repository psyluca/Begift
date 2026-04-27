"use client";

/**
 * ParentLetterCreateClient — questionario guidato 5+1 step generico
 * per template Festa della Mamma e Festa del Papa'.
 *
 * Stessa UX della versione precedente FestaMammaCreateClient ma con
 * config-driven palette, microcopy e suggerimenti rotanti — vedi
 * lib/parent-templates.ts.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthed } from "@/lib/clientAuth";
import { useUpload } from "@/hooks/useUpload";
import { track } from "@/lib/analytics";
import type { ParentTemplateConfig } from "@/lib/parent-templates";
import { SongPicker } from "@/components/SongPicker";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#fafaf7";
const BORDER = "#e0dbd5";
const ERR_RED = "#B71C1C";

interface Props {
  config: ParentTemplateConfig;
}

export function ParentLetterCreateClient({ config }: Props) {
  const router = useRouter();
  const { upload } = useUpload();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [senderAlias, setSenderAlias] = useState("");
  const [word, setWord] = useState("");
  const [memory, setMemory] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [lesson, setLesson] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [voucherUrl, setVoucherUrl] = useState("");

  const [wordSuggestionIdx, setWordSuggestionIdx] = useState(0);
  useEffect(() => {
    if (step !== 1 || word) return;
    const t = setInterval(() => {
      setWordSuggestionIdx((i) => (i + 1) % config.wordSuggestions.length);
    }, 2200);
    return () => clearInterval(t);
  }, [step, word, config.wordSuggestions.length]);

  const STEPS = config.stepTitles;
  const totalSteps = STEPS.length;

  const canAdvance = (() => {
    switch (step) {
      case 0: return recipientName.trim().length >= 2;
      case 1: return word.trim().length >= 2;
      case 2: return memory.trim().length >= 5;
      default: return true;
    }
  })();

  /** Step 3+ sono tutti OPZIONALI (foto, lezione, canzone, voucher).
   *  Quando l'utente non ha inserito ancora nulla, il bottone "Avanti"
   *  diventa "Salta" per comunicare esplicitamente che puo' procedere
   *  anche a vuoto. Migliora la friction percepita — molti utenti
   *  pre-fix pensavano che servisse riempire ogni campo. */
  const stepIsEmpty = (() => {
    switch (step) {
      case 3: return !photoUrl;
      case 4: return !lesson.trim();
      case 5: return !songUrl;
      case 6: return !voucherUrl;
      default: return false;
    }
  })();

  const next = () => { if (step < totalSteps - 1) setStep(step + 1); setError(null); };
  const prev = () => { if (step > 0) setStep(step - 1); setError(null); };

  const handlePhoto = async (file: File) => {
    setPhotoUploading(true);
    try {
      const url = await upload(file, "gift-media");
      if (url) setPhotoUrl(url);
    } catch (e) {
      console.error("[parent-letter] photo upload failed", e);
      setError("Errore nell'upload della foto. Riprova.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const templateData = {
        word: word.trim(),
        memory: memory.trim(),
        photo_url: photoUrl || null,
        lesson: lesson.trim() || null,
        song_url: songUrl.trim() || null,
        voucher_url: voucherUrl.trim() || null,
      };
      const body = {
        recipientName: recipientName.trim(),
        senderAlias: senderAlias.trim() || null,
        message: `Per ${config.pronoun} ${config.parentNoun}. ${memory.trim()}`,
        packaging: {
          paperColor: config.paperColor,
          ribbonColor: config.ribbonColor,
          bowColor: config.bowColor,
          bowType: "rosette",
          openAnimation: "lift",
          sound: "chime",
        },
        contentType: "message",
        contentText: memory.trim(),
        template_type: config.templateType,
        template_data: templateData,
      };
      const res = await fetchAuthed("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?next=${encodeURIComponent(`${config.landingPath}/crea`)}`);
          return;
        }
        setError(data.message || data.error || "Errore nella creazione. Riprova.");
        return;
      }
      track("gift_created", {
        occasion: config.key === "mother" ? "mothers_day" : "fathers_day",
        content_type: "template",
        template: config.templateType,
      });
      router.push(`${data.url || `/gift/${data.id}`}?from=create`);
    } catch (e) {
      console.error("[parent-letter] submit failed", e);
      setError("Errore di rete. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${config.paletteBg} 0%, #fff 240px)`, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 3,
                background: i <= step ? config.paletteAccent : "#e0d0c8",
                transition: "background .3s",
              }}
            />
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 6 }}>
            Passo {step + 1} di {totalSteps}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: DEEP, margin: 0, letterSpacing: "-.5px", lineHeight: 1.2 }}>
            {STEPS[step]}
          </h1>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginBottom: 18, minHeight: 200 }}>
          {step === 0 && (
            <>
              <Label>Nome di {config.parentNoun}</Label>
              <Input
                placeholder={config.key === "mother" ? "Es. Maria, Mamma, La mia mamma…" : "Es. Marco, Papà, Il mio papà…"}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={40}
                autoFocus
              />
              <Hint>Apparirà nella dedica del regalo. Puoi usare anche soprannomi.</Hint>
              <div style={{ marginTop: 18 }}>
                <Label>Da chi (opzionale)</Label>
                <Input
                  placeholder={config.key === "mother" ? "Es. Marta, La tua bambina…" : "Es. Marco, Tuo figlio…"}
                  value={senderAlias}
                  onChange={(e) => setSenderAlias(e.target.value)}
                  maxLength={40}
                />
                <Hint>Se lo lasci vuoto useremo il tuo username.</Hint>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Input
                placeholder={config.wordSuggestions[wordSuggestionIdx]}
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={20}
                autoFocus
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  fontStyle: "italic",
                  fontFamily: "Georgia, serif",
                  color: config.paletteAccent,
                  textAlign: "center",
                  padding: "16px 14px",
                }}
              />
              <Hint center>
                Una sola parola. Diventerà il titolo grande del regalo aperto.
              </Hint>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {config.wordSuggestions.slice(0, 6).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWord(w)}
                    style={{
                      background: word === w ? config.paletteAccent : "transparent",
                      color: word === w ? "#fff" : MUTED,
                      border: `1.5px solid ${word === w ? config.paletteAccent : BORDER}`,
                      borderRadius: 20,
                      padding: "6px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Textarea
                placeholder={config.memoryPlaceholder}
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                maxLength={400}
                rows={5}
                autoFocus
              />
              <Hint>Non serve sia un ricordo importante. Anche solo un odore, una frase, un pomeriggio.</Hint>
              <CharCount value={memory.length} max={400} />
            </>
          )}

          {step === 3 && (
            <>
              {!photoUrl ? (
                <label style={{
                  display: "block",
                  border: `2px dashed ${BORDER}`,
                  borderRadius: 14,
                  padding: "32px 20px",
                  textAlign: "center",
                  background: LIGHT,
                  cursor: "pointer",
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  <div style={{ fontSize: 36, marginBottom: 10 }} aria-hidden>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DEEP, marginBottom: 4 }}>
                    {photoUploading ? "Caricamento…" : "Tocca per scegliere una foto"}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>
                    Una foto vostra. Diventerà una polaroid leggermente ruotata.
                  </div>
                </label>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    display: "inline-block",
                    padding: 8,
                    background: "#fff",
                    border: "8px solid #fff",
                    boxShadow: "0 6px 20px rgba(0,0,0,.12)",
                    transform: "rotate(-3deg)",
                  }}>
                    <img src={photoUrl} alt="" style={{ display: "block", width: 200, height: 200, objectFit: "cover" }}/>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button onClick={() => setPhotoUrl("")} style={{ background: "transparent", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                      Cambia foto
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Textarea
                placeholder={config.lessonPlaceholder}
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                maxLength={300}
                rows={4}
                autoFocus
              />
              <Hint>Cosa hai imparato da {config.pronoun} {config.parentNoun} senza che te lo dicesse esplicitamente. Una sola frase.</Hint>
              <CharCount value={lesson.length} max={300} />
            </>
          )}

          {step === 5 && (
            <>
              {/* Step canzone — riga 318 originaria sostituita 2026-04-27.
                  La mail di campagna prometteva "basta scrivere il nome,
                  la cerchiamo noi": adesso e' vero, SongPicker chiama
                  /api/spotify/search e mostra risultati cliccabili. Per
                  chi ha gia' un URL, c'e' il link "Preferisci incollare
                  un URL?" che apre l'input libero classico. Quando
                  Spotify non e' configurato (env mancanti, errore 503)
                  il componente fa graceful fallback a input URL. */}
              <SongPicker
                value={songUrl}
                onChange={setSongUrl}
                hint="Cerca la canzone per titolo o artista — la trovi e basta. Diventerà un player dentro il regalo."
              />
            </>
          )}

          {step === 6 && (
            <>
              <Input
                placeholder="https://… o carica un PDF"
                value={voucherUrl}
                onChange={(e) => setVoucherUrl(e.target.value)}
                autoFocus
                inputMode="url"
              />
              <Hint>Cena, esperienza, biglietti. Trasforma il regalo emotivo in qualcosa anche di pratico.</Hint>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 16, fontStyle: "italic" }}>
                Puoi anche saltare questo passo: il regalo emozionale funziona benissimo da solo.
              </p>
            </>
          )}

          {step === 7 && (
            <Preview
              recipient={recipientName}
              word={word}
              memory={memory}
              photoUrl={photoUrl}
              lesson={lesson}
              songUrl={songUrl}
              voucherUrl={voucherUrl}
              accent={config.paletteAccent}
              bg={config.paletteBg}
            />
          )}
        </div>

        {error && (
          <div style={{ background: "#fff0f0", color: ERR_RED, border: `1px solid #f5c6c6`, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button onClick={prev} style={{ flex: "0 0 auto", background: "transparent", color: MUTED, border: `1.5px solid ${BORDER}`, borderRadius: 40, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ← Indietro
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              onClick={next}
              disabled={!canAdvance}
              style={{
                flex: 1,
                background: canAdvance ? ACCENT : "#e0d0c8",
                color: "#fff", border: "none", borderRadius: 40,
                padding: "13px 24px", fontSize: 15, fontWeight: 800,
                cursor: canAdvance ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {stepIsEmpty ? "Salta →" : "Avanti →"}
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                flex: 1,
                background: ACCENT,
                color: "#fff", border: "none", borderRadius: 40,
                padding: "13px 24px", fontSize: 15, fontWeight: 800,
                cursor: submitting ? "wait" : "pointer",
                opacity: submitting ? 0.7 : 1,
                boxShadow: "0 8px 22px rgba(212,83,126,.35)",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "Creazione…" : `${config.emoji} Crea il regalo`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
      {children}
    </div>
  );
}
function Hint({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 8, textAlign: center ? "center" : "left" }}>
      {children}
    </div>
  );
}
function CharCount({ value, max }: { value: number; max: number }) {
  return <div style={{ fontSize: 11, color: "#aaa", textAlign: "right", marginTop: 4 }}>{value}/{max}</div>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "13px 15px", fontSize: 15,
        border: `1.5px solid ${BORDER}`, borderRadius: 11,
        outline: "none", boxSizing: "border-box", background: "#fff",
        color: DEEP, fontFamily: "inherit",
        ...(props.style || {}),
      }}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%", padding: "13px 15px", fontSize: 15,
        border: `1.5px solid ${BORDER}`, borderRadius: 11,
        outline: "none", boxSizing: "border-box", background: "#fff",
        color: DEEP, fontFamily: "inherit", resize: "vertical", lineHeight: 1.5,
        ...(props.style || {}),
      }}
    />
  );
}
function Preview({
  recipient, word, memory, photoUrl, lesson, songUrl, voucherUrl, accent, bg,
}: {
  recipient: string; word: string; memory: string;
  photoUrl: string; lesson: string; songUrl: string; voucherUrl: string;
  accent: string; bg: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
        Anteprima di quello che vedrà <b style={{ color: DEEP }}>{recipient || "lui/lei"}</b>:
      </div>
      <div style={{ background: bg, borderRadius: 16, padding: 20, textAlign: "center" }}>
        {word && (
          <div style={{
            fontSize: 36, color: accent, fontWeight: 700,
            fontStyle: "italic", fontFamily: "Georgia, serif",
            margin: "0 0 14px",
          }}>
            "{word}"
          </div>
        )}
        {photoUrl && (
          <div style={{
            display: "inline-block", padding: 6, background: "#fff",
            border: "6px solid #fff", boxShadow: "0 6px 16px rgba(0,0,0,.1)",
            transform: "rotate(-3deg)", margin: "0 0 14px",
          }}>
            <img src={photoUrl} alt="" style={{ display: "block", width: 140, height: 140, objectFit: "cover" }}/>
          </div>
        )}
        {memory && (
          <p style={{ fontSize: 13, color: DEEP, fontStyle: "italic", lineHeight: 1.5, margin: "0 0 10px" }}>
            "{memory}"
          </p>
        )}
        {lesson && (
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: "10px 0 0" }}>
            <i>Quello che mi hai insegnato:</i><br/>{lesson}
          </p>
        )}
        {songUrl && <div style={{ marginTop: 14, fontSize: 11, color: MUTED }}>♪ Una canzone allegata</div>}
        {voucherUrl && <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>🎁 Voucher allegato</div>}
      </div>
    </div>
  );
}
