/**
 * Smart Gift Picker — algoritmo di matching deterministico.
 *
 * Input: scelte del sender nel flusso /picker
 *   - destinatario (solo per personalizzazione UI, non per scoring)
 *   - interests[]   → mappa N→1 a tag e categorie del catalogo
 *   - occasion      → boost su tag/categorie tematiche
 *   - budgetCents   → fascia massima preferita; oltre = penalità soft
 *
 * Output: lista di esperienze rankate dal punteggio piu' alto al piu'
 * basso. Volutamente NON usiamo ML: il catalogo (≤100 record) e' troppo
 * piccolo. Scoring lineare con pesi configurabili e' piu' debugabile,
 * spiegabile al sender ("perche' mi consigli questo?") e neutro rispetto
 * al partner — voluto: spingere sia GetYourGuide sia VivaTicket via
 * mix-quota anche se uno dei due ha catalogo piu' ricco.
 *
 * Posizionamento strategico: BeGift come "consulente regalo intelligente"
 * vs marketplace. L'utente non vede un catalogo gigante: vede 4 idee
 * curate. Il valore percepito e' nel filtro, non nella quantità.
 */

import type {
  Experience,
  ExperienceCategory,
  ExperienceTag,
  ExperienceWithPartner,
  PartnerSlug,
} from "@/types/experiences";

// ──────────────────────────────────────────────────────────────
// Input types
// ──────────────────────────────────────────────────────────────

/** Interessi mostrati nel picker. Mappati N→1 su tag/categorie reali. */
export type PickerInterest =
  | "music"      // VivaTicket concerti, GYG music venues
  | "food"      // GYG food tours, wine tasting
  | "travel"     // GYG multi-day, tours
  | "culture"    // GYG monumenti, VivaTicket opera/teatro
  | "wellness"  // GYG spa, yoga
  | "sport";    // VivaTicket sport events, GYG outdoor

/** Occasione del regalo. Influenza boost/penalità su categorie. */
export type PickerOccasion =
  | "anniversary"
  | "birthday"
  | "valentine"
  | "graduation"
  | "thanks"
  | "mothers_day"
  | "fathers_day"
  | "just_because";

export interface PickerInput {
  recipientName: string;
  interests: PickerInterest[];
  occasion: PickerOccasion;
  budgetCents: number; // 5000 | 10000 | 20000 tipico, ma libero
}

// ──────────────────────────────────────────────────────────────
// Mapping interest → (categories, tags)
// ──────────────────────────────────────────────────────────────
// Un interesse "esplode" su piu' categorie/tag del catalogo cosi'
// che un'esperienza che ha solo UNO dei tag corrispondenti dia
// comunque un match parziale (= rank piu' alto di una totalmente
// off-topic). Esempio: "music" matcha sia concerti (category music)
// sia tag music su esperienze non-musical-strict.

const INTEREST_CATEGORIES: Record<PickerInterest, ExperienceCategory[]> = {
  music:    ["music", "show"],
  food:     ["food"],
  travel:   ["travel", "outdoor"],
  culture:  ["culture", "show"],
  wellness: ["wellness"],
  // sport interest deve includere category "sport" (partite VivaTicket
  // hanno category="sport"). Bug fix 2026-05-20: prima mappava solo a
  // "outdoor" e i biglietti calcio non comparivano mai. Adesso entrambi.
  sport:    ["sport", "outdoor"],
};

// NB: cast a ExperienceTag[] perche' "culture" e "sport" non sono nel
// type union ufficiale (vedi types/experiences.ts) ma sono PRESENTI
// nei tag del seed VVT — il DB e' text[] senza CHECK constraint, quindi
// accetta qualunque stringa. Allargare il type union sarebbe ideale ma
// per ora ci accontentiamo del cast: l'algoritmo confronta stringhe.
const INTEREST_TAGS: Record<PickerInterest, ExperienceTag[]> = {
  music:    ["music"],
  food:     ["foodie", "wine"],
  travel:   ["multi-day", "full-day", "adventure"],
  // "culture" come tag e' presente nei seed VVT (arena-opera, notre-dame).
  culture:  ["art", "history", "must-see", "culture" as ExperienceTag],
  wellness: ["relax"],
  // "sport" come tag e' presente nei seed VVT (milan-juventus, bologna-fc).
  // Senza questa entry, l'utente che sceglie "sport" non vedeva mai le
  // partite (categoria si', tag no — quindi 0 bonus tag).
  sport:    ["hiking", "adventure", "sea", "mountains", "sport" as ExperienceTag],
};

// ──────────────────────────────────────────────────────────────
// Mapping occasion → boost preferiti
// ──────────────────────────────────────────────────────────────
// Per ogni occasione amplifichiamo alcuni tag emozionali. Es. per
// anniversario boostiamo "romantic" e "date-night"; per laurea
// boostiamo "must-see" e "adventure". Niente filtri rigidi: solo
// preferenze, l'utente non viene mai escluso da una categoria.

