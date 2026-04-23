"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useUpload } from "@/hooks/useUpload";
import type { Packaging } from "@/types";
import GiftSVG from "@/components/GiftSVG";
import InAppSend from "@/components/InAppSend";
import { AIMessageHelper } from "@/components/AIMessageHelper";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

const DEFAULT_SOUNDS: Record<string, string> = {
  bells: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/339822__inspectorj__hand-bells-cluster.wav",
  magic: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/350352__robinhood76__06741-good-news-magic-ding.wav",
  woosh: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/611475__jwsounddesign__woosh-long-cinematic.wav",
  chime: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/660863__drooler__chime-improper.flac",
  pop:   "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/789793__quatricise__pop-4.wav",
};

function playPreview(id: string, customUrl?: string) {
  if (id === "none") return;
  const url = customUrl || DEFAULT_SOUNDS[id];
  if (url) {
    try { const a = new Audio(url); a.volume = 0.7; a.play().catch(()=>{}); } catch(_) {}
    return;
  }
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const mg = ctx.createGain(); mg.gain.value = 0.5; mg.connect(ctx.destination);
    const now = ctx.currentTime;
    if (id === "bells") {
      [523.25,659.26,783.99,1046.5].forEach((f,i)=>{
        const t=now+i*.1,o=ctx.createOscillator(),g=ctx.createGain();
        o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(0,t);
        g.gain.linearRampToValueAtTime(.2,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+1.2);
        o.connect(g);g.connect(mg);o.start(t);o.stop(t+1.3);
      });
    } else if (id === "magic") {
      [880,1109,1319,1568,1760,2093].forEach((f,i)=>{
        const t=now+i*.07,o=ctx.createOscillator(),g=ctx.createGain();
        o.type="sine";o.frequency.setValueAtTime(f*.5,t);o.frequency.linearRampToValueAtTime(f,t+.05);
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.45);
        o.connect(g);g.connect(mg);o.start(t);o.stop(t+.5);
      });
    } else if (id === "pop") {
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type="sawtooth";o.frequency.setValueAtTime(80,now);o.frequency.exponentialRampToValueAtTime(400,now+.08);
      g.gain.setValueAtTime(.4,now);g.gain.exponentialRampToValueAtTime(.001,now+.18);
      o.connect(g);g.connect(mg);o.start(now);o.stop(now+.2);
      [800,1200,1600].forEach((f,i)=>{
        const t=now+.1+i*.06,wo=ctx.createOscillator(),wg=ctx.createGain();
        wo.type="sine";wo.frequency.setValueAtTime(f,t);wo.frequency.linearRampToValueAtTime(f*1.5,t+.2);
        wg.gain.setValueAtTime(.12,t);wg.gain.exponentialRampToValueAtTime(.001,t+.25);
        wo.connect(wg);wg.connect(mg);wo.start(t);wo.stop(t+.3);
      });
    } else if (id === "woosh") {
      const bl=ctx.sampleRate*.8,wb=ctx.createBuffer(1,bl,ctx.sampleRate);
      const wd=wb.getChannelData(0);for(let i=0;i<bl;i++)wd[i]=(Math.random()*2-1)*Math.sin(i/bl*Math.PI);
      const ws=ctx.createBufferSource();ws.buffer=wb;
      const fi=ctx.createBiquadFilter();fi.type="bandpass";fi.frequency.setValueAtTime(1200,now);fi.frequency.exponentialRampToValueAtTime(200,now+.6);fi.Q.value=1.5;
      const wg=ctx.createGain();wg.gain.setValueAtTime(0,now);wg.gain.linearRampToValueAtTime(.5,now+.1);wg.gain.exponentialRampToValueAtTime(.001,now+.75);
      ws.connect(fi);fi.connect(wg);wg.connect(mg);ws.start(now);
    } else if (id === "chime") {
      [523.25,659.26,783.99,880,1046.5,1174.66].forEach((f,i)=>{
        const t=now+i*.11,o=ctx.createOscillator(),g=ctx.createGain();
        o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(0,t);
        g.gain.linearRampToValueAtTime(.18,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+1.1);
        o.connect(g);g.connect(mg);o.start(t);o.stop(t+1.2);
      });
    } else if (id === "kawaii") {
      // Music-box style melody: C5 E5 G5 A5 G5 E5 C6
      [523.25,659.26,783.99,880,783.99,659.26,1046.5].forEach((f,i)=>{
        const t=now+i*.12,o=ctx.createOscillator(),g=ctx.createGain();
        o.type="sine";o.frequency.value=f;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.55);
        o.connect(g);g.connect(mg);o.start(t);o.stop(t+.6);
        // Sparkle overtone
        const o2=ctx.createOscillator(),g2=ctx.createGain();
        o2.type="sine";o2.frequency.value=f*3;
        g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(.04,t+.01);g2.gain.exponentialRampToValueAtTime(.001,t+.3);
        o2.connect(g2);g2.connect(mg);o2.start(t);o2.stop(t+.35);
      });
    }
  } catch(_) {}
}

const PAPERS  = [{id:"ruby",hex:"#D85A5A"},{id:"rose",hex:"#E8A0A0"},{id:"blush",hex:"#F5C6C6"},{id:"peach",hex:"#F0C090"},{id:"gold",hex:"#E8C84A"},{id:"sage",hex:"#8EC49A"},{id:"teal",hex:"#5DCAA5"},{id:"sky",hex:"#85B7EB"},{id:"cobalt",hex:"#4A6ECC"},{id:"plum",hex:"#9B72CF"},{id:"ebony",hex:"#3a3a3a"},{id:"ivory",hex:"#F8F5ED"}];
const RIBBONS = [{id:"gold",hex:"#E8C84A"},{id:"silver",hex:"#C0C0C0"},{id:"white",hex:"#F8F5ED"},{id:"red",hex:"#D85A5A"},{id:"green",hex:"#3B8C5A"},{id:"navy",hex:"#1A3A6B"},{id:"black",hex:"#2a2a2a"},{id:"pink",hex:"#E8A0BC"}];
const BOWS    = [{id:"classic",label:"Classic"},{id:"star",label:"Star"},{id:"rosette",label:"Rosette"},{id:"simple",label:"Knot"},{id:"pompom",label:"Pom-pom"}];
const ANIMS   = [{id:"lift",label:"Lid lift",desc:"anim_lift"},{id:"unfold",label:"Unwrap",desc:"anim_unwrap"},{id:"explode",label:"Confetti",desc:"anim_confetti"},{id:"spin",label:"Spin",desc:"anim_spin"},{id:"shatter",label:"Shatter",desc:"anim_shatter"}];
const SOUNDS  = [{id:"bells",label:"Jingle bells"},{id:"pop",label:"Party pop"},{id:"magic",label:"Magic"},{id:"woosh",label:"Woosh"},{id:"chime",label:"Chime"},{id:"kawaii",label:"✨ Kawaii"},{id:"none",label:"sound_none"}];
const EMOJIS  = ["❤️","🎁","🎉","🎊","🥳","😍","🤗","😘","💖","💝","✨","🌟","⭐","🌈","🦋","🌸","🌺","🍀","🎂","🎈","🥂","🍾","🎵","🎶","🌙","☀️","🙏","👏","💪","🤩","😊","🥰","💫","🔥","💐","🌹","🎀","🎗️","🏆","👑"];

