# Test fixtures email parser

Esempi di email reali (anonimizzate) usati per testare il parser.

## Come usare

Per un test locale del parser:

```bash
# Dalla root del repo
ANTHROPIC_API_KEY=sk-ant-... npx tsx lib/email-parser/__fixtures__/run-test.ts ticketone-vasco
```

Output atteso: JSON parseato dall'API + tempi di esecuzione + confidence score.

## Fixtures disponibili

| File | Merchant | Tipo | Note |
|------|----------|------|------|
| `ticketone-vasco.txt` | TicketOne | event_ticket | Concerto Vasco Rossi 15/07/2026, 2 biglietti PIT GOLD, €195 |
| `smartbox-weekend.txt` | Smartbox | experience_voucher | Cofanetto Weekend di Charme, €149,90, codice voucher |

## Aggiungere nuovi fixtures

1. Crea file `.txt` con formato email RFC822 (From/Subject/Date headers + body)
2. Anonimizza dati personali (nomi, codici reali, importi reali)
3. Aggiorna questa tabella

## Note sicurezza

I fixtures NON contengono mai:
- Dati personali reali
- Codici biglietti/voucher reali (sono inventati)
- IBAN, carte di credito, dati fiscali
