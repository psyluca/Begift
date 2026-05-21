# Support Concierge Agent — Build Plan

**Data**: 2026-05-17
**Owner**: Luca + Claude
**Priorità**: Primo agente AI da implementare (riprioritizzato dopo feedback Luca)
**Effort stimato**: 12-18h spread su 5-7 giorni
**OpEx stimato**: €5-15/mese su <200 chat/mese

---

## Mission del Concierge

Un chatbot AI inline su BeGift che:

1. **Risponde** in italiano caldo, breve, accurato a domande utenti su come usare BeGift
2. **Risolve** i 5-7 problemi più frequenti senza chiamare Luca
3. **Sblocca** utenti bloccati nei flow (forward mail, pagamento esperienze, packaging)
4. **Escala** a Luca via email quando non sa rispondere, con contesto chat completo
5. **Impara** da ogni interazione (logging Q&A → futura RAG migliorata)

**Filosofia di tono**: meno bot, più amico esperto. "Ciao, posso aiutarti? Dimmi cosa ti blocca." — niente "Sono l'assistente virtuale di BeGift, come posso esserle utile?"

---

## Architettura tecnica

### Stack scelto

- **Frontend**: React component `<SupportConcierge />` montato in `app/layout.tsx` (sempre visibile, FAB in basso a destra)
- **Backend**: API route `/api/support/chat` (POST con history + new message)
- **LLM**: Anthropic Claude **Sonnet 4** (non Haiku — meglio per ragionamento + tono naturale italiano)
- **Storage**: tabella `support_chats` (cronologia per audit + improvement)
- **RAG leggero**: prompt-engineered con KB inline (no vector DB per ora — overkill)
- **Escalation**: email via Resend (sistema esistente) a Luca + label "concierge-escalation"

### Schema DB

```sql
CREATE TABLE public.support_chats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL,           -- identifica una conversazione (sessionStorage browser)
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- null se anon
  role          text NOT NULL,           -- 'user' | 'assistant' | 'system'
  content       text NOT NULL,
  metadata      jsonb,                   -- url della pagina, browser, ecc.
  escalated     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_chats_session ON public.support_chats(session_id, created_at);
CREATE INDEX idx_support_chats_user ON public.support_chats(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_support_chats_escalated ON public.support_chats(escalated, created_at) WHERE escalated = true;

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
-- service_role only (no public access — privacy chat)

GRANT SELECT, INSERT ON public.support_chats TO service_role;
```

### Endpoint `/api/support/chat`

Pattern simile a `/api/draft/[id]/complete`:

```typescript
POST /api/support/chat
Body: {
  session_id: string,           // generato client-side, salvato in sessionStorage
  message: string,              // nuovo messaggio user
  context: {
    current_url: string,        // "/draft/abc-123" — aiuta Claude a sapere DOVE è bloccato
    user_id?: string,           // null se anon
    history_last_n: 10,         // ultime 10 turn (gia' caricate dal client)
  }
}
Response: {
  reply: string,                // testo risposta
  escalate: boolean,            // true se serve umano
  actions?: [                   // azioni suggerite (es. link cliccabili)
    { type: "link", label: string, href: string }
  ]
}
```

### System prompt

Prompt-engineered con conoscenza BeGift inline. ~2000 token fissi.

```
Sei "Aiuto BeGift", l'assistente di BeGift. Aiuti utenti italiani a 
usare l'app, risolvere problemi, capire come funziona.

REGOLE TONO:
- Italiano colloquiale, caldo, mai formale ("ciao", non "buongiorno")
- Brevita': max 2-3 frasi per risposta
- Niente "Sono un assistente virtuale" — sei "aiuto BeGift", parli come 
  un membro del team
- Niente disclaimer non necessari ("non sono un esperto", ecc.)
- Se non sai una cosa: di' "Lascio una nota a Luca, ti scrive entro 24h"

REGOLE AZIONE:
- Suggerisci sempre il prossimo step concreto (link cliccabile o azione)
- Quando l'utente e' su una pagina specifica (context.current_url),
  riferisciti a quella pagina specificamente
- Se l'utente e' chiaramente bloccato (es. "non funziona" 2x), 
  ESCALA: rispondi "Ho aperto una nota a Luca, ti scrivera' entro 24h 
  con la soluzione" e setta escalate=true

CONOSCENZA BEGIFT:
[KB inline — vedi sotto]

CASI CHE SAI GESTIRE COMPLETAMENTE:
1. "Come funziona BeGift?"
2. "Ho inoltrato una mail, dove la vedo?" → /drafts
3. "Posso cambiare il destinatario?" → si', /gift/[id]/edit
4. "Come funzionano le esperienze?" → /discover + flusso pay-first
5. "Come configuro il forwarding mail?" → /settings#email-parser
6. "Posso usare BeGift senza account?" → si' per ricevere, no per inviare
7. "Quanto costa BeGift?" → gratis durante il lancio
8. "Come faccio a personalizzare il pacchetto?" → /gift/[id]/edit
9. "Il regalo e' arrivato a destinazione?" → controlla /dashboard
10. "Posso usare BeGift in azienda?" → escalare a Luca per B2B

CASI DA ESCALARE:
- Pagamenti, rimborsi (BeGift e' gratis, l'utente sta parlando di GYG)
- Bug specifici riproducibili
- Domande legali/privacy specifiche
- Richieste B2B / partnership
- Lamentele su contenuto (CSAM, abuso, ecc.)

OUTPUT FORMAT:
Rispondi sempre con questo JSON pulito (no markdown wrapper):
{
  "reply": "testo della risposta",
  "escalate": false,
  "actions": [
    { "type": "link", "label": "Apri impostazioni", "href": "/settings" }
  ]
}
```