const THEMES  = [{id:"standard",label:"🎁 Standard"},{id:"easter",label:"🥚 Pasqua"},{id:"graduation",label:"🎓 Laurea"},{id:"birthday",label:"🎂 Compleanno"},{id:"kawaii",label:"✨ Kawaii"}];

const DEFAULT_PKG: Packaging = { paperColor:"#D85A5A",ribbonColor:"#E8C84A",bowColor:"#E8C84A",bowType:"classic",openAnimation:"lift",sound:"bells" };

/**
 * Template per occasioni comuni. Ogni tile applica:
 *  - packaging completo (carta + nastro + fiocco + animazione + suono)
 *  - messaggio starter localizzato (se il campo msg è vuoto)
 * L'utente può sempre ritoccare i colori, cambiare suono, riscrivere
 * il messaggio. "none" è no-op (non tocca niente) per chi vuole
 * libertà totale. La scelta è facoltativa: si può saltare e andare
 * dritti al form. Obiettivo: ridurre il carico cognitivo del
 * first-timer — il 60-70% dei regali cade in 3 occasioni (compleanno,
 * anniversario, San Valentino), avere 1-click per quei casi migliora
 * molto la conversione.
 */
interface OccasionTemplate {
  id: string;
  emoji: string;
  labelKey: string;          // i18n key per l'etichetta
  pkg?: Packaging;           // packaging (assente per "none")
  messageIt: string;         // starter message IT
  messageEn: string;         // starter message EN
  messageJa?: string;        // starter message JA (fallback a IT se omesso)
  messageZh?: string;        // starter message ZH
}
const OCCASIONS: OccasionTemplate[] = [
  {
    id: "birthday", emoji: "🎂", labelKey: "create.occasion_birthday",
    pkg: { paperColor:"#E8C84A", ribbonColor:"#D85A5A", bowColor:"#D85A5A", bowType:"rosette", openAnimation:"explode", sound:"bells" },
    messageIt: "Tanti auguri di buon compleanno! 🎂 Che questa sia una giornata piena di gioia.",
    messageEn: "Happy birthday! 🎂 May today be full of joy.",
    messageJa: "お誕生日おめでとう！🎂 素敵な一日になりますように。",
    messageZh: "生日快乐！🎂 祝你今天充满欢乐。",
  },
  {
    id: "anniversary", emoji: "💍", labelKey: "create.occasion_anniversary",
    pkg: { paperColor:"#E8A0A0", ribbonColor:"#E8C84A", bowColor:"#E8C84A", bowType:"classic", openAnimation:"lift", sound:"chime" },
    messageIt: "Per il nostro anniversario ❤️ Ogni giorno con te è un regalo.",
    messageEn: "Happy anniversary ❤️ Every day with you is a gift.",
    messageJa: "記念日おめでとう ❤️ 毎日があなたと過ごすギフトです。",
    messageZh: "纪念日快乐 ❤️ 与你共度的每一天都是礼物。",
  },
  {
    id: "graduation", emoji: "🎓", labelKey: "create.occasion_graduation",
    pkg: { paperColor:"#1A3A6B", ribbonColor:"#E8C84A", bowColor:"#E8C84A", bowType:"star", openAnimation:"explode", sound:"chime" },
    messageIt: "Congratulazioni per la laurea! 🎓 Il meglio deve ancora venire.",
    messageEn: "Congratulations on your graduation! 🎓 The best is yet to come.",
    messageJa: "卒業おめでとう！🎓 これからの活躍を楽しみにしています。",
    messageZh: "祝贺毕业！🎓 最精彩的还在后头。",
  },
  {
    id: "birth", emoji: "👶", labelKey: "create.occasion_birth",
    pkg: { paperColor:"#F5C6C6", ribbonColor:"#F8F5ED", bowColor:"#F8F5ED", bowType:"pompom", openAnimation:"unfold", sound:"kawaii" },
    messageIt: "Benvenuto/a al mondo! 👶 Tanti auguri ai genitori.",
    messageEn: "Welcome to the world! 👶 Congratulations to the parents.",
    messageJa: "ようこそ世界へ！👶 ご両親にお祝い申し上げます。",
    messageZh: "欢迎来到这个世界！👶 恭喜新手爸妈。",
  },
  {
    id: "valentine", emoji: "❤️", labelKey: "create.occasion_valentine",
    pkg: { paperColor:"#D85A5A", ribbonColor:"#E8A0BC", bowColor:"#E8A0BC", bowType:"rosette", openAnimation:"lift", sound:"chime" },
    messageIt: "Sei il mio tutto ❤️ Buon San Valentino.",
    messageEn: "You are my everything ❤️ Happy Valentine's Day.",
    messageJa: "あなたは私のすべて ❤️ ハッピーバレンタイン。",
    messageZh: "你是我的一切 ❤️ 情人节快乐。",
  },
  {
    id: "christmas", emoji: "🎄", labelKey: "create.occasion_christmas",
    pkg: { paperColor:"#3B8C5A", ribbonColor:"#D85A5A", bowColor:"#E8C84A", bowType:"classic", openAnimation:"unfold", sound:"bells" },
    messageIt: "Buon Natale! 🎄 Che queste feste siano calde e serene.",
    messageEn: "Merry Christmas! 🎄 Wishing you warm and peaceful holidays.",
    messageJa: "メリークリスマス！🎄 温かく穏やかな休日をお過ごしください。",
    messageZh: "圣诞快乐！🎄 愿你度过温暖平静的节日。",
  },
  {
    id: "thanks", emoji: "🙏", labelKey: "create.occasion_thanks",
    pkg: { paperColor:"#8EC49A", ribbonColor:"#E8C84A", bowColor:"#E8C84A", bowType:"simple", openAnimation:"lift", sound:"chime" },
    messageIt: "Grazie di cuore 🙏 Per tutto quello che hai fatto.",
    messageEn: "Thank you from the heart 🙏 For everything you've done.",
    messageJa: "心から感謝しています 🙏 いつもありがとう。",
    messageZh: "衷心感谢 🙏 感谢你所做的一切。",
  },
  {
    id: "none", emoji: "✨", labelKey: "create.occasion_none",
    messageIt: "", messageEn: "",
  },
];

const INP: React.CSSProperties = { width:"100%",padding:"13px 15px",fontSize:15,border:"1.5px solid #e0dbd5",borderRadius:11,outline:"none",boxSizing:"border-box",background:"#fff",color:DEEP,fontFamily:"inherit" };

/**
 * Stili tile "preview card" per step 2 /create. Bordo solido pulito
 * (non più dashed), padding uniforme, preview visuale in cima + label
 * + hint sotto. Il valore è comunicare "cosa otterrai" già prima di
 * selezionare.
 */
const TILE_STYLE: React.CSSProperties = {
  display: "block",
  background: "#fff",
  border: "1.5px solid #e8e4de",
  borderRadius: 16,
  padding: "20px 14px 16px",
  textAlign: "center",
  cursor: "pointer",
  transition: "border-color .14s, transform .14s",
  fontFamily: "inherit",
};
const TILE_STYLE_COMPACT: React.CSSProperties = {
  ...TILE_STYLE,
  padding: "18px 10px 14px",
};
const TILE_LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: DEEP,
  marginBottom: 3,
};
const TILE_HINT: React.CSSProperties = {
  fontSize: 11,
  color: MUTED,
  lineHeight: 1.35,
};
const PREVIEW_WRAP: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 58,
  marginBottom: 10,
};
const PREVIEW_WRAP_SMALL: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 46,
  marginBottom: 8,
};

