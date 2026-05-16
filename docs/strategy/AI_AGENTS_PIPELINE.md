# BeGift — AI Agents Pipeline

**Data**: 2026-05-16 (notte autonoma)
**Status**: Proposta tecnica, da prioritizzare con Luca
**Contesto**: Luca è founder solo, BeGift deve scalare senza assumere persone. AI agents autonomi possono coprire ruoli che altrimenti richiederebbero stagisti o freelance.

---

## Visione

Invece di 1 founder full-time + €X/mese di freelance, BeGift può funzionare come "founder + N agenti AI specializzati". Ogni agente:
- Gira in autonomia su scheduler (cron Vercel + Anthropic API)
- Ha un dominio specifico (catalog curation, content, support, marketing, ops)
- Loga le sue azioni in un log centralizzato (`agent_runs` tabella DB)
- Notifica Luca via email/Slack solo per decisioni che richiedono umano
- Costa ~€2-10/mese di API call (Claude Haiku per i task semplici, Claude Sonnet per quelli complessi)

**Filosofia**: ogni agente fa una cosa, la fa bene, di notte, e al mattino Luca trova lavoro pronto da approvare/scartare.

---

## I 6 agenti proposti

### Agent 1 — Catalog Curator

**Cosa fa**: ogni notte (cron 02:00), scansiona il catalogo esperienze e propone migliorie:
- Esperienze in scadenza stagionale da disattivare (es. "Festival Pucciniano" a settembre)
- Esperienze stagionali da attivare (es. "Mercatini Natale Bolzano" a novembre)
- Buchi nel catalogo (es. "5 città IT con 0 esperienze food sotto €50")
- Esperienze GYG/Awin nuove e popolari da aggiungere (basato su tabella `experience_clicks` aggregata + ricerca pubblica)

**Output**:
- Tabella `agent_proposals` con righe stato `pending`
- Mail a Luca ogni lunedì con riassunto top 5 proposte
- Luca approva via 1-click in dashboard (route `/admin/agent-proposals/[id]/approve`)

**Tech stack**:
- Cron Vercel `/api/cron/curator-agent` (1x notte)
- Anthropic Claude Sonnet per analisi catalogo + ranking
- Costo stimato: 1 call/notte × ~10K token = ~€0.05/notte = €1.50/mese

**Effort build**: 12-16h

**Value**: catalogo che cresce + sostituisce 4-6h/sett curation manuale

---

### Agent 2 — Content Quality

**Cosa fa**: legge tutte le esperienze del catalogo + i messaggi suggeriti dal parser email, segnala/riscrive quelli sotto-tono.

**Criteri qualità**:
- Descrizione esperienza troppo "tecnica" (es. "Tour di 2 ore con guida" → suggerimento "Una mattinata tra le pietre del Colosseo, con una guida che ti racconta la Roma di Cesare")
- Suggested_message generico (es. "Ti regalo un weekend" → "Ho prenotato per te due notti al San Domenico Palace di Taormina, con vista sull'Etna e l'Egeo")
- Mancanza di dettagli emozionali (data specifica, luogo iconico, dettaglio personalizzato)

**Output**:
- Aggiorna campo `experiences.curator_notes` con suggerimenti
- Riscrive in batch via UPDATE SQL (con flag `quality_reviewed=true` per non riprocessare)
- Notifica solo se riscrive >5 esperienze in una run

**Tech stack**:
- Cron Vercel settimanale
- Anthropic Claude Sonnet per riscrittura emozionale
- Costo: ~€0.30/run × 4 run/mese = €1.20/mese

**Effort build**: 8-12h

**Value**: qualità copy che migliora settimana su settimana senza intervento

---

### Agent 3 — Customer Support Concierge

**Cosa fa**: chatbot inline su BeGift che risponde a:
- "Come funziona BeGift?"
- "Ho inoltrato una mail ma non vedo la draft" → debug + reset
- "Posso cambiare il destinatario di un gift già inviato?" → istruzioni
- "Ho un problema col pagamento su GetYourGuide" → spiega che è esterno + suggerisce contatto GYG
- Tutto il resto → "Apro un ticket a Luca, ti risponde entro 24h"