### Knowledge Base inline (≈800 token)

Inietta nel prompt una sezione `[KB]` con i fatti BeGift:

```
[KB BeGift v1 — aggiornato 2026-05-17]

PRODOTTO:
- BeGift: PWA per creare regali emozionali digitali
- 3 modalita': /create (manuale), email parser (forward conferma), /discover (catalogo esperienze)
- Free per gli utenti, monetizzazione affiliate

FLUSSO EMAIL PARSER:
- Indirizzo da copiare: inbox@plans.begift.app
- Attivazione: Settings → toggle "Inoltro mail"
- Mail supportate: TicketOne, Booking, Smartbox, GetYourGuide
- Tempo parsing: ~10 secondi
- Le bozze appaiono in /drafts

FLUSSO ESPERIENZE:
- /discover mostra catalogo
- Click esperienza → /experiences/[id]
- Bottone "Acquista su GYG" → vai a partner per pagare
- Dopo pagamento, mail di conferma → forward a inbox@plans.begift.app
- Drafts processato → /drafts → personalizzi → invii

FLUSSO PACKAGING:
- /gift/[id]/edit: scelta colori carta, fiocco, animazione, suono
- 6 preset rapidi disponibili
- Custom: color picker + pill row per ogni dimensione
- Save → /gift/[id] per condividere link

BUG NOTI / DOMANDE FREQUENTI:
- "Mail forwardata e niente draft" → controllare opt-in settings
- "Click esperienza non porta a GYG" → product ID placeholder (in update)
- "Foto cantante mancante" → YouTube fallback richiede pochi secondi
- "Pagina mi butta su login" → fix fatto, hard refresh
```

---

## UI component `<SupportConcierge />`

### Stato e mounting

- Floating Action Button (FAB) in basso a destra, sempre visibile
- Icona "💬" o simile, color brand (rosa BeGift)
- Click → apre pannello chat 380x520px (mobile: fullscreen sliding)
- Mantiene `session_id` in `sessionStorage` (no localStorage per privacy)
- Storia ultime 10 turn in memoria, persistita in DB

### Layout pannello

```
┌──────────────────────────────┐
│ ✨ Aiuto BeGift         ✕   │  ← header
├──────────────────────────────┤
│                              │
│ Ciao! Sono qui per aiutarti. │  ← welcome msg
│ Cosa ti serve sapere?        │
│                              │
│ ┌──────────────────────────┐ │
│ │ Come funziona?           │ │  ← quick replies
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Forward mail non parte   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Personalizzare il pacco  │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│ [input]              [Invia] │  ← input field
└──────────────────────────────┘
```

### Quick replies (3 sempre presenti)

Aprono direttamente una domanda nel campo input, l'utente clicca "Invia". Riduce friction di "non so cosa chiedere".

1. "Come funziona BeGift?"
2. "Ho inoltrato una mail, dove la vedo?"
3. "Come personalizzo il pacco?"

### Stato visivo

- **In attesa risposta**: bubble Claude con 3 puntini animati
- **Errore rete**: "Ops, riprova fra un secondo" + retry
- **Escalation**: bubble speciale con "✉️ Ho aperto una nota a Luca, ti rispondera' entro 24h. Intanto puoi continuare a chattare con me se vuoi"
- **Action buttons**: dopo certi reply, mostra bottoni cliccabili (link interni con `Link` component)

---

## Escalation flow

Quando il Concierge non sa rispondere (escalate=true):

1. Insert riga `support_chats` con `escalated=true`
2. Mail a Luca via Resend (subject: "🆘 Concierge escalation — [user_id o anon]"):
   ```
   Sessione: [link a /admin/support/[session_id]]
   Utente: [email o "anonimo" se non loggato]
   Pagina dove era bloccato: [current_url]
   
   Cronologia chat:
   [user] Come faccio a...
   [assistant] Lascio una nota a Luca...
   ```
