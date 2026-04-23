# BeGift — Verifica region Supabase (EU)

**Gap di riferimento:** 16.11 della Relazione sulla Sicurezza.
**Criticità:** Critica — da verificare prima del lancio.
**Azione richiesta:** Luca (Titolare), 5 minuti.

Se il progetto Supabase è ospitato in region USA, ogni richiesta al database comporta un trasferimento dati extra-UE. Con progetto in region EU (Francoforte, Dublino, Londra), non c'è trasferimento durante l'operazione (Supabase potrebbe replicare a USA per backup DR ma con SCC).

---

## 1. Verifica rapida

### Metodo 1 — Dashboard Supabase
1. Aperto https://supabase.com/dashboard/projects
2. Selezionare progetto BeGift
3. **Settings → General → Region**
4. Leggere il valore. Obiettivo: `eu-central-1` (Francoforte) o `eu-west-2` (Londra) o `eu-west-3` (Parigi).

### Metodo 2 — Endpoint URL
Il pattern dell'URL del progetto rivela la region:
- `https://<project>.supabase.co` — il dominio è universale, non dice la region
- In `Settings → API`, la region è mostrata accanto all'URL del progetto

### Metodo 3 — Script (se hai accesso alla REST API)
```bash
curl -s "https://<project>.supabase.co/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -I | grep -i "x-region\|server"
```
(Non sempre restituisce la region chiaramente — usa i metodi 1/2).

---

## 2. Esiti possibili

### Esito A — Region già EU
- ✅ Nulla da fare
- Aggiornare `LEGAL_REVIEW.md` sezione 2 confermando la region
- Aggiornare `privacy/page.tsx` rimuovendo il TODO

### Esito B — Region USA o altra non-EU
Procedere con la migrazione (sezione 3).

---

## 3. Procedura di migrazione

> ⚠️ **Importante:** Supabase non offre migrazione automatica di region. L'unica strada è creare un progetto nuovo e migrare i dati. Durante la migrazione il servizio sarà down per 30-90 minuti (dipende dalla mole dati).

### 3.1 Preparazione (1 giorno prima)

- [ ] Annunciare manutenzione agli utenti via email / banner in-app
- [ ] Scegliere finestra di minor traffico (es. martedì 03:00-05:00 CET)
- [ ] Backup preventivo:
  ```bash
  # Export schema + data del progetto esistente
  pg_dump "postgresql://postgres:[PASS]@db.[PROJECT_OLD].supabase.co:5432/postgres" \
    --no-owner --no-privileges --clean --if-exists \
    > begift_dump_$(date +%F).sql
  ```
- [ ] Download completo dei file Storage:
  ```bash
  # Lista i file e scarica tutti i bucket
  # Usando la CLI Supabase o script custom
  supabase storage ls --project-ref [PROJECT_OLD] --recursive
  ```

### 3.2 Creare il nuovo progetto

1. https://supabase.com/dashboard → New project
2. Nome: `begift-eu` (temporaneo)
3. Region: **Frankfurt (eu-central-1)**
4. Piano: stesso del progetto vecchio
5. Attendere provisioning (~3 min)

### 3.3 Ripristinare schema + dati

```bash
# Restore sul nuovo progetto
psql "postgresql://postgres:[PASS_NEW]@db.[PROJECT_NEW].supabase.co:5432/postgres" \
  < begift_dump_$(date +%F).sql
```

Verificare che tutte le tabelle, policy RLS, indici siano presenti:
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public';
-- deve mostrare: profiles, gifts, reactions, notifications, push_subscriptions,
-- reminders, reports, user_blocks, gift_opens, ...
```

### 3.4 Migrare Storage

```bash
# Per ogni bucket (gift-media, reaction-media)
# Usa supabase CLI o script che itera i file del vecchio bucket
# e li ri-uploada sul nuovo.
# Pseudocode:
for file in $(supabase storage ls old gift-media --recursive); do
  supabase storage cp "supabase://old/gift-media/$file" "supabase://new/gift-media/$file"
done
```

### 3.5 Switchover DNS / env

1. Aggiornare env su Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = nuovo URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = nuova anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = nuova service key
2. Trigger redeploy Vercel
3. Smoke test: login, creazione gift, apertura gift

### 3.6 Monitoraggio post-migrazione

- [ ] 24 ore di monitoraggio stretto (Sentry, Supabase logs)
- [ ] Non cancellare il vecchio progetto per almeno 7 giorni (fallback)
- [ ] Comunicazione agli utenti: "manutenzione completata"

### 3.7 Cleanup (dopo 7 giorni)

- [ ] Eliminare progetto Supabase vecchio
- [ ] Rinominare progetto nuovo `begift-eu` → `begift`
- [ ] Aggiornare `LEGAL_REVIEW.md` e `privacy`
- [ ] Se c'erano SCC attive per il vecchio progetto USA, notificare all'avvocato che non sono più necessarie per questo perimetro

---

## 4. Verifica post-migrazione (check-list)

- [ ] `Settings → Region` mostra eu-*
- [ ] Ping dal client italiano: latenza &lt; 50ms (era ~150ms da US East)
- [ ] `/privacy` aggiornata con riferimento EU
- [ ] Nessun errore in Sentry nelle ultime 24h
- [ ] Backup post-migrazione funzionante (test restore in ambiente test)

---

## 5. Costi e downtime stimati

| Voce | Stima |
|---|---|
| Costo piano Supabase | Invariato (stesso tier) |
| Costo bandwidth export/import | Gratuito (incluso nel piano) |
| Downtime pianificato | 30-90 minuti (ore notturne) |
| Effort Luca | 3-4 ore totali (con buffer) |
| Rischio perdita dati | Basso (backup preventivo) |
