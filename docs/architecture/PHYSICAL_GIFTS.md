# Physical Gifts — Architettura

> Data: 2026-05-21
> Branch: feature/overnight-revamp

## Cos'è

BeGift estende il modello "regalo digitale" (esperienze, biglietti, voucher) per supportare **regali fisici**: oggetti che vengono **spediti al destinatario** dopo l'acquisto sul partner. Primo caso d'uso: **24 Bottles** (borracce in acciaio), seguito potenzialmente da libri, gadget, cofanetti, prodotti gourmet.

## Flusso utente

```
1. Sender naviga catalogo BeGift
2. Vede card "Urban Bottle 500ml" con badge "📦 a casa"
3. Click → pagina detail con banner "Regalo fisico — spedito direttamente
   al destinatario, consegna stimata 4 giorni"
4. Click "Acquista su 24Bottles" → redirect via TradeDoubler affiliate
5. Sender paga su 24bottles.com
6. 24Bottles invia mail conferma ordine al sender
7. Sender inoltra mail a plans@plans.begift.app
8. Email parser estrae: nome bottiglia, immagine prodotto, data spedizione,
   indirizzo consegna
9. BeGift crea draft "regalo fisico"
10. Sender personalizza pacco (messaggio, animazione, musica)
11. Sender invia link al destinatario
12. Destinatario apre pacco → vede animazione + IMMAGINE BOTTIGLIA + 
    "ti arriva a casa entro X giorni"
13. Nei giorni successivi, destinatario riceve la bottiglia fisica per posta
```

Il valore aggiunto di BeGift è il **bridge emozionale** tra l'acquisto e la consegna fisica: chi riceve la bottiglia ha già visto l'animazione, sa cosa sta arrivando, l'attesa è parte dell'esperienza regalo (non un'attesa frustrante).

## Schema DB (migration 028)

`experiences` ha 3 nuove colonne:

| Colonna | Tipo | Default | Note |
|---|---|---|---|
| `is_physical_gift` | bool | false | Flag che attiva il pattern fisico |
| `shipping_estimated_days` | int | NULL | Giorni stimati dal pagamento alla consegna |
| `product_image_url` | text | NULL | URL immagine prodotto su sfondo neutro (per pacco aperto) |

`experience_partners` ha un nuovo slug: `tradedoubler` (network affiliate principale per 24Bottles in IT).

## Componenti già implementati (notte 2026-05-21)

- ✅ Migration 028 con i 3 campi + partner tradedoubler
- ✅ Seed 8 prodotti 24Bottles in `supabase/seed_24bottles_products.sql`
- ✅ Type `Experience` esteso con i 3 campi opzionali
- ✅ Detail page `/experiences/[id]` mostra banner "📦 Regalo fisico — consegna in X giorni"
- ✅ Catalog card mostra badge "📦 a casa" in basso-sinistra se `is_physical_gift=true`
- ✅ Whitelist proxy estesa a `24bottles.com`
- ✅ `PartnerSlug` type accetta `'tradedoubler'`

## TODO post-overnight

### 1. Apertura pacco (renderer animation)

Quando il destinatario apre il pacco BeGift e il gift è connesso a un'experience con `is_physical_gift=true`, il renderer deve mostrare in modo prominente:

- **`product_image_url`** dell'experience (la singola bottiglia su sfondo pulito), grande, centrata
- **Data consegna stimata** sotto, in stile "ti arriva a casa entro [data]"
- **Eventualmente** un tracking link se disponibile dal parser email

File da modificare: `app/g/[token]/OpenPackClient.tsx`. Aggiungere step dedicato dopo l'animazione di apertura, prima del messaggio del sender.

Pattern proposto:

```tsx
// Pseudo-code
if (gift.experience?.is_physical_gift) {
  return <PhysicalGiftReveal
    productImage={gift.experience.product_image_url}
    productName={gift.experience.title}
    estimatedDeliveryDate={computeDeliveryDate(gift.purchased_at, gift.experience.shipping_estimated_days)}
    senderMessage={gift.message}
  />;
}
```

Stima lavoro: 2-3 ore (richiede capire renderer attuale e aggiungere variant).

### 2. Email parser hook 24Bottles

Aggiungere pattern in `lib/email-parser/` (o equivalente) che riconosce mail da `*.24bottles.com` o con subject pattern "Order confirmation" e estrae:

- Nome prodotto (es. "Urban Bottle 500ml Lagoon Matte")
- Immagine prodotto (dal HTML mail spesso c'è img tag)
- Data spedizione stimata o tracking
- Indirizzo consegna

Stima lavoro: 1-2 ore (dipende da come la mail conferma 24Bottles è strutturata — serve sample reale).

### 3. Credenziali TradeDoubler

Sostituire `{td_program_id}` nei seed `affiliate_url_template` con il vero program_id 24Bottles su TradeDoubler. Luca: prendi credenziali da `ui.tradedoubler.com` → Account → Programs.

Stima lavoro: 5 minuti (solo sostituzione SQL).

### 4. Immagini prodotti

Tutti gli 8 seed hanno `image_url=NULL` e `product_image_url=NULL`. Luca: prendere screenshot da `24bottles.com` per ognuno e popolarli via SQL UPDATE.

Stima lavoro: 30 min per 8 prodotti.

## Scaling a nuovi partner "regalo fisico"

Aggiungere un brand di regalo fisico richiede:

1. Riga in `experience_partners` con `slug='nome'`
2. Righe in `experiences` con `is_physical_gift=true`, `shipping_estimated_days` ragionevole, `product_image_url` da CDN partner
3. Dominio CDN aggiunto a `ALLOWED_HOST_SUFFIXES` in `app/api/img-proxy/route.ts`
4. (Opzionale) Hook email parser specifico in `lib/email-parser/`

Buoni candidati futuri (regali fisici italiani con programma affiliate):
- **Smartbox / Cofanetti Esperienza** — via TradeDoubler
- **Florinda / fiori a domicilio** — locale
- **Decathlon** — gadget sportivi, programma affiliate
- **Eataly** — gourmet, programma affiliate
- **Libreria.coop / Mondadori** — libri come regalo

## Economics

Il modello "regalo fisico" ha implicazioni diverse dal digitale:

- **Commissione affiliate più bassa** (3-7% vs 8-10% di GYG) ma **prezzo medio carrello più alto**
- **Conversione tipicamente migliore** del bigliettino concerto (decisione di acquisto più rapida, no scelta di data)
- **Resi/cancellazioni**: i regali fisici hanno tassi di reso (3-8%) vs voucher digitali (1-2%). Commissione su ordine cancellato si perde.

Realistica revenue per regalo fisico medio €25: commissione 6% = €1.50 lordo. Per superare break-even del cost-per-acquisition BeGift (stimato €1-2 user con marketing organico), serve conversione >5%.

## Documenti collegati

- `supabase/migrations/028_physical_gifts.sql` — migration schema
- `supabase/seed_24bottles_products.sql` — seed prodotti
- `app/api/img-proxy/route.ts` — whitelist 24bottles.com
- `types/experiences.ts` — Experience.is_physical_gift etc.
- `app/experiences/[id]/page.tsx` — banner detail page
- `app/regalo/catalogo/page.tsx` — badge card