const OCCASION_TAG_BOOST: Record<PickerOccasion, ExperienceTag[]> = {
  anniversary:  ["romantic", "date-night", "couples"],
  birthday:     ["must-see", "hands-on", "friends"],
  valentine:    ["romantic", "date-night", "couples"],
  graduation:   ["must-see", "adventure", "friends"],
  thanks:       ["relax", "voucher", "flexible"],
  mothers_day:  ["relax", "art", "history"],
  fathers_day:  ["hands-on", "adventure", "hiking"],
  just_because: ["flexible", "voucher"],
};

// ──────────────────────────────────────────────────────────────
// Pesi scoring
// ──────────────────────────────────────────────────────────────
// Documentati esplicitamente per facilitare tuning. Non spostarli
// senza testare su seed reale: il sistema e' calibrato per dare
// risultati sensati anche con catalogo piccolo (~15 record).

const WEIGHTS = {
  /** Match della categoria sui interessi del sender */
  categoryMatch: 8,
  /** Match di un singolo tag con uno degli interessi */
  tagMatchInterest: 3,
  /** Match di un tag con boost di occasione */
  tagMatchOccasion: 5,
  /** Bonus se il prezzo min e' dentro il budget */
  budgetFit: 4,
  /** Penalità soft per prezzo oltre budget (linearmente fino a -6) */
  budgetOverflowMax: -6,
  /** Bonus popolarità basato su rating × log(reviews) */
  popularityMax: 6,
  /** Bonus stagionalità (estate/inverno match col mese corrente) */
  seasonalityMatch: 2,
  /** Penalità soft sulla rotazione (se nelle ultime N suggestion appena visto) */
  recentlyShownPenalty: -3,
};

// ──────────────────────────────────────────────────────────────
// Scoring di una singola esperienza
// ──────────────────────────────────────────────────────────────

export interface ScoredExperience {
  experience: ExperienceWithPartner;
  score: number;
  /** Spiegazione human-readable del match (debug + UI "perche'") */
  reasons: string[];
}

export function scoreExperience(
  exp: ExperienceWithPartner,
  input: PickerInput,
  ctx: { recentlyShown?: Set<string>; nowDate?: Date } = {}
): ScoredExperience {
  let score = 0;
  const reasons: string[] = [];

  // ── 1) Match categoria su interessi ─────────────────────────
  const matchingInterests: PickerInterest[] = [];
  for (const interest of input.interests) {
    if (INTEREST_CATEGORIES[interest].includes(exp.category)) {
      score += WEIGHTS.categoryMatch;
      matchingInterests.push(interest);
    }
  }
  if (matchingInterests.length > 0) {
    reasons.push(`Categoria ${exp.category} affine a ${matchingInterests.join(", ")}`);
  }

  // ── 2) Match tag su interessi ───────────────────────────────
  const expTagSet = new Set(exp.tags || []);
  let tagInterestHits = 0;
  for (const interest of input.interests) {
    for (const wantTag of INTEREST_TAGS[interest]) {
      if (expTagSet.has(wantTag)) {
        score += WEIGHTS.tagMatchInterest;
        tagInterestHits += 1;
      }
    }
  }
  if (tagInterestHits > 0) {
    reasons.push(`${tagInterestHits} tag in comune con i tuoi interessi`);
  }

  // ── 3) Boost di occasione su tag ────────────────────────────
  const occasionBoost = OCCASION_TAG_BOOST[input.occasion] || [];
  const occasionHits = occasionBoost.filter((t) => expTagSet.has(t));
  if (occasionHits.length > 0) {
    score += WEIGHTS.tagMatchOccasion * occasionHits.length;
    reasons.push(`Adatto per ${humanizeOccasion(input.occasion)}`);
  }

  // ── 4) Budget fit / overflow ────────────────────────────────
  if (exp.price_min_cents != null) {
    if (exp.price_min_cents <= input.budgetCents) {
      score += WEIGHTS.budgetFit;
      reasons.push("Dentro il tuo budget");
    } else {
      // Overflow lineare: 10% sopra budget = -0.6 (~10% del max -6)
      const overflowPct = (exp.price_min_cents - input.budgetCents) / input.budgetCents;
      const penalty = Math.max(WEIGHTS.budgetOverflowMax, -overflowPct * 6);
      score += penalty;
    }
  }

  // ── 5) Popolarità (rating × log reviews) ────────────────────
  if (exp.rating != null && exp.reviews_count > 0) {
    const ratingNorm = Math.max(0, (exp.rating - 3) / 2); // 3→0, 5→1
    const reviewsNorm = Math.min(1, Math.log10(exp.reviews_count) / 4); // 10k+ ~= 1
    const popBoost = ratingNorm * reviewsNorm * WEIGHTS.popularityMax;
    score += popBoost;
    if (popBoost > 2) reasons.push(`Molto apprezzato (★${exp.rating.toFixed(1)})`);
  }

  // ── 6) Stagionalità ─────────────────────────────────────────
  const month = (ctx.nowDate ?? new Date()).getMonth() + 1;
  const isSummer = month >= 5 && month <= 9;
  if (isSummer && expTagSet.has("summer")) {
    score += WEIGHTS.seasonalityMatch;
  } else if (!isSummer && expTagSet.has("winter")) {
    score += WEIGHTS.seasonalityMatch;
  } else if (expTagSet.has("all-season")) {
    score += WEIGHTS.seasonalityMatch / 2;
  }

  // ── 7) Rotation penalty (anti-staleness) ────────────────────
  if (ctx.recentlyShown && ctx.recentlyShown.has(exp.id)) {
    score += WEIGHTS.recentlyShownPenalty;
  }

  return { experience: exp, score, reasons };
}

