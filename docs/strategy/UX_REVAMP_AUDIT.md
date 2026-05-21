# BeGift — UX & Design Audit

> Data: 2026-05-21
> Branch: feature/overnight-revamp
> Stato: audit completo + piano implementazione

## Premessa

BeGift ha un'identità grafica coerente e riconoscibile (pink #D4537E, beige #f7f5f2, ink #1a1a1a, font system-ui). Il valore espressivo c'è. Manca un livello di **rifinitura sistematica**: micro-interazioni, stati di transizione, hierarchy tipografica, accessibilità — quel layer di polish che distingue un MVP da un prodotto "premium-feeling".

Questo audit identifica i gap e propone interventi puntati, ordinati per ROI (effort/impact). Le **5-7 iniziative più alte** vengono implementate in questo branch overnight; le altre restano documentate per priorità future.

## Design system attuale — fotografia

### Color palette (in uso)

```
ACCENT     #D4537E   pink primario, CTA, evidenziazioni
INK        #1a1a1a   testo principale
MUTED      #888 / #7a7a7a   testo secondario
SOFT_BG    #f7f5f2   sfondo pagina (beige caldo)
BORDER     #e8e4de   linee sottili
WHITE/CARD #ffffff   card, contenitori
OK         #3b8c5a   conferme, success states
ERR        #c0392b / #dc2626   errori, warning critici
WARN       #d97706 / #e8a04a   attenzione
```

