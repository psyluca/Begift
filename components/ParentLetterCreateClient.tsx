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
import { type ParentTemplateConfig, localizeParentConfig } from "@/lib/parent-templates";
import { SongPicker, type SpotifyTrack } from "@/components/SongPicker";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#fafaf7";
const BORDER = "#e0dbd5";
const ERR_RED = "#B71C1C";

interface Props {
  config: ParentTemplateConfig;
}

/** Versione del formato draft localStorage. Se in futuro cambia
 *  la shape del template (es. nuovi step, rinomina campi), incrementa
 *  questo numero per invalidare draft vecchi e non confondere utenti. */
const DRAFT_VERSION = 1;

interface SongMeta {
  name: string;
  artists: string;
  imageUrl: string | null;
}

interface DraftPayload {
  v: number;
  step: number;
  recipientName: string;
  senderAlias: string;
  word: string;
  memory: string;
  photoUrl: string;
  lesson: string;
  songUrl: string;
  songMeta: SongMeta | null;
  voucherUrl: string;
  /** Timestamp ultimo save, per mostrare "salvato 3 minuti fa". */
  savedAt: number;
}

function draftKey(templateKey: string): string {
  return `parent_letter_draft_${templateKey}`;
}

function loadDraft(templateKey: string): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(templateKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.v !== DRAFT_VERSION) return null;
    // Skip draft "vuoti" (nessun campo significativo riempito)
    const hasContent = parsed.recipientName || parsed.word || parsed.memory || parsed.photoUrl;
    if (!hasContent) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(templateKey: string, data: Omit<DraftPayload, "v" | "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: DraftPayload = { ...data, v: DRAFT_VERSION, savedAt: Date.now() };
    localStorage.setItem(draftKey(templateKey), JSON.stringify(payload));
  } catch { /* quota exceeded o storage bloccato — skip */ }
}

function clearDraft(templateKey: string) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(draftKey(templateKey)); } catch { /* ignore */ }
}

function buildRelativeTime(t: (k: string, p?: Record<string, string>) => string) {
  return (savedAt: number): string => {
    const diff = Date.now() - savedAt;
    const min = Math.floor(diff / 60_000);
    if (min < 1) return t("parent_letter.rt_seconds_ago");
    if (min < 60) return t(min === 1 ? "parent_letter.rt_minutes_one" : "parent_letter.rt_minutes_other", { n: String(min) });
    const hr = Math.floor(min / 60);
    if (hr < 24) return t(hr === 1 ? "parent_letter.rt_hours_one" : "parent_letter.rt_hours_other", { n: String(hr) });
    const days = Math.floor(hr / 24);
    return t(days === 1 ? "parent_letter.rt_days_one" : "parent_letter.rt_days_other", { n: String(days) });
  };
}