// ──────────────────────────────────────────────────────────────
// Ranking + mixing partner
// ──────────────────────────────────────────────────────────────

/**
 * Ordina le esperienze per score e applica mix-quota tra partner.
 *
 * Mix-quota: se il top N e' dominato da un solo partner ma esistono
 * candidati dell'altro partner con score >= threshold (= 60% del top
 * score), inserisci almeno 1 candidato dell'altro partner forzando
 * uno swap nell'ultima posizione. Questo garantisce diversita' di
 * partner senza sacrificare troppa pertinenza.
 *
 * Razionale: Luca vuole spingere sia GetYourGuide sia VivaTicket.
 * Se il VVT seed ha 10 record e GYG 5, e tutti i 4 top sono VVT,
 * non vogliamo che GYG sparisca dalla home. Il mix-quota assicura
 * che il sender veda "il meglio di entrambi" anche su catalogo
 * sbilanciato.
 */
export function rankAndMix(
  scored: ScoredExperience[],
  targetCount: number,
  opts: {
    /** Soglia di score (frazione del top) per considerare un candidato del partner under-rappresentato */
    mixThresholdRatio?: number;
  } = {}
): ScoredExperience[] {
  // Soglia abbassata da 0.6 → 0.35 dopo feedback "VivaTicket non si vede".
  // 0.35 = consideriamo un candidato sufficientemente pertinente se il
  // suo score e' almeno il 35% del top. In pratica garantisce che,
  // appena un partner ha QUALCHE pertinenza, appare nei 4 risultati.
  const threshold = opts.mixThresholdRatio ?? 0.35;

  // Ordine base per score desc, tie-break per reviews_count desc
  const sorted = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.experience.reviews_count || 0) - (a.experience.reviews_count || 0);
  });

  if (sorted.length <= targetCount) return sorted;

  const top = sorted.slice(0, targetCount);
  const rest = sorted.slice(targetCount);
  const topScore = top[0]?.score ?? 0;

  // Mix-quota: per ogni partner che NON appare nel top ma ha candidati
  // nel rest con score >= threshold * topScore (default 35%), force-swap
  // l'ultimo elemento del top con il miglior candidato dell'other-partner.
  const partnersInTop = new Set(top.map((s) => s.experience.partner.slug));
  const partnersInPool: PartnerSlug[] = Array.from(
    new Set(scored.map((s) => s.experience.partner.slug as PartnerSlug))
  );

  for (const partner of partnersInPool) {
    if (partnersInTop.has(partner)) continue;
    // Cerco il miglior candidato del partner mancante. Soglia 35% se
    // topScore > 0; se topScore e' <= 0 (utente con criteri vaghi che
    // non scattano nessuna affinita'), accetto QUALSIASI score per
    // garantire varieta'.
    const minScore = topScore > 0 ? threshold * topScore : -Infinity;
    const candidate = rest.find(
      (s) => s.experience.partner.slug === partner && s.score >= minScore
    );
    if (!candidate) continue;
    // Swap: rimuovi l'ultimo del top, push del candidato in fondo.
    // Cosi' il mix e' visibile ma manteniamo i top match in cima.
    top.pop();
    top.push(candidate);
    partnersInTop.add(partner);
  }

  return top;
}

// ──────────────────────────────────────────────────────────────
// Entry point usato dall'API
// ──────────────────────────────────────────────────────────────

/**
 * Score + rank + mix in un solo call. Riceve la lista completa delle
 * esperienze attive (gia' fetched dal DB) e ritorna i top N.
 */
export function pickGifts(
  experiences: ExperienceWithPartner[],
  input: PickerInput,
  ctx: { recentlyShown?: Set<string>; nowDate?: Date; targetCount?: number } = {}
): ScoredExperience[] {
  const targetCount = ctx.targetCount ?? 4;
  const scored = experiences.map((exp) => scoreExperience(exp, input, ctx));
  return rankAndMix(scored, targetCount);
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export function humanizeOccasion(occ: PickerOccasion): string {
  const map: Record<PickerOccasion, string> = {
    anniversary:  "un anniversario",
    birthday:     "un compleanno",
    valentine:    "San Valentino",
    graduation:   "una laurea",
    thanks:       "un grazie",
    mothers_day:  "la Festa della Mamma",
    fathers_day:  "la Festa del Papà",
    just_because: "un pensiero",
  };
  return map[occ] || "un'occasione speciale";
}

/**
 * Filtro grezzo pre-scoring: rimuove esperienze inactive o senza
 * partner. Util quando si vuole pre-filtrare prima di chiamare il
 * scoring (es. limitare il payload del DB query).
 */
export function isPickableExperience(e: Pick<Experience, "active">): boolean {
  return e.active === true;
}
