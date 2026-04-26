/**
 * Configurazione condivisa dei template "Lettera che cresce" per
 * Festa della Mamma e Festa del Papa'.
 *
 * Pattern: lo stesso questionario emotivo viene riusato per entrambi
 * i genitori, ma testi, palette, packaging e suggerimenti cambiano
 * in modo che ogni template abbia carattere proprio.
 *
 * Aggiungere un nuovo "parent template" (es. festa nonni) significa:
 *   1. nuova entry in PARENT_TEMPLATES con config
 *   2. nuova pagina landing /xxx
 *   3. nuova pagina /xxx/crea che importa il client generico
 */

export type ParentKey = "mother" | "father";

export interface ParentTemplateConfig {
  key: ParentKey;
  /** Nome usato nei placeholder ("mamma", "papà"). */
  parentNoun: string;
  /** Stringa per "tuo/a" — concorda di genere ("la tua mamma", "il tuo papà"). */
  pronoun: string;
  /** Slug per gift.template_type nel DB. */
  templateType: string;
  /** URL della landing pubblica. */
  landingPath: string;
  /** Emoji-tema (decorativo). */
  emoji: string;
  /** Palette principale del packaging. */
  paperColor: string;
  ribbonColor: string;
  bowColor: string;
  /** Colori UI per la pagina (hero / accenti). */
  paletteAccent: string;
  paletteBg: string;
  /** Suggerimenti rotanti per lo step "una parola". */
  wordSuggestions: string[];
  /** Placeholder per lo step "ricordo". */
  memoryPlaceholder: string;
  /** Placeholder per lo step "lezione". */
  lessonPlaceholder: string;
  /** Titoli dei 7 step (UI questionario). */
  stepTitles: string[];
  /** Microcopy del rendering "rivelato". */
  revealCaptions: {
    memoryHeader: string;
    lessonHeader: string;
    songHeader: string;
    voucherCta: string;
    voucherSubtitle: string;
    farewellLine: string; // "Ti voglio bene," o variante
    senderFallback: string; // "il/la tuo/a bambino/a"
  };
}

export const MOTHER_TEMPLATE: ParentTemplateConfig = {
  key: "mother",
  parentNoun: "mamma",
  pronoun: "la tua",
  templateType: "mothers_day_letter",
  landingPath: "/festa-mamma",
  emoji: "💐",
  paperColor: "#F4DCD8",
  ribbonColor: "#D4A340",
  bowColor: "#D4A340",
  paletteAccent: "#D4A340",
  paletteBg: "#F4DCD8",
  wordSuggestions: ["Forte", "Dolce", "Paziente", "Ironica", "Casa", "Coraggio", "Riferimento", "Roccia", "Sorriso", "Saggia"],
  memoryPlaceholder: "Esempio: quel pomeriggio d'agosto sul terrazzo, le pesche tagliate nel piatto azzurro.",
  lessonPlaceholder: "Esempio: che le persone si misurano da come trattano i camerieri.",
  stepTitles: [
    "Per chi è il regalo?",
    "Una parola per descrivere mamma",
    "Il tuo ricordo più nitido con lei",
    "Una foto vostra che ami",
    "Cosa ti ha insegnato senza dirtelo",
    "Una canzone che vi unisce",
    "Vuoi aggiungere un voucher?",
    "Tutto pronto. Conferma e invia",
  ],
  revealCaptions: {
    memoryHeader: "Il mio ricordo più nitido con te",
    lessonHeader: "Quello che mi hai insegnato senza dirmelo",
    songHeader: "♪ La nostra canzone",
    voucherCta: "🎁 Apri il regalo allegato",
    voucherSubtitle: "Un piccolo extra che ho voluto aggiungere",
    farewellLine: "Ti voglio bene,",
    senderFallback: "il/la tuo/a bambino/a",
  },
};

export const FATHER_TEMPLATE: ParentTemplateConfig = {
  key: "father",
  parentNoun: "papà",
  pronoun: "il tuo",
  templateType: "fathers_day_letter",
  landingPath: "/festa-papa",
  emoji: "🌳",
  // Palette piu' calda e "terrosa" per padre — beige caldo + verde
  // bosco + dettagli oro. Distinto dal rosa-cipria di mamma ma stessa
  // famiglia visiva (toni naturali).
  paperColor: "#E8DCC4",
  ribbonColor: "#5C7A4A",
  bowColor: "#5C7A4A",
  paletteAccent: "#5C7A4A",
  paletteBg: "#E8DCC4",
  wordSuggestions: ["Roccia", "Silenzioso", "Riferimento", "Onesto", "Casa", "Forte", "Maestro", "Esempio", "Capitano", "Faro"],
  memoryPlaceholder: "Esempio: quella domenica al lago, mi insegnasti a fare i nodi dell'amaca senza una parola.",
  lessonPlaceholder: "Esempio: che il modo migliore di rispondere a un torto è non rispondere subito.",
  stepTitles: [
    "Per chi è il regalo?",
    "Una parola per descrivere papà",
    "Il tuo ricordo più nitido con lui",
    "Una foto vostra che ami",
    "Cosa ti ha insegnato senza dirtelo",
    "Una canzone che vi unisce",
    "Vuoi aggiungere un voucher?",
    "Tutto pronto. Conferma e invia",
  ],
  revealCaptions: {
    memoryHeader: "Il mio ricordo più nitido con te",
    lessonHeader: "Quello che mi hai insegnato senza dirmelo",
    songHeader: "♪ La nostra canzone",
    voucherCta: "🎁 Apri il regalo allegato",
    voucherSubtitle: "Un piccolo extra che ho voluto aggiungere",
    farewellLine: "Ti voglio bene,",
    senderFallback: "il/la tuo/a bambino/a",
  },
};

export const PARENT_TEMPLATES: Record<ParentKey, ParentTemplateConfig> = {
  mother: MOTHER_TEMPLATE,
  father: FATHER_TEMPLATE,
};

export function templateByType(t: string | null | undefined): ParentTemplateConfig | null {
  if (t === "mothers_day_letter") return MOTHER_TEMPLATE;
  if (t === "fathers_day_letter") return FATHER_TEMPLATE;
  return null;
}