export function ParentLetterCreateClient({ config: rawConfig }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const config = localizeParentConfig(rawConfig, t);
  const relativeTime = buildRelativeTime(t);
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
  // Tempo trascorso dall'inizio dell'upload foto, in secondi.
  // Aggiornato ogni 250ms da un setInterval. Mostriamo "Caricamento da 4s…"
  // per evitare la sensazione di "freeze" su connessioni lente. Supabase
  // SDK non espone progress events nativi, quindi questo e' il miglior
  // feedback senza riscrivere l'upload con XHR.
  const [photoUploadElapsed, setPhotoUploadElapsed] = useState(0);
  const [wordInputFocused, setWordInputFocused] = useState(false);
  const [lesson, setLesson] = useState("");
  const [songUrl, setSongUrl] = useState("");
  // Metadata della canzone selezionata via SongPicker. Riempito dal
  // callback onPickTrack; persiste nel draft localStorage cosi' la
  // resume mostra ancora il nome canzone nel preview step 7. Resetto
  // a null se songUrl viene svuotato (clear o draft cleared).
  const [songMeta, setSongMeta] = useState<SongMeta | null>(null);
  const [voucherUrl, setVoucherUrl] = useState("");

  useEffect(() => {
    // Se l'utente svuota songUrl (clearSelection nel SongPicker o
    // cancella il draft), pulisce anche songMeta. Evita preview
    // step 7 con metadata "fantasma" senza URL associato.
    if (!songUrl) setSongMeta(null);
  }, [songUrl]);

  // Draft persistence: il banner "Riprendi" appare al mount se trovo
  // un draft con contenuto. Resta visibile finche' l'utente non sceglie
  // (Riprendi / Ricomincia). Se sceglie Riprendi, ripopolo gli state.
  // Se Ricomincia, pulisco localStorage e il banner sparisce.
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  // Flag che indica se l'utente ha gia' deciso cosa fare col draft.
  // Finche' false, blocchiamo l'auto-save (altrimenti risalveremmo
  // sovrascrivendo subito il draft caricato che ancora deve essere
  // visualizzato dall'utente).
  const [draftDecided, setDraftDecided] = useState(false);

  useEffect(() => {
    const draft = loadDraft(config.key);
    if (draft) {
      setPendingDraft(draft);
    } else {
      setDraftDecided(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save su ogni cambio significativo, debounced 600ms per non
  // sfondare di scritture localStorage durante la digitazione.
  useEffect(() => {
    if (!draftDecided) return;
    if (submitting) return;
    // Skip save se l'utente non ha ancora messo niente (draft vuoto =
    // niente da ripristinare → evita pollution di localStorage).
    if (!recipientName && !word && !memory && !photoUrl) return;
    const t = setTimeout(() => {
      saveDraft(config.key, {
        step, recipientName, senderAlias, word, memory,
        photoUrl, lesson, songUrl, songMeta, voucherUrl,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [draftDecided, submitting, step, recipientName, senderAlias, word, memory, photoUrl, lesson, songUrl, songMeta, voucherUrl, config.key]);

  const resumeDraft = () => {
    if (!pendingDraft) return;
    setStep(pendingDraft.step);
    setRecipientName(pendingDraft.recipientName);
    setSenderAlias(pendingDraft.senderAlias);
    setWord(pendingDraft.word);
    setMemory(pendingDraft.memory);
    setPhotoUrl(pendingDraft.photoUrl);
    setLesson(pendingDraft.lesson);
    setSongUrl(pendingDraft.songUrl);
    setSongMeta(pendingDraft.songMeta ?? null);
    setVoucherUrl(pendingDraft.voucherUrl);
    setPendingDraft(null);
    setDraftDecided(true);
  };

  const discardDraft = () => {
    clearDraft(config.key);
    setPendingDraft(null);
    setDraftDecided(true);
  };

  const [wordSuggestionIdx, setWordSuggestionIdx] = useState(0);
  useEffect(() => {
    if (step !== 1 || word) return;
    // Pause se l'utente ha focus sull'input — sta pensando o per
    // scrivere, distrarlo con placeholder che cambiano e' fastidioso.
    if (wordInputFocused) return;
    // 4500ms (era 2200): da feedback test, 2.2s era troppo veloce per
    // leggere e decidere. 4.5s da' tempo di considerare la parola
    // suggerita prima che cambi.
    const t = setInterval(() => {
      setWordSuggestionIdx((i) => (i + 1) % config.wordSuggestions.length);
    }, 4500);
    return () => clearInterval(t);
  }, [step, word, wordInputFocused, config.wordSuggestions.length]);

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
    setPhotoUploadElapsed(0);
    const started = Date.now();
    const tick = setInterval(() => {
      setPhotoUploadElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    try {
      const url = await upload(file, "gift-media");
      if (url) setPhotoUrl(url);
    } catch (e) {
      console.error("[parent-letter] photo upload failed", e);
      setError(t("parent_letter.err_photo_upload"));
    } finally {
      clearInterval(tick);
      setPhotoUploading(false);
      setPhotoUploadElapsed(0);
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
      const baseBody = {
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
        contentType: "message" as const,
        contentText: memory.trim(),
      };
      const body = {
        ...baseBody,
        template_type: config.templateType,
        template_data: templateData,
      };
      const res = await fetchAuthed("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        track("gift_created", {
          occasion: config.key === "mother" ? "mothers_day" : "fathers_day",
          content_type: "template",
          template: config.templateType,
        });
        clearDraft(config.key);
        router.push(`${data.url || `/gift/${data.id}`}?from=create`);
        return;
      }

      // Auth scaduta → login
      if (res.status === 401) {
        router.push(`/auth/login?next=${encodeURIComponent(`${config.landingPath}/crea`)}`);
        return;
      }

      // Kill switch operativo (env var BEGIFT_DISABLE_CREATE=on su Vercel)
      if (res.status === 503) {
        const friendly = (data as { message?: string }).message
          || t("parent_letter.err_maintenance");
        setError(friendly);
        return;
      }

      // Rate limit raggiunto (20 gift/giorno)
      if (res.status === 429) {
        const friendly = (data as { message?: string }).message
          || t("parent_letter.err_rate_limit");
        setError(friendly);
        return;
      }

      const detail = (data as { error?: string; message?: string }).error
        || (data as { message?: string }).message
        || t("parent_letter.err_http", { status: String(res.status) });
      console.error("[parent-letter] submit failed", res.status, data);

      // Heuristica: se l'errore matcha "template_type/template_data
      // column does not exist" (migration 013 non ancora eseguita su
      // un ambiente), riprovo SENZA quei campi. Il regalo parte come
      // gift "message" semplice — perde il rendering speciale ma
      // arriva comunque al destinatario. Stesso pattern di
      // CreateGiftClient con extra_media (commit aa8ce79).
      const colMissing = /template_(type|data)/i.test(detail) && /column|does not exist|schema/i.test(detail);
      if (colMissing) {
        console.warn("[parent-letter] template columns missing → retry without template payload");
        const retry = await fetchAuthed("/api/gifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseBody),
        });
        const retryData = await retry.json().catch(() => ({}));
        if (retry.ok) {
          track("gift_created", {
            occasion: config.key === "mother" ? "mothers_day" : "fathers_day",
            content_type: "template",
            template: `${config.templateType}_fallback`,
          });
          clearDraft(config.key);
          // Avviso non blocking: il regalo parte ma senza rendering speciale
          alert(t("parent_letter.fallback_warning"));
          router.push(`${retryData.url || `/gift/${retryData.id}`}?from=create`);
          return;
        }
        const retryDetail = (retryData as { error?: string; message?: string }).error
          || (retryData as { message?: string }).message
          || `HTTP ${retry.status}`;
        setError(t("parent_letter.err_create", { detail: retryDetail }));
        return;
      }

      setError(t("parent_letter.err_create", { detail }));
    } catch (e) {
      console.error("[parent-letter] submit exception", e);
      const msg = e instanceof Error ? e.message : t("parent_letter.err_network_default");
      setError(t("parent_letter.err_network", { msg }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${config.paletteBg} 0%, #fff 240px)`, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Banner "Riprendi" — appare se trovo un draft salvato in
            localStorage da una sessione precedente. Resta finche'
            l'utente non sceglie. Salva la friction di "ho ricaricato
            e ho perso tutto". */}
        {pendingDraft && (
          <div style={{
            background: "#fff",
            border: `1.5px solid ${config.paletteAccent}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 18,
            boxShadow: "0 4px 14px rgba(0,0,0,.06)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: DEEP, marginBottom: 4 }}>
              {t("parent_letter.draft_resume_title")}
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>
              {t("parent_letter.draft_saved_at", { time: relativeTime(pendingDraft.savedAt) })}
              {pendingDraft.recipientName && <> · {t("parent_letter.draft_for")} <strong style={{ color: DEEP }}>{pendingDraft.recipientName}</strong></>}
              {pendingDraft.step > 0 && <> · {t("parent_letter.draft_step_progress", { current: String(pendingDraft.step + 1), total: String(totalSteps) })}</>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={resumeDraft}
                style={{
                  flex: 1,
                  background: config.paletteAccent,
                  color: "#fff", border: "none", borderRadius: 30,
                  padding: "10px 16px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t("parent_letter.draft_resume")}
              </button>
              <button
                onClick={discardDraft}
                style={{
                  background: "transparent",
                  color: MUTED, border: `1.5px solid ${BORDER}`, borderRadius: 30,
                  padding: "10px 16px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t("parent_letter.draft_discard")}
              </button>
            </div>
          </div>
        )}

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
            {t("parent_letter.step_progress", { current: String(step + 1), total: String(totalSteps) })}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: DEEP, margin: 0, letterSpacing: "-.5px", lineHeight: 1.2 }}>
            {STEPS[step]}
          </h1>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginBottom: 18, minHeight: 200 }}>
          {step === 0 && (
            <>
              <Label>{t("parent_letter.step0_label_name", { parent: config.parentNoun })}</Label>
              <Input
                placeholder={config.key === "mother" ? t("parent_letter.step0_ph_mother") : t("parent_letter.step0_ph_father")}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={40}
                autoFocus
              />
              <Hint>{t("parent_letter.step0_hint_name")}</Hint>
              <div style={{ marginTop: 18 }}>
                <Label>{t("parent_letter.step0_label_sender")}</Label>
                <Input
                  placeholder={config.key === "mother" ? t("parent_letter.step0_ph_sender_mother") : t("parent_letter.step0_ph_sender_father")}
                  value={senderAlias}
                  onChange={(e) => setSenderAlias(e.target.value)}
                  maxLength={40}
                />
                <Hint>{t("parent_letter.step0_hint_sender")}</Hint>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Input
                placeholder={config.wordSuggestions[wordSuggestionIdx]}
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onFocus={() => setWordInputFocused(true)}
                onBlur={() => setWordInputFocused(false)}
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
                {t("parent_letter.step1_hint")}
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
              <Hint>{t("parent_letter.step2_hint")}</Hint>
              <CharCount value={memory.length} max={400} />
            </>
          )}

          {step === 3 && (
            <>
              {!photoUrl ? (
                photoUploading ? (
                  <div style={{
                    display: "block",
                    border: `2px dashed ${config.paletteAccent}`,
                    borderRadius: 14,
                    padding: "36px 20px",
                    textAlign: "center",
                    background: LIGHT,
                  }}>
                    <style>{`@keyframes plUploadSpin { to { transform: rotate(360deg); } }`}</style>
                    {/* Spinner CSS animato. Supabase SDK non espone progress
                        nativo quindi non possiamo mostrare percentuale,
                        ma diamo feedback "non e' freezato". */}
                    <div style={{
                      width: 44, height: 44,
                      border: `3px solid ${BORDER}`,
                      borderTopColor: config.paletteAccent,
                      borderRadius: "50%",
                      margin: "0 auto 14px",
                      animation: "plUploadSpin 0.9s linear infinite",
                    }} aria-hidden/>
                    <div style={{ fontSize: 14, fontWeight: 700, color: DEEP, marginBottom: 4 }}>
                      {t("parent_letter.step3_uploading")}{photoUploadElapsed >= 3 ? ` · ${photoUploadElapsed}s` : "…"}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                      {photoUploadElapsed < 5
                        ? t("parent_letter.step3_upload_short")
                        : photoUploadElapsed < 15
                        ? t("parent_letter.step3_upload_medium")
                        : t("parent_letter.step3_upload_slow")}
                    </div>
                  </div>
                ) : (
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
                      {t("parent_letter.step3_choose")}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED }}>
                      {t("parent_letter.step3_choose_hint")}
                    </div>
                  </label>
                )
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
                      {t("parent_letter.step3_change_photo")}
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
              <Hint>{t("parent_letter.step4_hint", { pronoun: config.pronoun, parent: config.parentNoun })}</Hint>
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
                onPickTrack={(t: SpotifyTrack) => {
                  // Salviamo i metadata della track scelta cosi' nello
                  // step 7 "Tutto pronto" il preview puo' mostrare
                  // "La cura — Franco Battiato" invece del generico
                  // "♪ Una canzone allegata".
                  setSongMeta({
                    name: t.name,
                    artists: t.artists,
                    imageUrl: t.imageUrl,
                  });
                }}
                hint={t("parent_letter.step5_song_hint")}
              />
            </>
          )}

          {step === 6 && (
            <>
              <Input
                placeholder={t("parent_letter.step6_voucher_ph")}
                value={voucherUrl}
                onChange={(e) => setVoucherUrl(e.target.value)}
                autoFocus
                inputMode="url"
              />
              <Hint>{t("parent_letter.step6_voucher_hint")}</Hint>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 16, fontStyle: "italic" }}>
                {t("parent_letter.step6_voucher_skip")}
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
              songMeta={songMeta}
              voucherUrl={voucherUrl}
              accent={config.paletteAccent}
              bg={config.paletteBg}
              t={t}
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
              {t("parent_letter.btn_back")}
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
              {stepIsEmpty ? t("parent_letter.btn_skip") : t("parent_letter.btn_next")}
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
              {submitting ? t("parent_letter.btn_creating") : t("parent_letter.btn_create", { emoji: config.emoji })}
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
  recipient, word, memory, photoUrl, lesson, songUrl, songMeta, voucherUrl, accent, bg, t,
}: {
  recipient: string; word: string; memory: string;
  photoUrl: string; lesson: string; songUrl: string;
  songMeta: SongMeta | null;
  voucherUrl: string;
  accent: string; bg: string;
  t: (k: string, p?: Record<string, string>) => string;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
        {t("parent_letter.preview_intro")} <b style={{ color: DEEP }}>{recipient || t("parent_letter.preview_intro_default")}</b>:
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
            <i>{t("parent_letter.preview_lesson_label")}</i><br/>{lesson}
          </p>
        )}
        {songUrl && (
          songMeta ? (
            <div style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: `1px solid ${accent}33`,
              borderRadius: 999,
              padding: "5px 12px 5px 5px",
              maxWidth: "100%",
            }}>
              {songMeta.imageUrl ? (
                <img src={songMeta.imageUrl} alt="" style={{ width: 26, height: 26, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}/>
              ) : (
                <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>♪</span>
              )}
              <span style={{ fontSize: 11.5, color: "#3d3d3d", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                <strong style={{ color: "#1a1a1a" }}>{songMeta.name}</strong>
                {songMeta.artists && <span style={{ opacity: 0.7 }}> — {songMeta.artists}</span>}
              </span>
            </div>
          ) : (
            <div style={{ marginTop: 14, fontSize: 11, color: MUTED }}>{t("parent_letter.preview_song_default")}</div>
          )
        )}
        {voucherUrl && <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>{t("parent_letter.preview_voucher_default")}</div>}
      </div>
    </div>
  );
}