**Differenza da Intercom/Crisp**: integrato con Claude Sonnet che conosce il sistema BeGift (RAG su docs/help/) → risposte specifiche, non generiche.

**Output**:
- UI: bubble chat in basso a destra su tutte le pagine BeGift
- Tabella `support_chats` con cronologia
- Escalation automatica: se utente dice "non funziona" 2 volte di fila → email a Luca con contesto chat
- Metriche: % risolte vs % escalate (target 80% risolte)

**Tech stack**:
- React component `<SupportConcierge />` in `app/layout.tsx`
- API `/api/support/chat` con Anthropic SDK
- RAG molto leggero: passare al system prompt 3-5 docs principali (FAQ, /per-chi, /forward-mail)
- Costo: dipende da volume, stimato €5-20/mese per <500 conversation

**Effort build**: 16-24h

**Value**: copre 80% delle domande utente senza Luca. Solo le difficili arrivano.

---

### Agent 4 — Marketing Reel Writer

**Cosa fa**: ogni domenica notte genera 3 screenplay per Reel Instagram/TikTok da girare la settimana, basati su:
- Ultime esperienze top-cliccate in catalogo (es. "ha senso pushare il Chianti wine tour ora perché in maggio 2x clic")
- Stagionalità (Festa Mamma, San Valentino, Natale)
- Trend Instagram italiano (da scraping pubblico hashtag #regali, #ideeregalo)

**Output per ogni screenplay** (markdown in `docs/marketing/reels/week-NNN.md`):
- Hook 2 secondi
- 3-5 shot con descrizione visiva (utilizzabile su Sora/Runway per genera video)
- Voiceover script (60-90 parole)
- Caption Instagram + hashtag (max 30)
- CTA finale

**Tech stack**:
- Cron domenicale `/api/cron/reel-writer`
- Anthropic Claude Sonnet con prompt curato
- Output salvato in repo come file MD committabili
- Notifica Luca con summary e link al file

**Effort build**: 12-16h

**Value**: 3 reel pronti a settimana = ~12/mese. Luca registra/genera con Sora-Runway-CapCut in 30 min ciascuno = 6h totali per produrre tutto il content marketing del mese.

---

### Agent 5 — Affiliate Performance Monitor

**Cosa fa**: ogni 6 ore controlla `experience_clicks` e segnala anomalie:
- CTR su /discover sotto threshold (es. < 5% click su impressioni)
- Esperienza con 0 click in 30 giorni → suggerisce cancellazione o rilancio
- Esperienza con spike inatteso click → possibile virale, alert per amplificare via social
- Drop conversion totale settimana su settimana > 20% → alert urgente

**Output**:
- Mail settimanale a Luca con top/flop
- Slack/email alert real-time per anomalie gravi
- Tabella `performance_alerts` per storia

**Tech stack**:
- Cron Vercel 4 volte al giorno
- Query SQL aggregata su `experience_clicks` + `gift_drafts`
- Anthropic Claude Haiku per "spiegare" il dato in linguaggio naturale (rendere intelligibili numeri grezzi)
- Costo: trascurabile, Haiku ~€0.001 per chiamata

**Effort build**: 8-12h

**Value**: Luca non deve guardare Plausible/Supabase tutti i giorni. L'agente lo avvisa quando serve.

---

### Agent 6 — Anti-fraud & Abuse Sentinel

**Cosa fa**: monitora il sistema per pattern sospetti:
- Stessa email forwardata 50 volte in 1h (spam test bot)
- IP che clicca 100+ link affiliate/giorno (click farm)
- Gift creati con messaggi che match pattern abusivi (insulti, spam pubblicitario, CSAM)
- Account che crea 20+ gift/giorno (abuse free tier o test)

**Output**:
- Auto-suspend per pattern chiari (>1000 click/h dallo stesso IP_hash)
- Notifica Luca per pattern incerti
- Log in tabella `security_events` per audit trail

**Tech stack**:
- Cron Vercel ogni ora
- Query SQL su `experience_clicks`, `gift_drafts`, `gifts`
- Anthropic Claude Sonnet per moderazione contenuti (abuse detection nel testo dei messaggi)
- Costo: €5-15/mese a seconda del traffico

**Effort build**: 16-20h (richiede attenzione su falsi positivi)

**Value**: BeGift diventa "trust-by-default" — Luca dorme tranquillo senza temere abuse a sua insaputa. Importante per quando crescerai e attirerai bad actors.

---

## Infrastruttura comune

Tutti gli agenti condividono:

### `agent_runs` table

```sql
CREATE TABLE agent_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name      text NOT NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL,  -- 'running' | 'completed' | 'failed'
  input_summary   jsonb,
  output_summary  jsonb,
  error_message   text,
  tokens_used     integer,
  cost_eur        numeric(8,4)
);
```

### Pattern shared `lib/agents/base.ts`

```typescript
export async function runAgent(
  name: string,
  fn: () => Promise<{summary: object; tokensUsed: number}>
) {
  const startedAt = new Date();
  let status = "running";
  let result: { summary?: object; tokensUsed?: number } = {};
  let errorMessage: string | null = null;
  
  try {
    result = await fn();
    status = "completed";
  } catch (e) {
    status = "failed";
    errorMessage = (e as Error).message;
  }
  
  await supabase.from("agent_runs").insert({
    agent_name: name,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    status,
    output_summary: result.summary || null,
    error_message: errorMessage,
    tokens_used: result.tokensUsed || 0,
    cost_eur: (result.tokensUsed || 0) * 0.000003, // ~Claude Haiku rate
  });
}
```

### Dashboard `/admin/agents` (futuro)

Pagina admin che mostra:
- Ultime 20 run per agent (status, durata, costo)
- Aggregato mensile: ore CPU, € spesi, eventi gestiti
- Bottone "Run now" per debugging

---

## Roadmap pragmatica agenti

**Fase 1 (giu-lug 2026) — fondamenta**
- Agent 5 (Performance Monitor) → first agent, basso rischio, alto valore
- Agent 3 (Support Concierge) → riduce subito il carico email a Luca

**Fase 2 (ago-set 2026) — scaling**
- Agent 1 (Catalog Curator) → catalogo cresce solo
- Agent 4 (Reel Writer) → marketing in autopilot

**Fase 3 (ott-dic 2026) — qualità + sicurezza**
- Agent 2 (Content Quality) → eleva qualità copy
- Agent 6 (Anti-fraud) → diventa necessario quando crescerai

---

## Costo totale stimato

| Agente | Build hours | Costo OpEx/mese |
|---|---|---|
| 1. Catalog Curator | 12-16h | €1.50 |
| 2. Content Quality | 8-12h | €1.20 |
| 3. Support Concierge | 16-24h | €5-20 |
| 4. Reel Writer | 12-16h | €4-8 |
| 5. Performance Monitor | 8-12h | €1 |
| 6. Anti-fraud | 16-20h | €5-15 |
| **TOTALE** | **72-100h** | **€18-46/mese** |

Build 72-100h = 2-3 mesi parttime. OpEx <€50/mese = trascurabile vs revenue B2B atteso.

---

## Confronto con assumere persone

| | 6 Agenti AI | 1 Stagista part-time |
|---|---|---|
| Setup time | 2-3 mesi | 1 settimana |
| Costo/mese | €18-46 + Luca tempo | €600-1200 (lordo) |
| Disponibilità | 24/7 | 20h/sett |
| Mansioni | Solo digitali | Anche umane (call clienti, etc.) |
| Crescita | Codice migliorabile | Difficile sostituire |
| Rischio errore | Falsi positivi gestibili | Errore umano + drama |

**Conclusione**: agenti per task ripetitivi/notturni/scaling. Stagista solo se devi fare sales/relations human-touch.

---

## Cosa farei IO al posto tuo

1. **Settimana 1**: solo Agent 5 (Performance Monitor) — 1 settimana di build, ti dà subito il "polso" del business
2. **Settimana 3-4**: Agent 3 (Support Concierge) — appena hai 50+ utenti veri serve per non annegare nelle mail
3. **Mese 2-3**: tutto il resto, prioritizzando 1 (Catalog) e 4 (Reel) per scaling crescita

Non implementare TUTTI insieme: ogni agente va validato 2 settimane prima di passare al next, altrimenti diventi schiavo del debug AI invece che del prodotto.