/** Polaroid rosa ruotata con icona camera — preview per Foto */
function PhotoPreview() {
  return (
    <div style={{
      width: 48, height: 52, background: "#F5C4B3", borderRadius: 6,
      transform: "rotate(-5deg)", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 22, boxShadow: "0 3px 8px rgba(0,0,0,.12)",
      padding: "4px 4px 10px",
      position: "relative",
    }}>
      <div style={{
        width: "100%", height: "100%", background: "#D85A30",
        borderRadius: 3, display: "flex", alignItems: "center",
        justifyContent: "center", color: "#fff", fontSize: 16,
      }}>📷</div>
    </div>
  );
}

/** Card nera con play triangolo — preview per Video */
function VideoPreview() {
  return (
    <div style={{
      width: 62, height: 42, background: "#1a1a1a", borderRadius: 6,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 8px rgba(0,0,0,.18)",
    }}>
      <div style={{
        width: 0, height: 0,
        borderLeft: "12px solid #fff",
        borderTop: "8px solid transparent",
        borderBottom: "8px solid transparent",
        marginLeft: 3,
      }}/>
    </div>
  );
}

/** Documento rosso con label PDF — preview per PDF */
function PdfPreview() {
  return (
    <div style={{
      width: 32, height: 40, background: "#F7C1C1", borderRadius: 3,
      position: "relative", boxShadow: "0 2px 6px rgba(0,0,0,.12)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      paddingBottom: 5,
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: 10, height: 10,
        background: "#E24B4A", clipPath: "polygon(0 0, 100% 100%, 100% 0)",
      }}/>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#501313", letterSpacing: ".04em" }}>PDF</span>
    </div>
  );
}

/** Card blu con emoji link — preview per Link */
function LinkPreview() {
  return (
    <div style={{
      width: 54, height: 36, background: "#B5D4F4", borderRadius: 6,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, boxShadow: "0 2px 6px rgba(0,0,0,.08)",
    }}>
      🔗
    </div>
  );
}

/** Snippet di lettera rosa corsivo — preview per Messaggio */
function MessagePreview() {
  return (
    <div style={{
      width: 56, background: "#FBEAF0", borderRadius: 5,
      padding: "6px 7px", fontSize: 8, fontStyle: "italic",
      color: "#72243E", lineHeight: 1.25, textAlign: "left",
      boxShadow: "0 2px 6px rgba(0,0,0,.06)",
      border: "0.5px solid #F4C0D1",
    }}>
      <div>Cara Marta,</div>
      <div style={{ opacity: 0.5, marginTop: 1 }}>______</div>
      <div style={{ opacity: 0.5 }}>___</div>
    </div>
  );
}