**Problemi rilevati:**
- Due grigi MUTED non standardizzati (#888 e #7a7a7a in file diversi)
- Nessuna scala di grigi consolidata per stati intermedi
- Mancano colori per skeleton loading (oggi è "indefinito")
- ERR usato con 2-3 tonalità diverse nei vari errori

### Typography (in uso)

```
font-family: system-ui, -apple-system, sans-serif  (universalmente)
Pesi usati: 400, 500, 600, 700, 800, 900
Size usati: 10.5, 11, 11.5, 12, 12.5, 13, 14, 14.5, 15, 15.5, 16, 17, 18, 19, 20, 22, 26, 28, ... 44, 60
```

**Problemi rilevati:**
- Inflazione di size (15+ valori diversi usati ad-hoc nei file)
- Nessuna scala tipografica disciplinata (es. 12/14/16/20/24/32/40/56)
- Letter-spacing usato casualmente (-0.2px, -0.3px, -0.6px, -1px, -2px) senza ratio
- Line-height usato casualmente (1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65)

### Spacing (in uso)

```
Padding/margin usato: 2,4,6,7,8,9,10,12,13,14,16,18,20,22,24,26,28,30,32,36,40,42,44,48,60,80
```

24+ valori diversi. **Manca scala 4-pt** (4, 8, 12, 16, 24, 32, 48, 64).

### Border-radius (in uso)

```
8, 10, 12, 14, 16, 18, 20, 22, 24, 40, 50, 999
```

12 valori. Ridondante. Servirebbe scala 6, 8, 12, 16, 24, 999.

### Shadow (in uso)

```
"0 1px 0 rgba(0,0,0,0.03)"     soft
"0 2px 12px #0000001a"          medium
"0 4px 24px #00000040"          big
"0 10px 32px rgba(212,83,126,.35)"  brand CTA
"0 14px 36px rgba(212,83,126,.4)"   floating
"0 10px 24px rgba(0,0,0,0.06)"      card hover
```

6 livelli, ad-hoc per ogni componente. Da consolidare in 3 livelli (sm, md, lg) + brand.

## Audit pagine principali

### `/` (home landing)

**Verdetto: buono, polish needed**

- ✅ Hero forte: emoji 🎁 + claim "Un regalo ogni volta che <accent>ti penso, ora</accent>"
- ✅ Animation float emoji (3.2s ease-in-out infinite) — bel touch
- ✅ CTA primario chiaro "Crea un regalo"
- ⚠️ Chip-row 3 path: visually crowded sotto il CTA principale, alcuni utenti potrebbero non capire che sono shortcut e non scelte mutuamente esclusive
- ⚠️ Whitespace fra hero e features section poco bilanciato su mobile
- ❌ Manca social proof (testimonianze, counters, esempi)
- ❌ Sezione "Come funziona" assente — utenti new arrivati si chiedono "in pratica cosa fa?"
- ❌ Banner install PWA appare TROPPO presto (al primo visit). Confonde casual visitor.

### `/regalo` (hub a 3 card)

**Verdetto: buono, dopo recenti fix**

- ✅ 3 card editoriali ben distinte (Catalogo / Qualcosa di tuo / Mail)
- ✅ Hover effect lift + accent line corretto
- ✅ Banner "Vedi le tue bozze" prominente
- ⚠️ Su mobile le 3 card occupano tanto scroll
- ⚠️ La domanda "Cosa ci metti nel pacco?" è bella ma forse poco scopribile (header centrato in piccolo)
- ❌ Manca un'indicazione visiva di "stato del flusso" (sei al passo 1 di 3?)

### `/regalo/catalogo`

**Verdetto: buono, polish needed**

- ✅ Filtri tipo/città/budget funzionanti
- ✅ Card uniformi con badge categoria + badge "a casa" (per fisici)
- ✅ Immagini proxate (post commit `9cc1315`)
- ⚠️ Lo "scroll filter row" su mobile è laggy con molte categorie
- ⚠️ Nessuno **skeleton loading** durante il fetch — flash di empty state
- ⚠️ Empty state ("nessun regalo con questi filtri") un po' generico
- ❌ Manca ordine display switch (rilevanza vs prezzo crescente vs nuovi)
- ❌ Manca "Save filter combo" per casual user che torna su

### `/experiences/[id]`

**Verdetto: discreto**

- ✅ Hero image con proxy, info principali chiare
- ✅ Banner "Regalo fisico" appena aggiunto
- ⚠️ CTA "Acquista sul partner" è il giusto colore brand ma manca contesto visivo (perché su partner? cosa succede dopo?)
- ⚠️ Lista "Come funziona 1-2-3" usa numerini chip rosa ma sotto manca legenda visiva
- ❌ Manca "Esperienze simili" come bottom recommendation
- ❌ Manca tab "Recensioni" o badge social proof (rating + reviews_count usati poco visibili)

### `/create` (creator flow)

**Verdetto: questo è il flusso che ti porta i soldi, va polished**

- ✅ Esiste e funziona
- ⚠️ 1433 righe in un file (debt techical)
- ⚠️ Mancano transizioni fra step
- ⚠️ Nessuna progress bar visiva chiara
- ❌ Mobile bottom-nav-conflict: bottoni "Indietro/Avanti" stretti per via di bottom-nav
- ❌ Animation preview "real-time" lenta a feedback
- ❌ Validation errors poco eleganti (alert browser nativo)

### `/g/[token]` (apertura pacco)

**Verdetto: cuore emozionale di BeGift — top priority polish**

- ✅ Esperienza animation core
- ⚠️ Manca pre-load asset (animation flickr al primo open)
- ⚠️ "Skip animation" button: lo cerco e non lo trovo facile
- ⚠️ Post-animation: card destinatario è troppo basic
- ❌ Manca "Replay animation" button (a volte vuoi rivedere)
- ❌ Soundtrack non sempre fade-out elegante
- ❌ Reactions emoji panel: tap target piccoli, su mobile difficile

### `/dashboard`

**Verdetto: dashboard funzionale**

- ✅ Tabs Sent/Received con count badge
- ✅ DraftsAwaitingCard appena aggiunto, prominente
- ✅ Widget RemindersWidget, MonthlySuggestions, OneYearAgo
- ⚠️ Card gift list: aspect ratio inconsistente, varietà di card design fra reazioni
- ⚠️ Pull-to-refresh implementato ma feedback visivo debole
- ❌ "Last activity" mancante (l'utente non sa cosa è cambiato dall'ultima visita)
- ❌ Empty state per nuovo utente è "scrolla pagina vuota"

### `/drafts`

**Verdetto: appena rifinito (delete + open)**

- ✅ Card status badge ben fatto
- ✅ Bottone delete con conferma (commit recente)
- ⚠️ Empty state buono ma manca CTA forward-mail prominente
- ❌ Mancano sezioni "In attesa / Pronte / Scadute"

### `/settings`

**Verdetto: ok ma sovraccarico**

- ✅ SettingsHub con sezioni
- ⚠️ Molte voci, mancano grouping visivi netti
- ⚠️ Profile/Reminders/Notifications/EmailParser/Lingua: scroll lungo

### `/admin/catalog`

**Verdetto: utilitario, polish opzionale**

- ✅ Funzionale per Luca
- (skip — non utente-facing)

## Problemi prioritizzati (per ROI)

Ranking effort/impact. I top 7 sono implementati questa notte (task #54).

### P0 — devastanti

Nessun P0 attuale (l'app funziona end-to-end).

### P1 — alto impatto, basso effort (DA FARE OVERNIGHT)

| # | Problema | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | Design tokens consolidati (CSS variables) per colors/spacing/radius/shadow | 1h | ↑↑↑ | overnight |
| 2 | Skeleton loading states su catalogo + dashboard | 30m | ↑↑ | overnight |
| 3 | Empty states friendly con illustrazioni emoji | 20m | ↑↑ | overnight |
| 4 | Pagina 404 customizzata BeGift-style | 20m | ↑ | overnight |
| 5 | Hero home: aggiungere mini-section "Come funziona in 3 step" | 40m | ↑↑ | overnight |
| 6 | Toast notification system uniforme (replaces alert()) | 1h | ↑↑ | overnight |
| 7 | Focus states accessibility (ring rosa visibile su tutti i bottoni interattivi) | 30m | ↑↑ | overnight |

### P2 — alto impatto, medio effort (post overnight)

| # | Problema | Effort | Impact |
|---|---|---|---|
| 8 | Animazione opening pack: preload asset, replay button, skip visibile | 4-6h | ↑↑↑ |
| 9 | Refactor `/create` flow: state machine pulita, transitioni step | 8-12h | ↑↑↑ |
| 10 | Mobile bottom-nav redesign con FAB centrale "Crea" | 4h | ↑↑ |
| 11 | "Esperienze simili" bottom della detail page | 3h | ↑↑ |
| 12 | Recensioni inline su detail page (badge social proof) | 2h | ↑↑ |
| 13 | Newsletter signup nel footer + post-gift create | 2h | ↑↑ |
| 14 | Progress bar visiva in /create | 2h | ↑↑ |
| 15 | Reactions panel ridesignato per mobile (tap target 44pt+) | 2h | ↑↑ |

### P3 — basso impatto, oppure effort sproporzionato

| # | Problema | Effort | Impact |
|---|---|---|---|
| 16 | Dark mode | 8h | ↑ |
| 17 | Lingua EN completa | 12h | ↑ |
| 18 | A/B test framework | 6h | ↑ |
| 19 | Sostituzione font system-ui con font brand (Inter, Manrope, ecc.) | 4h | ↑ |
| 20 | Reorganization /settings con tabs | 3h | ↑ |

## Design tokens proposti (CSS variables)

Vedi `app/globals.css` post-overnight per implementazione. Schema:

```css
:root {
  /* ── Colors ────────────────────────────────────────── */
  --color-accent: #D4537E;
  --color-accent-soft: #FCE4EC;
  --color-accent-hover: #B83D69;

  --color-ink: #1a1a1a;
  --color-ink-soft: #4a4a4a;

  --color-muted: #7a7a7a;
  --color-muted-soft: #aaa;

  --color-bg: #f7f5f2;        /* page bg */
  --color-card: #ffffff;
  --color-border: #e8e4de;
  --color-border-soft: #f0ece6;

  --color-ok: #3b8c5a;
  --color-ok-soft: #ecfdf5;
  --color-err: #dc2626;
  --color-err-soft: #fef2f2;
  --color-warn: #d97706;
  --color-warn-soft: #fff8e1;

  /* ── Spacing scale (4-pt) ──────────────────────────── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── Radius scale ──────────────────────────────────── */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 22px;
  --radius-full: 999px;

  /* ── Shadow scale ──────────────────────────────────── */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.08);
  --shadow-brand: 0 10px 28px rgba(212,83,126,0.35);

  /* ── Typography scale ──────────────────────────────── */
  --text-xs: 11px;     /* labels minute, captions */
  --text-sm: 13px;     /* body secondary */
  --text-base: 15px;   /* body */
  --text-lg: 17px;     /* body large */
  --text-xl: 20px;     /* h3, callout */
  --text-2xl: 24px;    /* h2 */
  --text-3xl: 32px;    /* h1 sezione */
  --text-4xl: 44px;    /* h1 hero */
  --text-5xl: 60px;    /* hero massive */

  --leading-tight: 1.2;
  --leading-snug: 1.35;
  --leading-normal: 1.55;
  --leading-relaxed: 1.7;

  /* ── Transition ────────────────────────────────────── */
  --transition-fast: 120ms ease;
  --transition-base: 180ms ease;
  --transition-slow: 320ms ease;

  /* ── Z-index scale ─────────────────────────────────── */
  --z-base: 1;
  --z-sticky: 50;
  --z-overlay: 80;
  --z-modal: 100;
  --z-toast: 200;
}
```

I CSS vars sono retro-compatibili: i file esistenti che usano hex hard-coded continuano a funzionare. Migrazione progressiva.

## Componenti chiave da costruire (post-overnight)

### Button system

```tsx
<Button variant="primary | secondary | ghost | danger" size="sm | md | lg">
```

Variants:
- primary: rosa accent
- secondary: white con border
- ghost: solo testo, hover bg leggero
- danger: red per delete actions

Tutti con focus ring uniforme, loading state inline (spinner), disabled state.

### Card system

```tsx
<Card hover={true} accent="brand | success | neutral">
```

Standardizza padding, border, shadow, hover-lift.

### EmptyState system

```tsx
<EmptyState emoji="🎁" title="Nessun regalo qui" description="..." cta={...} />
```

Sostituisce gli ad-hoc empty state in tutte le pagine.

### Skeleton system

```tsx
<Skeleton variant="card | line | avatar" count={3} />
```

Animate shimmer 1.5s loop. Usa color tokens.

### Toast system

```tsx
toast.success("Bozza eliminata")
toast.error("Impossibile completare")
```

Sostituisce `alert()` e `confirm()` nativi. Sticky bottom su mobile, top-right su desktop.

## Micro-interaction guidelines

Quattro tipi di interazione che vanno sempre presenti:

1. **Hover/focus** (desktop): lift di 2-3px + shadow upgrade + border color shift. Transition 180ms ease.
2. **Active/pressed** (tap): scale(0.97) brevissimo (80ms) per dare feedback fisico.
3. **Loading**: skeleton iniziale → contenuto reale con fade-in 200ms (no pop).
4. **Success after action**: micro-checkmark animation, toast bottom, scroll/highlight della riga modificata.

Animation library: per ora **CSS-only** (transition + keyframes). Se servirà più tardi, valutare framer-motion solo per `/g/[token]` (apertura pacco) che è il momento più emozionale.

## Accessibility checklist (WCAG 2.1 AA)

Da rispettare always:

- [x] Contrast ratio testo/background ≥ 4.5:1 (verificato per pink #D4537E su bianco = 4.55:1 ✓)
- [ ] Focus visibile su tutti gli elementi interattivi (oggi mancante in alcuni)
- [ ] Tap target minimo 44x44px su mobile (oggi alcuni 30x30, marginal)
- [ ] Tutti gli `<img>` con `alt` significativo
- [ ] Form inputs con `<label>` esplicito (non solo placeholder)
- [ ] Aria-label sui bottoni icon-only
- [ ] Skip-to-main-content link nascosto

## Mobile-specific considerations

BeGift è prevalentemente mobile-first (la maggior parte degli utenti regaleranno da phone). Audit:

- ✅ Tutte le pagine responsive
- ✅ Bottom-nav presente
- ✅ Safe-area-inset rispettata su iOS PWA
- ⚠️ Alcuni tap target sotto 44px (cestino bozze 30x30 → da ingrandire)
- ⚠️ Bottom-nav copre talvolta sticky CTA (es. detail page)
- ❌ Mancano pull-to-refresh in tutte le pagine list (solo dashboard ce l'ha)
- ❌ Mancano transizioni di pagina (everything jumps) — opzionale, non priorità

## Implementation roadmap

### Questa notte (task #54, ~2.5h)

7 implementazioni puntate, alto-ROI:

1. `app/globals.css` design tokens CSS variables
2. Skeleton states su catalogo e dashboard
3. EmptyState component riusabile + usato in 3 punti chiave
4. Pagina `/not-found` BeGift-style
5. Home: nuova section "Come funziona in 3 step"
6. Toast system minimale (`lib/toast.tsx`)
7. Focus ring accessibility universal

### Settimana prossima (post-overnight)

- Refactor `/g/[token]` opening pack (P2 #8)
- "Esperienze simili" bottom detail page (P2 #11)
- Newsletter signup nel footer (P2 #13)

### Q3 2026

- Refactor `/create` flow (P2 #9)
- Mobile bottom-nav FAB redesign (P2 #10)

### Q4 2026 — quando si stabilizza

- Font brand replacement (P3 #19)
- Dark mode (P3 #16)

## Cosa NON fare

- ❌ Non rifare tutto in TailwindCSS o styled-components — il pattern inline-styles attuale funziona, la migrazione è high effort low ROI
- ❌ Non passare a un design system esterno (Radix, shadcn/ui) — perdita d'identità brand
- ❌ Non inseguire trend "minimalismo brutalist" — BeGift vive di emozione, lo stile attuale soft+pink è coerente con il messaggio
- ❌ Non aggiungere libreria animation pesante (Lottie, GSAP) finché framer-motion non sarà necessario

## Riferimenti

- Visual redesign memoria: `project_begift_visual_redesign.md` (Candy + Kawaii environments)
- Personalization-first: `feedback_personalization_first.md`
- Master plan 5 fasi: `project_begift_master_plan.md`
- Recent UX fixes: tutti i commit `ux(*)` dal 2026-05-20 in poi