3. Dashboard admin (futuro): `/admin/support` mostra escalation pending

### Threshold escalation automatica

Concierge escala se:
- L'utente scrive "non funziona" / "broken" / "errore" 2 volte di seguito
- L'utente chiede esplicitamente "voglio parlare con un umano"
- Concierge non e' sicuro al >70% della risposta (auto-judgement nel prompt)
- L'utente menziona richieste B2B, partnership, rimborsi, lamentele legali

---

## File da creare/modificare

```
NEW  supabase/migrations/024_support_chats.sql       (tabella + indici + RLS)
NEW  app/api/support/chat/route.ts                   (endpoint POST)
NEW  app/api/support/escalate/route.ts               (POST: invia mail Resend)
NEW  components/SupportConcierge/                    (cartella component)
     ├── index.tsx                                   (FAB + panel)
     ├── ChatBubble.tsx                              (singolo messaggio)
     ├── QuickReplies.tsx                            (3 bottoni iniziali)
     └── EscalationBanner.tsx                        (UI escalation success)
NEW  lib/support/system-prompt.ts                    (prompt + KB inline)
NEW  lib/support/knowledge-base.ts                   (KB strutturata)
MOD  app/layout.tsx                                  (mount FAB se feature flag on)
```

**Feature flag**: `NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE=true` per attivare. Inizia con false in prod, attiva quando vuoi testare.

---

## Build steps (effort breakdown)

### Step 1 — Migration + endpoint base (3h)
- 024_support_chats.sql con schema + GRANT
- /api/support/chat/route.ts che accetta POST, chiama Claude, salva chat in DB
- System prompt + KB inline in 2 file separati

### Step 2 — UI component base (4h)
- FAB + pannello apertura/chiusura
- Chat history visualization
- Input + submit
- Loading states + error handling
- Mobile responsive (fullscreen su <768px)

### Step 3 — Quick replies + welcome msg (1h)
- 3 quick reply buttons al primo apri
- Messaggio benvenuto contestuale (es. se utente e' su /drafts: "Stai aspettando una bozza?")

### Step 4 — Escalation flow (2h)
- /api/support/escalate/route.ts con Resend
- Template mail con cronologia chat
- UI escalation banner success

### Step 5 — Test + tuning prompt (2h)
- Test 10 scenari comuni
- Tweaks prompt finche' risposte sono brevi/calde
- Verifica escalation triggers funzionano

### Step 6 — Plausible event tracking (1h)
- `concierge_opened`, `concierge_message_sent`, `concierge_escalated`
- Track quick reply clicks per capire cosa cliccano

### Step 7 — Dashboard admin minimale (3h, opzionale Fase 2)
- `/admin/support` per Luca: lista chat ultime, filtro escalation
- Read-only, niente "rispondi dalla dashboard" (Luca risponde via email)

---

## Budget Anthropic stimato

- Sonnet 4: ~$3/M input token, ~$15/M output token
- Per chat: ~3000 token input (system + KB + history) + ~200 token output
- Costo per chat: ~$0.012 (≈€0.011)
- Volume stimato fase POC: 5-20 chat/giorno × 30 = 150-600 chat/mese
- **Costo mensile**: €1.65 - €6.60

Per scalare: switchare a Haiku 4.5 per Q&A semplici (~5x più economico), Sonnet solo per casi complessi.

---

## Definition of done (DoD)

- [ ] Feature flag funziona (off → niente FAB, on → FAB visibile)
- [ ] Apri concierge da home, fai 3 domande tipiche → risposte corrette in <3s
- [ ] Trigger escalation con "non funziona x2" → Luca riceve mail
- [ ] Reply contiene azioni cliccabili dove appropriato (es. link a /drafts)
- [ ] Tutto loggato in support_chats table
- [ ] Plausible tracking funziona
- [ ] Mobile: pannello fullscreen, no overflow

---

## Cosa NON faccio in V1

- Streaming responses (Server-Sent Events) — più complesso, basta JSON sync
- Voice input/output
- File upload nel chat
- Multi-language (solo IT per ora — fallback EN se richiesto)
- Vector DB / RAG vero — prompt inline basta per BeGift attuale
- Dashboard admin completa — endpoint API basta, UI viene dopo

---

## Quando Luca dovrebbe dare il "via"

1. Decisione sì → Sonnet 4 vs alternative (vedi 1.2 sopra)
2. Conferma OK per env var `NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE` (default off)
3. Aggiungere `ANTHROPIC_API_KEY` se non ancora abbastanza per +€10/mese di Sonnet calls

Risposta semplice: "fallo" o "modifica X". Io implemento nelle 12-18h totali distribuite.