export default function CreateGiftClient({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const [step,    setStep]    = useState(1);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [name,    setName]    = useState("");
  const [senderAlias, setSenderAlias] = useState("");
  const [cType,   setCType]   = useState<string|null>(null);
  const [cUrl,    setCUrl]    = useState("");
  const [cText,   setCText]   = useState("");
  const [cFile,   setCFile]   = useState("");
  const [msg,     setMsg]     = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pkg,     setPkg]     = useState<Packaging>(DEFAULT_PKG);
  const [customSoundUrl, setCustomSoundUrl] = useState<string>("");
  const [customSoundName, setCustomSoundName] = useState<string>("");
  const [customSoundTitle, setCustomSoundTitle] = useState<string>("");
  // Scheduling: "now" = invio immediato, "later" = programmato a scheduledAt
  const [schedMode, setSchedMode] = useState<"now"|"later">("now");
  const [scheduledAt, setScheduledAt] = useState<string>(""); // datetime-local format YYYY-MM-DDTHH:MM
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{id:string;url:string}|null>(null);
  const [copied,  setCopied]  = useState(false);

  // Gift Chain: se arriviamo da un "Ringrazia con un regalo" post-apertura,
  // /create riceve `?recipient={nome}&thankFor={giftId}`. Precompiliamo il
  // destinatario e memorizziamo `thankingName` per mostrare il banner di
  // contesto ("Stai ringraziando Marta con un regalo"). Lo leggiamo dopo
  // il mount per evitare hydration mismatch (SSR non ha window.location).
  const [thankingName, setThankingName] = useState<string>("");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const rec = params.get("recipient");
      if (rec) {
        setName(rec);
        setThankingName(rec);
      }
      // Deep link ?occasion=birthday dalla landing: pre-seleziona
      // direttamente il template. L'utente salta lo step di scelta
      // e parte già col packaging + messaggio starter dell'occasione.
      const occ = params.get("occasion");
      if (occ) {
        const tpl = OCCASIONS.find((o) => o.id === occ);
        if (tpl) {
          // Inline per evitare dipendenza dalla dichiarazione di
          // applyOccasion (che sta sotto nel flusso del componente)
          setOccasion(tpl.id);
          if (tpl.pkg) setPkg(tpl.pkg);
          // Il messaggio non lo pre-compiliamo qui, lo farà l'user
          // quando arriva allo step 3/4 — più pulito
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Pre-fill senderAlias con @handle dell'utente (se impostato):
  // l'utente può comunque sovrascriverlo nel campo (es. "Papà",
  // "Mamma", "Amore mio" per contestualizzare a QUESTO regalo).
  // Prefill solo se il campo è vuoto — non sovrascrivere scelte
  // dell'utente o valori arrivati da query string.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Dynamic import per evitare dipendenze a livello di modulo
        const { fetchAuthed } = await import("@/lib/clientAuth");
        const res = await fetchAuthed("/api/profile/me");
        if (!res.ok) return;
        const p = await res.json();
        if (cancelled) return;
        if (p?.username && !senderAlias) {
          setSenderAlias(`@${p.username}`);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { upload, uploading } = useUpload();

  /**
   * Applica un template occasione: setta packaging e messaggio starter
   * (solo se il messaggio è vuoto — non sovrascriviamo quello che
   * l'utente ha già scritto). Il messaggio è localizzato in base al
   * locale corrente, con fallback IT.
   */
  const applyOccasion = (tpl: OccasionTemplate) => {
    setOccasion(tpl.id);
    if (tpl.pkg) setPkg(tpl.pkg);
    if (!msg.trim()) {
      const localized =
        locale === "en" ? tpl.messageEn :
        locale === "ja" ? (tpl.messageJa || tpl.messageIt) :
        locale === "zh" ? (tpl.messageZh || tpl.messageIt) :
        tpl.messageIt;
      if (localized) setMsg(localized);
    }
  };

  const next = () => setStep(s => s+1);
  const back = () => setStep(s => s-1);
  const isFile = cType==="image"||cType==="video"||cType==="pdf";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await upload(f, "gift-media");
    setCType(type); setCUrl(url); setCFile(f.name); next();
  };

  const updatePackaging = async () => {
    if (!result) return;
    setLoading(true);
    let authHeader: Record<string,string> = {};
    try {
      const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.access_token) authHeader = { "Authorization": `Bearer ${parsed.access_token}` };
      }
    } catch(_) {}
    await fetch(`/api/gifts/${result.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ packaging: {...pkg, ...(customSoundUrl ? {customSoundUrl, customSoundTitle: customSoundTitle||undefined} : {})} }),
    });
    setLoading(false);
    setIsEditing(false);
    setResult(prev => prev ? {...prev} : null);
    setStep(99); // torna alla pagina di condivisione
  };

  const submit = async () => {
    setLoading(true);
    // Leggi token dal localStorage
    let authHeader: Record<string,string> = {};
    try {
      const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.access_token) authHeader = { "Authorization": `Bearer ${parsed.access_token}` };
      }
    } catch(_) {}
    // Quando il tipo contenuto è "message", abbiamo unificato in un
    // solo campo testo (il `msg`). Copiamo msg anche in contentText
    // così il backend riceve il testo principale nel campo atteso.
    const effectiveContentText = cType === "message" ? (cText || msg) : cText;
    // Se l'utente ha scelto "programma invio", converto il valore
    // datetime-local (interpretato come ora locale del browser) in
    // ISO stringa UTC. Il server valida poi che sia nel futuro.
    let scheduledAtIso: string | undefined;
    if (schedMode === "later" && scheduledAt) {
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) scheduledAtIso = d.toISOString();
    }

    const res = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({
        recipientName: name, senderAlias: senderAlias||undefined, message: msg, packaging: {...pkg, ...(customSoundUrl ? {customSoundUrl, customSoundTitle: customSoundTitle||undefined} : {})},
        contentType: cType, contentUrl: cUrl, contentText: effectiveContentText, contentFileName: cFile,
        scheduledAt: scheduledAtIso,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setResult(data); setStep(99); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result!.url).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2400);
  };

  const Sw = ({ label, opts, field }: { label:string; opts:{id:string;hex:string}[]; field:keyof Packaging }) => (
    <div style={{marginBottom:16}}>
      <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{label}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {opts.map(o=><button key={o.id} onClick={()=>setPkg(p=>({...p,[field]:o.hex}))} style={{width:28,height:28,borderRadius:"50%",background:o.hex,cursor:"pointer",border:`${(pkg as any)[field]===o.hex?"3px solid "+DEEP:"2px solid #ccc"}`,transform:(pkg as any)[field]===o.hex?"scale(1.22)":"scale(1)",transition:"transform .12s",outline:"none"}}/>)}
      </div>
    </div>
  );

  // RESULT — gift created
  if (result && step !== 4 && step !== 5) return (
    <main style={{minHeight:"100vh",background:LIGHT,fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",position:"relative"}}>
      {/* Escape hatch — link piccolo in alto a sx per tornare alla
          dashboard anche se BottomNav è nascosta (es. su web desktop
          in certi browser). */}
      <a href="/dashboard" style={{
        position:"absolute", top:16, left:16,
        color:MUTED, fontSize:13, textDecoration:"none",
        fontFamily:"inherit",
      }}>
        ← Dashboard
      </a>
      <div style={{fontSize:64,marginBottom:16}}>🎉</div>
      <h2 style={{fontSize:26,fontWeight:800,color:DEEP,margin:"0 0 8px"}}>Regalo creato!</h2>
      <p style={{color:MUTED,marginBottom:16}}>Condividi il link con <strong style={{color:DEEP}}>{name}</strong></p>

      <div style={{background:"#fff",borderRadius:16,padding:14,maxWidth:480,width:"100%",boxShadow:"0 2px 16px #0000000a",marginBottom:14}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,background:LIGHT,borderRadius:9,padding:"10px 12px",fontSize:13,color:"#555",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{result.url}</div>
          <button onClick={copy} style={{background:copied?"#3CB371":ACCENT,color:"#fff",border:"none",borderRadius:9,padding:"10px 14px",fontSize:13,fontWeight:700,cursor:"pointer",transition:"background .2s",whiteSpace:"nowrap"}}>{copied?t("create.copied"):t("create.copy")}</button>
        </div>
      </div>
      {/* WhatsApp primary CTA — pre-compilato col nome del destinatario
          e URL, è il percorso di distribuzione principale nel mercato
          italiano. Massimo 1-tap share. */}
      <div style={{maxWidth:480,width:"100%",marginBottom:14}}>
        <WhatsAppShareButton giftUrl={result.url} recipientName={name} />
      </div>

      <div style={{maxWidth:480,width:"100%",marginBottom:20}}>
        <InAppSend giftId={result.id}/>
      </div>
      {/* CTA anteprima centrale — usa lo stesso background soft della
          card social-proof landing (rosa pastello), non più pieno nero.
          "Dashboard" rimosso: è già nella BottomNav. */}
      <div style={{display:"flex",justifyContent:"center"}}>
        <a href={result.url + "?from=create"} target="_blank" style={{
          background:"#fff5f8",
          color:ACCENT,
          border:`1.5px solid #f9c8d9`,
          borderRadius:40,
          padding:"13px 28px",
          fontSize:14,
          fontWeight:700,
          textDecoration:"none",
        }}>
          {t("create.preview_gift")}
        </a>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:16}}>
        <button onClick={()=>{setStep(isFile?4:5);setIsEditing(true);}} style={{background:"#f0f4ff",color:"#3B5BDB",border:"2px solid #3B5BDB",borderRadius:40,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          {t("create.edit_packaging")}
        </button>
        <button onClick={()=>{setResult(null);setStep(1);setOccasion(null);setName("");setSenderAlias("");setMsg("");setCType(null);setCUrl("");setCText("");setCFile("");setCustomSoundUrl("");setCustomSoundName("");setCustomSoundTitle("");setPkg(DEFAULT_PKG);}} style={{background:"transparent",color:ACCENT,border:"1.5px solid #f9c8d9",borderRadius:40,padding:"12px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
          {t("create.create_another")}
        </button>
      </div>
    </main>
  );

  return (
    <main style={{minHeight:"100vh",background:LIGHT,fontFamily:"system-ui,sans-serif"}}>
      <style>{`input:focus,textarea:focus{border-color:${ACCENT}!important}.tile:hover{border-color:${ACCENT}!important;background:#fff5f8!important}`}</style>
      {/* Header */}
      <div style={{padding:"17px 24px",borderBottom:"1px solid #ede8e0",background:"#fff",display:"flex",alignItems:"center",gap:14}}>
        <a href="/" style={{fontSize:21,fontWeight:800,color:DEEP,textDecoration:"none"}}>Be<span style={{color:ACCENT}}>Gift</span></a>
        <div style={{flex:1,height:3,background:"#f0ece8",borderRadius:4}}>
          <div style={{width:`${(step/5)*100}%`,height:"100%",background:ACCENT,borderRadius:4,transition:"width .4s"}}/>
        </div>
        <span style={{fontSize:12,color:MUTED}}>Step {step}/5</span>
        {step>1&&<button onClick={back} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button>}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"32px 24px"}}>
        {/* Gift Chain — banner di contesto quando arriviamo da un
            "Ringrazia con un regalo" post-apertura. Visibile su tutti
            gli step finché non si genera il regalo (poi si perde lo
            stato). Se l'utente svuota il nome del destinatario, il
            banner sparisce automaticamente (coerenza visiva). */}
        {thankingName && name && (
          <div style={{
            background: "linear-gradient(135deg, #fff5f8, #ffeef4)",
            border: "1px solid #f9c8d9",
            borderRadius: 16,
            padding: "14px 18px",
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DEEP, marginBottom: 3 }}>
              {t("create.thanking_banner", { name: thankingName })}
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
              {t("create.thanking_hint")}
            </div>
          </div>
        )}

        {/* S1 — name + occasione */}
        {step===1&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>{t("create.step1_title")}</h2>

          {/* Occasion picker: se nessuna scelta, mostra griglia 4x2 di
              template. Se già scelta, mostra badge "preset applicato"
              + link per cambiare. Gli utenti che non vogliono preset
              cliccano "Nessuna occasione" (tile ✨) e vedono comunque
              il form senza modifiche al packaging. */}
          {!occasion ? (
            <div style={{marginBottom:22}}>
              <p style={{fontSize:14,fontWeight:700,color:DEEP,margin:"0 0 4px"}}>{t("create.occasion_title")}</p>
              <p style={{fontSize:12,color:MUTED,margin:"0 0 14px",lineHeight:1.4}}>{t("create.occasion_hint")}</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {OCCASIONS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => applyOccasion(o)}
                    style={{
                      background:"#fff",
                      border:"1.5px solid #e0dbd5",
                      borderRadius:14,
                      padding:"14px 6px",
                      textAlign:"center",
                      cursor:"pointer",
                      transition:"all .14s",
                      fontFamily:"inherit",
                    }}
                    onMouseEnter={(e)=>{(e.currentTarget as HTMLButtonElement).style.borderColor=ACCENT;(e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)";}}
                    onMouseLeave={(e)=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#e0dbd5";(e.currentTarget as HTMLButtonElement).style.transform="translateY(0)";}}
                  >
                    <div style={{fontSize:26,marginBottom:4,lineHeight:1}}>{o.emoji}</div>
                    <div style={{fontSize:11,fontWeight:700,color:DEEP,lineHeight:1.2}}>{t(o.labelKey)}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,
              background:"#fff5f8",border:"1px solid #f9c8d9",borderRadius:14,
              padding:"10px 14px",marginBottom:20,
            }}>
              <div style={{fontSize:13,color:DEEP,fontWeight:600}}>
                <span style={{fontSize:18,marginRight:8}}>{OCCASIONS.find(o=>o.id===occasion)?.emoji}</span>
                {t("create.occasion_applied")}
              </div>
              <button
                onClick={() => setOccasion(null)}
                style={{background:"transparent",border:"none",color:ACCENT,fontSize:12,fontWeight:700,cursor:"pointer",padding:0,fontFamily:"inherit",textDecoration:"underline"}}
              >
                {t("create.occasion_change")}
              </button>
            </div>
          )}

          <p style={{fontSize:13,color:MUTED,margin:"0 0 8px"}}>{t("create.recipient_label")}</p>
          <input
            style={INP}
            placeholder={t("create.recipient_placeholder")}
            value={name}
            onChange={e=>setName(e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
            spellCheck={false}
          />
          <p style={{fontSize:13,color:MUTED,margin:"16px 0 8px"}}>{t("create.sender_label")}</p>
          <input
            style={INP}
            placeholder={t("create.sender_placeholder")}
            value={senderAlias}
            onChange={e=>setSenderAlias(e.target.value)}
            autoComplete="nickname"
            autoCapitalize="words"
            spellCheck={false}
          />
          <button onClick={next} disabled={!name.trim()} style={{display:"block",width:"100%",background:name.trim()?ACCENT:"#e0dbd5",color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:name.trim()?"pointer":"not-allowed",marginTop:14}}>{t("create.continue")}</button>
        </>}

        {/* S2 — content type (direzione B "preview cards") */}
        {step===2&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>{t("create.content_title")}</h2>
          {uploading&&<div style={{textAlign:"center",padding:32,color:MUTED}}><div style={{fontSize:28,marginBottom:8}}>⏳</div>{t("create.uploading_file")}</div>}
          {!uploading&&<>
            {/* Prima riga 2: Foto + Video (upload file grandi) */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:11}}>
              <label className="tile" style={TILE_STYLE}>
                <div style={PREVIEW_WRAP}><PhotoPreview/></div>
                <div style={TILE_LABEL}>{t("create.photo")}</div>
                <div style={TILE_HINT}>{t("create.hint_photo")}</div>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>onFile(e,"image")}/>
              </label>
              <label className="tile" style={TILE_STYLE}>
                <div style={PREVIEW_WRAP}><VideoPreview/></div>
                <div style={TILE_LABEL}>{t("create.video")}</div>
                <div style={TILE_HINT}>{t("create.hint_video")}</div>
                <input type="file" accept="video/*" style={{display:"none"}} onChange={e=>onFile(e,"video")}/>
              </label>
            </div>
            {/* Seconda riga 3: PDF + Link + Messaggio */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11}}>
              <label className="tile" style={TILE_STYLE_COMPACT}>
                <div style={PREVIEW_WRAP_SMALL}><PdfPreview/></div>
                <div style={TILE_LABEL}>PDF</div>
                <div style={TILE_HINT}>{t("create.hint_pdf")}</div>
                <input type="file" accept="application/pdf" style={{display:"none"}} onChange={e=>onFile(e,"pdf")}/>
              </label>
              <button className="tile" onClick={()=>{setCType("link");next();}} style={TILE_STYLE_COMPACT}>
                <div style={PREVIEW_WRAP_SMALL}><LinkPreview/></div>
                <div style={TILE_LABEL}>{t("create.link")}</div>
                <div style={TILE_HINT}>{t("create.hint_link")}</div>
              </button>
              <button className="tile" onClick={()=>{setCType("message");setStep(4);}} style={TILE_STYLE_COMPACT}>
                <div style={PREVIEW_WRAP_SMALL}><MessagePreview/></div>
                <div style={TILE_LABEL}>{t("create.message")}</div>
                <div style={TILE_HINT}>{t("create.hint_message")}</div>
              </button>
            </div>
          </>}
        </>}

        {/* S3 — content input or message */}
        {step===3&&!isFile&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>{cType==="link"?t("create.paste_link"):t("create.write_message")}</h2>
          {cType==="link" ? (
            <div style={{display:"flex",gap:8,alignItems:"stretch"}}>
              <input style={{...INP,flex:1}} placeholder="https://…" value={cUrl} onChange={e=>setCUrl(e.target.value)} autoFocus/>
              <button
                type="button"
                onClick={async () => {
                  // Clipboard API moderno (tutti i browser recenti).
                  // Se non disponibile (iOS Safari <13.4) o permesso negato,
                  // fallback silenzioso — l'utente incolla a mano.
                  try {
                    if (navigator.clipboard?.readText) {
                      const text = await navigator.clipboard.readText();
                      if (text && text.trim()) setCUrl(text.trim());
                    }
                  } catch {
                    // permission denied / unsupported — no-op
                  }
                }}
                aria-label={t("create.paste_clipboard")}
                title={t("create.paste_clipboard")}
                style={{
                  background:"#fff5f8",
                  color:ACCENT,
                  border:`1.5px solid #f9c8d9`,
                  borderRadius:11,
                  padding:"0 14px",
                  fontSize:14,
                  fontWeight:700,
                  cursor:"pointer",
                  fontFamily:"inherit",
                  whiteSpace:"nowrap",
                }}
              >
                📋
              </button>
            </div>
          ) : (
            <div style={{position:"relative"}}>
              <textarea style={{...INP,minHeight:130,resize:"vertical"}} placeholder={t("create.special_placeholder")} value={cText} onChange={e=>setCText(e.target.value)}/>
              <button type="button" onClick={()=>setShowEmoji(p=>!p)} aria-label={t("chat.emoji_picker")} style={{position:"absolute",bottom:6,right:6,background:"none",border:"none",fontSize:20,cursor:"pointer",lineHeight:1,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",padding:0,borderRadius:8}}>😊</button>
              {showEmoji && (
                <div style={{position:"absolute",bottom:48,right:0,background:"#fff",border:"1.5px solid #e0dbd5",borderRadius:16,padding:12,zIndex:50,boxShadow:"0 4px 24px #0000001a",width:280}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {EMOJIS.map(e=>(
                      <button key={e} type="button" onClick={()=>{setCText(p=>p+e);setShowEmoji(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:"4px",borderRadius:8,lineHeight:1}}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button onClick={next} disabled={cType==="link"?!cUrl.trim():!cText.trim()} style={{display:"block",width:"100%",background:ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:14}}>{t("create.continue")}</button>
        </>}
        {step===3&&isFile&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>{t("create.message_title")}</h2>
          <div style={{marginBottom:10}}>
            <AIMessageHelper recipientName={name} senderName={senderAlias} onPick={(text)=>setMsg(text)} />
          </div>
          <div style={{position:"relative"}}>
            <textarea style={{...INP,minHeight:140,resize:"vertical"}} placeholder={t("create.message_placeholder", { name: name || "te" })} value={msg} onChange={e=>setMsg(e.target.value)}/>
            <button type="button" onClick={()=>setShowEmoji(p=>!p)} aria-label={t("chat.emoji_picker")} style={{position:"absolute",bottom:6,right:6,background:"none",border:"none",fontSize:20,cursor:"pointer",lineHeight:1,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",padding:0,borderRadius:8}}>😊</button>
            {showEmoji && (
              <div style={{position:"absolute",bottom:48,right:0,background:"#fff",border:"1.5px solid #e0dbd5",borderRadius:16,padding:12,zIndex:50,boxShadow:"0 4px 24px #0000001a",width:280}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {EMOJIS.map(e=>(
                    <button key={e} type="button" onClick={()=>{setMsg(p=>p+e);setShowEmoji(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:"4px",borderRadius:8,lineHeight:1}}>{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={next} style={{display:"block",width:"100%",background:ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:14}}>{t("create.continue")}</button>
          <button onClick={next} style={{display:"block",width:"100%",background:"none",border:"none",color:MUTED,padding:"10px",fontSize:13,cursor:"pointer",marginTop:4}}>{t("common.skip")}</button>
        </>}

        {/* S4 — message for link/message, packaging for file.
            Per cType="message" il titolo e il placeholder cambiano:
            il messaggio qui È il contenuto principale del regalo,
            non un accompagnamento alla dedica file. */}
        {step===4&&!isFile&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>
            {cType === "message" ? t("create.write_message") : t("create.message_title")}
          </h2>
          <div style={{marginBottom:10}}>
            <AIMessageHelper recipientName={name} senderName={senderAlias} onPick={(text)=>setMsg(text)} />
          </div>
          <div style={{position:"relative"}}>
            <textarea style={{...INP,minHeight:cType==="message"?180:130,resize:"vertical"}} placeholder={t("create.message_placeholder", { name: name || "te" })} value={msg} onChange={e=>setMsg(e.target.value)}/>
            <button type="button" onClick={()=>setShowEmoji(p=>!p)} aria-label={t("chat.emoji_picker")} style={{position:"absolute",bottom:6,right:6,background:"none",border:"none",fontSize:20,cursor:"pointer",lineHeight:1,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",padding:0,borderRadius:8}}>😊</button>
            {showEmoji && (
              <div style={{position:"absolute",bottom:48,right:0,background:"#fff",border:"1.5px solid #e0dbd5",borderRadius:16,padding:12,zIndex:50,boxShadow:"0 4px 24px #0000001a",width:280}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {EMOJIS.map(e=>(
                    <button key={e} type="button" onClick={()=>{setMsg(p=>p+e);setShowEmoji(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:"4px",borderRadius:8,lineHeight:1}}>{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={next} style={{display:"block",width:"100%",background:ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:14}}>{t("create.continue")}</button>
          <button onClick={next} style={{display:"block",width:"100%",background:"none",border:"none",color:MUTED,padding:"10px",fontSize:13,cursor:"pointer",marginTop:4}}>{t("common.skip")}</button>
        </>}
        {step===4&&isFile&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>{t("create.packaging_title")}</h2>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start",justifyContent:"center"}}>
            <div style={{width:152,flexShrink:0,background:"#f0ece8",borderRadius:18,padding:"12px 8px 8px"}}>
              <GiftSVG paper={pkg.paperColor} ribbon={pkg.ribbonColor} bow={pkg.bowColor} bowType={pkg.bowType} animated={true} theme={(pkg as any).theme||"standard"}/>
              <p style={{fontSize:11,color:MUTED,textAlign:"center",margin:"6px 0 0"}}>{t("create.preview")}</p>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <Sw label={t("create.paper")} opts={PAPERS} field="paperColor"/>
              <Sw label={t("create.ribbon")} opts={RIBBONS} field="ribbonColor"/>
              <Sw label={t("create.bow")} opts={RIBBONS} field="bowColor"/>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.bow_type")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{BOWS.map(b=><button key={b.id} onClick={()=>setPkg(p=>({...p,bowType:b.id as any}))} style={{padding:"6px 12px",borderRadius:40,fontSize:12,fontWeight:600,background:pkg.bowType===b.id?DEEP:"#fff",color:pkg.bowType===b.id?"#fff":DEEP,border:`1.5px solid ${pkg.bowType===b.id?DEEP:"#ddd"}`,cursor:"pointer"}}>{b.label}</button>)}</div>
              </div>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.special_edition")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{THEMES.map(t=><button key={t.id} onClick={()=>setPkg(p=>({...p,theme:t.id} as any))} style={{padding:"6px 12px",borderRadius:40,fontSize:12,fontWeight:600,background:(pkg as any).theme===t.id?ACCENT:"#fff",color:(pkg as any).theme===t.id?"#fff":DEEP,border:`1.5px solid ${(pkg as any).theme===t.id?ACCENT:"#ddd"}`,cursor:"pointer"}}>{t.label}</button>)}</div>
              </div>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.animation")}</p>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>{ANIMS.map(a=><button key={a.id} onClick={()=>setPkg(p=>({...p,openAnimation:a.id as any}))} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:pkg.openAnimation===a.id?"#fff5f8":"#fff",border:`1.5px solid ${pkg.openAnimation===a.id?ACCENT:"#e0dbd5"}`,cursor:"pointer",textAlign:"left"}}><div style={{width:7,height:7,borderRadius:"50%",background:pkg.openAnimation===a.id?ACCENT:"#ddd"}}/><div><div style={{fontSize:13,fontWeight:700,color:DEEP}}>{a.label}</div><div style={{fontSize:11,color:MUTED}}>{t("create." + a.desc)}</div></div></button>)}</div>
              </div>
              <div>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.sound")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{SOUNDS.map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:0}}>
                      <button onClick={()=>setPkg(p=>({...p,sound:s.id as any}))} style={{padding:"6px 11px",borderRadius:s.id!=="none"?"40px 0 0 40px":"40px",fontSize:12,fontWeight:600,background:pkg.sound===s.id?DEEP:"#fff",color:pkg.sound===s.id?"#fff":DEEP,border:`1.5px solid ${pkg.sound===s.id?DEEP:"#ddd"}`,cursor:"pointer"}}>{s.id==="none"?t("create.sound_none"):s.label}</button>
                      {s.id!=="none"&&<button onClick={()=>playPreview(s.id)} style={{padding:"6px 8px",borderRadius:"0 40px 40px 0",fontSize:12,background:pkg.sound===s.id?"#444":"#f0ece8",color:pkg.sound===s.id?"#fff":"#888",border:`1.5px solid ${pkg.sound===s.id?DEEP:"#ddd"}`,borderLeft:"none",cursor:"pointer"}}>▶</button>}
                    </div>
                  ))}</div>
                <div>
                  <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.upload_music")}</p>
                  {customSoundName ? (
                    <div style={{background:"#f0faf5",border:"1px solid #b2dfce",borderRadius:12,padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:13,color:"#1a7a4a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🎵 {customSoundName}</span>
                        <button onClick={()=>playPreview("custom",customSoundUrl)} style={{background:"none",border:"none",color:"#1a7a4a",cursor:"pointer",fontSize:14}}>▶</button>
                        <button onClick={()=>{setCustomSoundUrl("");setCustomSoundName("");setCustomSoundTitle("");setPkg(p=>({...p,sound:"bells" as any}));}} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:16}}>×</button>
                      </div>
                      <input type="text" placeholder={t("create.song_title_placeholder")} value={customSoundTitle} onChange={e=>setCustomSoundTitle(e.target.value)} style={{width:"100%",fontSize:12,padding:"6px 10px",border:"1px solid #b2dfce",borderRadius:8,outline:"none",background:"#fff",color:"#1a1a1a",boxSizing:"border-box"}}/>
                    </div>
                  ) : (
                    <label style={{display:"block",background:"#fff",border:"1.5px dashed #d5cfc8",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer"}}>
                      <span style={{fontSize:12,color:MUTED}}>MP3, M4A, WAV (max 10MB)</span>
                      <input type="file" accept="audio/*" style={{display:"none"}} onChange={async e=>{
                        const file=e.target.files?.[0]; if(!file) return;
                        if(file.size>10*1024*1024){alert("File troppo grande (max 10MB)");return;}
                        const url=await upload(file,"gift-media");
                        setCustomSoundUrl(url);
                        setCustomSoundName(file.name);
                        setPkg(p=>({...p,sound:"custom" as any}));
                      }}/>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
          {result && isEditing ? (
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:22}}>
              <button onClick={updatePackaging} disabled={loading} style={{display:"block",width:"100%",background:loading?"#e0dbd5":ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer"}}>{loading?t("create.saving"):t("create.save_changes")}</button>
              <button onClick={()=>{setStep(99);setIsEditing(false);}} style={{display:"block",width:"100%",background:"none",border:"none",color:MUTED,fontSize:13,cursor:"pointer",padding:"8px"}}>{t("create.cancel")}</button>
            </div>
          ) : (
            <button onClick={next} style={{display:"block",width:"100%",background:ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:22}}>{t("create.continue")}</button>
          )}
        </>}

        {/* S5 — packaging for link/message or confirm for file */}
        {step===5&&!isFile&&<>
          <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 20px"}}>{t("create.packaging_title")}</h2>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start",justifyContent:"center",marginBottom:16}}>
            <div style={{width:152,flexShrink:0,background:"#f0ece8",borderRadius:18,padding:"12px 8px 8px"}}>
              <GiftSVG paper={pkg.paperColor} ribbon={pkg.ribbonColor} bow={pkg.bowColor} bowType={pkg.bowType} animated={true} theme={(pkg as any).theme||"standard"}/>
              <p style={{fontSize:11,color:MUTED,textAlign:"center",margin:"6px 0 0"}}>{t("create.preview")}</p>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <Sw label={t("create.paper")} opts={PAPERS} field="paperColor"/>
              <Sw label={t("create.ribbon")} opts={RIBBONS} field="ribbonColor"/>
              <Sw label={t("create.bow")} opts={RIBBONS} field="bowColor"/>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.special_edition")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{THEMES.map(t=><button key={t.id} onClick={()=>setPkg(p=>({...p,theme:t.id} as any))} style={{padding:"6px 12px",borderRadius:40,fontSize:12,fontWeight:600,background:(pkg as any).theme===t.id?ACCENT:"#fff",color:(pkg as any).theme===t.id?"#fff":DEEP,border:`1.5px solid ${(pkg as any).theme===t.id?ACCENT:"#ddd"}`,cursor:"pointer"}}>{t.label}</button>)}</div>
              </div>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.animation")}</p>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>{ANIMS.map(a=><button key={a.id} onClick={()=>setPkg(p=>({...p,openAnimation:a.id as any}))} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:pkg.openAnimation===a.id?"#fff5f8":"#fff",border:`1.5px solid ${pkg.openAnimation===a.id?ACCENT:"#e0dbd5"}`,cursor:"pointer",textAlign:"left"}}><div style={{width:7,height:7,borderRadius:"50%",background:pkg.openAnimation===a.id?ACCENT:"#ddd"}}/><div><div style={{fontSize:13,fontWeight:700,color:DEEP}}>{a.label}</div><div style={{fontSize:11,color:MUTED}}>{t("create." + a.desc)}</div></div></button>)}</div>
              </div>
              <div>
                <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.sound")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{SOUNDS.map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:0}}>
                      <button onClick={()=>setPkg(p=>({...p,sound:s.id as any}))} style={{padding:"6px 11px",borderRadius:s.id!=="none"?"40px 0 0 40px":"40px",fontSize:12,fontWeight:600,background:pkg.sound===s.id?DEEP:"#fff",color:pkg.sound===s.id?"#fff":DEEP,border:`1.5px solid ${pkg.sound===s.id?DEEP:"#ddd"}`,cursor:"pointer"}}>{s.id==="none"?t("create.sound_none"):s.label}</button>
                      {s.id!=="none"&&<button onClick={()=>playPreview(s.id)} style={{padding:"6px 8px",borderRadius:"0 40px 40px 0",fontSize:12,background:pkg.sound===s.id?"#444":"#f0ece8",color:pkg.sound===s.id?"#fff":"#888",border:`1.5px solid ${pkg.sound===s.id?DEEP:"#ddd"}`,borderLeft:"none",cursor:"pointer"}}>▶</button>}
                    </div>
                  ))}</div>
                <div style={{marginTop:8}}>
                  <p style={{fontSize:11,fontWeight:700,color:DEEP,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:".07em"}}>{t("create.upload_music")}</p>
                  {customSoundName ? (
                    <div style={{background:"#f0faf5",border:"1px solid #b2dfce",borderRadius:12,padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:13,color:"#1a7a4a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🎵 {customSoundName}</span>
                        <button onClick={()=>playPreview("custom",customSoundUrl)} style={{background:"none",border:"none",color:"#1a7a4a",cursor:"pointer",fontSize:14}}>▶</button>
                        <button onClick={()=>{setCustomSoundUrl("");setCustomSoundName("");setCustomSoundTitle("");setPkg(p=>({...p,sound:"bells" as any}));}} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:16}}>×</button>
                      </div>
                      <input
                        type="text"
                        placeholder={t("create.song_title_placeholder")}
                        value={customSoundTitle}
                        onChange={e=>setCustomSoundTitle(e.target.value)}
                        style={{width:"100%",fontSize:12,padding:"6px 10px",border:"1px solid #b2dfce",borderRadius:8,outline:"none",background:"#fff",color:"#1a1a1a",boxSizing:"border-box"}}
                      />
                    </div>
                  ) : (
                    <label style={{display:"block",background:"#fff",border:"1.5px dashed #d5cfc8",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer"}}>
                      <span style={{fontSize:12,color:MUTED}}>MP3, M4A, WAV (max 10MB)</span>
                      <input type="file" accept="audio/*" style={{display:"none"}} onChange={async e=>{
                        const file=e.target.files?.[0]; if(!file) return;
                        if(file.size>10*1024*1024){alert("File troppo grande (max 10MB)");return;}
                        const url=await upload(file,"gift-media");
                        setCustomSoundUrl(url);setCustomSoundName(file.name);
                        setPkg(p=>({...p,sound:"custom" as any}));
                      }}/>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
          {result && isEditing ? (
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
              <button onClick={updatePackaging} disabled={loading} style={{display:"block",width:"100%",background:loading?"#e0dbd5":ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer"}}>{loading?t("create.saving"):t("create.save_changes")}</button>
              <button onClick={()=>{setStep(99);setIsEditing(false);}} style={{display:"block",width:"100%",background:"none",border:"none",color:MUTED,fontSize:13,cursor:"pointer",padding:"8px"}}>{t("create.cancel")}</button>
            </div>
          ) : (
            <>
              <ScheduleSection mode={schedMode} setMode={setSchedMode} value={scheduledAt} setValue={setScheduledAt} />
              <button onClick={submit} disabled={loading || (schedMode==="later" && !scheduledAt)} style={{display:"block",width:"100%",background:(loading || (schedMode==="later" && !scheduledAt))?"#e0dbd5":ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginTop:8}}>
                {loading ? t("create.creating") : (schedMode === "later" ? "⏰ Programma regalo" : t("create.create_link"))}
              </button>
            </>
          )}
        </>}
        {step===5&&isFile&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:16}}>🎀</div>
            <h2 style={{fontSize:24,fontWeight:800,color:DEEP,margin:"0 0 10px"}}>{t("create.ready")}</h2>
            <p style={{color:MUTED,marginBottom:24}}>{t("create.gift_ready_for", { name })}</p>
            <ScheduleSection mode={schedMode} setMode={setSchedMode} value={scheduledAt} setValue={setScheduledAt} />
            <button onClick={submit} disabled={loading || (schedMode==="later" && !scheduledAt)} style={{display:"block",width:"100%",background:(loading || (schedMode==="later" && !scheduledAt))?"#e0dbd5":ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"15px",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer"}}>
              {loading ? t("create.creating") : (schedMode === "later" ? "⏰ Programma regalo" : t("create.create_link"))}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * ScheduleSection — toggle + datetime picker per programmare l'invio.
 *
 * - Default "now" = invio immediato (comportamento standard)
 * - "later" = mostra input datetime-local. Il valore è in ora locale del
 *   browser; viene convertito a UTC ISO al submit.
 * - Min set a "now + 1 minuto" per prevenire programmazioni nel passato
 *   o quasi-immediate (l'API accetta solo date > now+30s).
 *
 * Mobile-friendly: l'input datetime-local su iOS/Android usa il picker
 * nativo dell'OS (ruota data + ora). Su desktop è un input standard con
 * spinner.
 */
function ScheduleSection({
  mode,
  setMode,
  value,
  setValue,
}: {
  mode: "now" | "later";
  setMode: (m: "now" | "later") => void;
  value: string;
  setValue: (v: string) => void;
}) {
  const ACCENT = "#D4537E";
  const DEEP = "#1a1a1a";
  const MUTED = "#888";
  const BORDER = "#e0dbd5";

  // Min = ora corrente + 5 minuti, formato YYYY-MM-DDTHH:MM
  const now = new Date(Date.now() + 5 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const minStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div style={{ marginTop: 18, marginBottom: 6, padding: "14px 14px 12px", border: `1px solid ${BORDER}`, borderRadius: 14, background: "#fafaf7" }}>
      <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Quando arriva il regalo
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: mode === "later" ? 10 : 0 }}>
        {([
          { v: "now",   label: "🚀 Invia ora" },
          { v: "later", label: "⏰ Programma" },
        ] as const).map((opt) => {
          const active = mode === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => setMode(opt.v)}
              style={{
                flex: 1,
                background: active ? ACCENT : "#fff",
                border: `1.5px solid ${active ? ACCENT : BORDER}`,
                color: active ? "#fff" : DEEP,
                borderRadius: 12,
                padding: "10px",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {mode === "later" && (
        <>
          {/* Due input separati: date (apre calendario nativo cliccando
              sull'icona o sul campo) + time (spinner ora/minuti). Il
              datetime-local unico non mostrava il calendario su desktop. */}
          <DateTimePair minStr={minStr} value={value} setValue={setValue} />
          {value && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
              Il destinatario vedrà un countdown fino all&apos;arrivo del regalo. Tu potrai monitorarlo dal dashboard.
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * DateTimePair — combina input type=date (col picker calendario nativo)
 * + type=time in una riga, salvando il risultato nel formato
 * datetime-local YYYY-MM-DDTHH:MM che il parent si aspetta.
 */
function DateTimePair({
  minStr,
  value,
  setValue,
}: {
  minStr: string;          // YYYY-MM-DDTHH:MM del min accettato
  value: string;           // YYYY-MM-DDTHH:MM corrente (vuoto se non impostato)
  setValue: (v: string) => void;
}) {
  const DEEP = "#1a1a1a";
  const BORDER = "#e0dbd5";

  // Default ragionevole al primo render: domani alle 9:00
  const [datePart, timePart] = value ? value.split("T") : ["", ""];
  const [minDate, minTime] = minStr.split("T");

  const onDateChange = (d: string) => {
    setValue(d ? `${d}T${timePart || "09:00"}` : "");
  };
  const onTimeChange = (t: string) => {
    setValue(datePart ? `${datePart}T${t || "09:00"}` : "");
  };

  const inputStyle: React.CSSProperties = {
    boxSizing: "border-box",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    padding: "11px 12px",
    fontSize: 14,
    color: DEEP,
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 8 }}>
      <input
        type="date"
        value={datePart}
        min={minDate}
        onChange={(e) => onDateChange(e.target.value)}
        style={inputStyle}
        placeholder="gg/mm/aaaa"
      />
      <input
        type="time"
        value={timePart}
        min={datePart === minDate ? minTime : undefined}
        onChange={(e) => onTimeChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}
