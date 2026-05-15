# Partner Integration Playbook

Dettaglio operativo per integrare i 3 partner affiliate attivi di Luca.

---

## GetYourGuide

### Status
Luca già iscritto come Content Publisher. Email di onboarding ricevuta 2026-05-15 con info su Links e Widgets.

### Modalità integrazione disponibili

#### A. Links (deep links affiliate)
- URL pattern: `https://www.getyourguide.com/{slug}-t{id}?partner_id={PARTNER_ID}&cmp={CAMPAIGN}`
- Esempio: `https://www.getyourguide.com/rome-l33/colosseum-skip-line-t44519?partner_id=BEGIFT&cmp=gift_abc123`
- **Per BeGift**: il modo preferito. Server-side redirect con `cmp` = `gift_id` per attribuzione.

#### B. Widgets JS (NOT consigliato)
- Script embed che mostra cards GYG
- ❌ Rompe il design BeGift (cards loro, non nostre)
- ❌ Non possiamo personalizzare/curare
- ❌ Tracking aggregato, non per-gift

#### C. Partner API (preferred long-term)
- Richiede upgrade da "publisher" a "API partner"
- Permette pull programmatico di esperienze
- Auth: API key (richiesta a partner@getyourguide.com)
- Endpoint base: `https://api.getyourguide.com/1/tours`
- Doc: https://partner.getyourguide.com/en-US/help/api

### Commissioni
- Standard: **8% del valore prenotato** (tipicamente)
- Cookie window: 31 giorni
- Soglia minimo payout: €50
- Pagamenti: mensili, via PayPal o bank transfer

### Setup BeGift
```typescript
// lib/experiences/partners.ts
export const GETYOURGUIDE = {
  slug: "getyourguide",
  affiliate_url_pattern:
    "https://www.getyourguide.com/{slug}-t{external_id}?partner_id=BEGIFT&cmp={gift_id}",
  commission_rate: 0.08,
  cookie_window_days: 31,
};
```

Env var: `GETYOURGUIDE_PARTNER_ID=BEGIFT` (Luca lo trova nella dashboard publisher).

---

## Awin

### Status
Luca iscritto. Awin è un network → ogni merchant ha pattern URL diverso ma il tracking è centralizzato.

### Pattern URL
URL "deep link" Awin: `https://www.awin1.com/cread.php?awinmid={MERCHANT_ID}&awinaffid={AFFILIATE_ID}&clickref={CAMPAIGN}&p={URL_TARGET_ENCODED}`

Esempio per Booking.com via Awin:
```
https://www.awin1.com/cread.php?awinmid=1234&awinaffid=987654&clickref=gift_abc123&p=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fjp%2Fonyado-yuinosho.html
```

### Merchant rilevanti per BeGift gifting

| Merchant | awinmid | Categoria | Commission ~ |
|---|---|---|---|
| Booking.com | (Luca lookup) | Hotel | 4% |
| Smartbox IT | (Luca lookup) | Cofanetti esperienza | 7% |
| Decathlon IT | (Luca lookup) | Outdoor experience gear | 5% |
| Sephora IT | (Luca lookup) | Beauty/wellness | 8-10% |
| Apple IT | (Luca lookup) | Tech gift | 1-2% (basso) |

Luca deve loggarsi su Awin → Programmes → cercare ogni merchant → ottenere `awinmid` + activare programma.

### Commissioni
- Variabili per merchant (Awin dashboard)
- Cookie window: 30 giorni (standard, alcuni 60gg)
- Pagamenti: mensili al raggiungimento €20

### Setup BeGift
```typescript
export const AWIN = {
  slug: "awin",
  affiliate_url_pattern:
    "https://www.awin1.com/cread.php?awinmid={awinmid}&awinaffid={AWIN_AFFILIATE_ID}&clickref={gift_id}&p={encoded_target_url}",
  // commission_rate varia per merchant — store in experience row, non aggregato
};
```

Env vars:
- `AWIN_AFFILIATE_ID=987654` (Luca lo trova in dashboard Awin)

Tabella `experiences.affiliate_url_template` salva l'URL Awin completo per ogni record, generato in fase di setup catalogo.

---

## TradeDoubler

### Status
Luca iscritto. Storicamente forte in EU per merchant non-Awin (Voyage Privé, alcune compagnie aeree, etc.).

### Pattern URL
URL TradeDoubler: `https://clk.tradedoubler.com/click?p={PROGRAM_ID}&a={AFFILIATE_ID}&epi={CAMPAIGN}&url={ENCODED_TARGET}`

### Uso suggerito per BeGift
Come **backup/fallback** per merchant non disponibili su Awin. Tradedoubler ha alcuni partner viaggio premium (Voyage Privé Italia, Eurostar) e brand sportivi outdoor non coperti altrove.

### Setup BeGift
Stesso pattern di Awin, env var `TRADEDOUBLER_AFFILIATE_ID`.

---

## Tracking & Attribution flow

Quando l'utente destinatario clicca "Riscatta" su un gift esperienza:

```
1. Browser → https://begift.app/r/{short_token}
2. BeGift server:
   - Lookup token → trova experience_id, gift_id, partner
   - Genera tracking_id = `${gift_id}_${ts}` (univoco)
   - Log INSERT in experience_clicks (gift_id, experience_id, ip_hash, ua_hash)
   - Costruisce affiliate_url_template → sostituisce {gift_id} con tracking_id
   - HTTP 302 redirect → affiliate URL
3. Partner (es. GetYourGuide):
   - Riceve click con cmp=tracking_id
   - User completa booking
   - 30gg dopo: notifica conversione (webhook o report mensile)
4. BeGift (manuale o cron):
   - Match conversione partner ↔ click log via tracking_id
   - Update gift con flag "redeemed"
   - Notifica sender ("il tuo regalo è stato riscattato!") — feature future
```

### Hash IP/UA per privacy
- Non salviamo IP/UA in chiaro
- Hash SHA-256(salt + IP) per privacy GDPR (vedi memoria DPA Supabase + memoria sui sub-processori)
- Solo per anti-fraud (limit click farm), non per profilazione

---

## Disclosure FTC/EU compliance

Per ogni gift creato con esperienza affiliate, mostriamo a destinatario:

> 🤝 Questa esperienza è offerta tramite **{Partner}**. BeGift può ricevere una piccola commissione sull'acquisto, senza alcun costo aggiuntivo per te. [Privacy & affiliate](...)

Posizionamento: sotto il bottone CTA "Riscatta", non sopra (non vuole distogliere dall'azione).

Sul sito: pagina dedicata `/affiliate-disclosure` con elenco partner.

---

## TODO Luca (per attivare il flusso vendita)

- [ ] Recuperare `GETYOURGUIDE_PARTNER_ID` (dashboard publisher)
- [ ] Email `partner@getyourguide.com` per upgrade ad API access
- [ ] Recuperare `AWIN_AFFILIATE_ID` (dashboard Awin)
- [ ] Activate i 5 merchant rilevanti su Awin (Booking, Smartbox, Decathlon, Sephora, Apple)
- [ ] Recuperare `TRADEDOUBLER_AFFILIATE_ID` (dashboard)
- [ ] Aggiungere env vars su Vercel (Production)
- [ ] Decidere disclosure copy + integrare nel design

Stima 2-3 ore di setup esterno + 0 codice nuovo per Luca.
