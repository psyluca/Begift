# BeGift — Backup restore drill

**Gap di riferimento:** 16.12 della Relazione sulla Sicurezza.
**Cadenza:** almeno una volta prima del lancio, poi ogni 6 mesi.
**Owner:** Luca Galli.

Un backup che non è mai stato testato non è un backup. Questo drill verifica che le procedure di recovery funzionino davvero. Farlo in fretta durante un incidente reale è la peggior cosa possibile.

---

## 1. Obiettivi del drill

- Confermare che i backup Supabase esistano e siano accessibili
- Confermare che il restore in ambiente separato completi senza errori
- Misurare il **RTO** (Recovery Time Objective) effettivo
- Misurare il **RPO** (Recovery Point Objective) — quanti dati si perderebbero nello scenario peggiore
- Familiarizzare con la UI / CLI in anticipo

Target:
- **RTO &lt; 2 ore** (da "decide restore" a "servizio up")
- **RPO &lt; 24 ore** (backup giornaliero)

---

## 2. Cosa è incluso nei backup Supabase (Pro plan)

- Backup automatici giornalieri dei database Postgres (retention 7 giorni)
- Point-in-time recovery (PITR) opzionale con granularity al secondo (solo piano Pro)
- Storage bucket NON inclusi nei backup di default — richiede download manuale periodico

**Implicazione:** i file media caricati dagli utenti (foto, video, PDF) NON sono parte del backup automatico di Supabase. Occorre una strategia aggiuntiva:
- Export bucket settimanale (vedi sezione 6)
- Oppure accettare che in caso di disastro totale i media vanno persi e documentarlo nella privacy policy

---

## 3. Procedura drill (standard — ~60 min)

### 3.1 Preparazione (10 min)
- [ ] Annotare l'ora di inizio
- [ ] Aprire un foglio di carta: "BeGift Backup Drill — YYYY-MM-DD"
- [ ] Assicurarsi di avere: credenziali Supabase, CLI `supabase` installata
- [ ] Creare un progetto Supabase "temp restore" vuoto nella stessa region (anch'esso in EU)

### 3.2 Individuare backup (5 min)
1. Supabase Dashboard → Project BeGift → **Database → Backups**
2. Verificare: l'elenco mostra almeno 5-7 backup recenti (uno al giorno)
3. Selezionare il backup più recente (più vecchio di 1 ora per essere realistici)
4. Annotare data/ora backup target

### 3.3 Restore in progetto temp (30-45 min)
**Opzione A — Restore via UI (consigliata)**
1. Nel progetto TEMP, Database → Backups → "Restore from external"
2. Fornire snapshot ID o scaricare dump e caricarlo
3. Attendere completion (tempo variabile: ~15-45 min per DB &lt; 1 GB)

**Opzione B — Restore via `pg_dump`/`pg_restore`**
```bash
# Export dal backup (o dalla copia live se si vuole solo testare il processo)
pg_dump "postgresql://postgres:[PASS]@db.[PROJECT_PROD].supabase.co:5432/postgres" \
  --no-owner --no-privileges -Fc \
  > begift_drill_$(date +%F).dump

# Restore nel progetto temp
pg_restore --no-owner --no-privileges --clean --if-exists \
  -d "postgresql://postgres:[PASS_TEMP]@db.[PROJECT_TEMP].supabase.co:5432/postgres" \
  begift_drill_$(date +%F).dump
```

### 3.4 Verifica integrità (10 min)
Eseguire nel progetto TEMP:
```sql
-- 1. Conteggio tabelle
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;

-- 2. Conteggio righe chiave
SELECT 'profiles' AS tabella, count(*) FROM profiles
UNION ALL
SELECT 'gifts', count(*) FROM gifts
UNION ALL
SELECT 'reactions', count(*) FROM reactions
UNION ALL
SELECT 'notifications', count(*) FROM notifications;

-- 3. Policy RLS presenti
SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename;

-- 4. Trigger auto-profile
SELECT tgname FROM pg_trigger WHERE tgname='on_auth_user_created';

-- 5. Indici
SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname;
```

Confrontare con il dump di riferimento (`supabase/migrations/*.sql`). Se le migrazioni sono applicate, i conteggi devono corrispondere (a meno delle righe inserite dopo il backup).

### 3.5 Smoke test applicativo (opzionale, 10 min)
Per drill completo:
- [ ] Puntare un'istanza Vercel preview alle env del progetto TEMP
- [ ] Login con un utente test → verifica funziona
- [ ] Apertura gift → verifica funziona
- [ ] Rollback env a produzione

### 3.6 Cleanup (5 min)
- [ ] Eliminare progetto TEMP (per non pagarlo)
- [ ] Registrare esito del drill in `/docs/compliance/backup-drill-log.md`
- [ ] Se emergono anomalie: issue GitHub + piano di remediation

---

## 4. Registro drill

File: `/docs/compliance/backup-drill-log.md` (creare al primo drill).

Template:
```
| Data       | Backup testato       | Durata  | Esito | Note                       |
|------------|----------------------|---------|-------|----------------------------|
| 2026-05-05 | snapshot 2026-05-04  | 58 min  | OK    | RTO target raggiunto       |
| 2026-11-03 | snapshot 2026-11-02  | 72 min  | OK    | Leggero ritardo su restore |
```

---

## 5. Drill di disaster recovery completo (annuale)

Una volta l'anno, eseguire un drill più ampio:
- Simulare perdita totale del progetto Supabase
- Ripristinare da backup IN UN'ALTRA REGION (test di geo-resilience)
- Ripristinare Storage da backup settimanale separato
- Target RTO totale: &lt; 8 ore

---

## 6. Storage bucket backup

I bucket `gift-media` e `reaction-media` non sono inclusi nei backup automatici. Opzioni:

### 6.1 Export manuale periodico (manuale, affidabile)
Settimanale:
```bash
# Installa supabase CLI se non già
npm install -g supabase
supabase login

# Scarica interi bucket
mkdir -p /backup/supabase-storage/$(date +%F)
supabase storage download supabase://gift-media/* /backup/supabase-storage/$(date +%F)/gift-media/
supabase storage download supabase://reaction-media/* /backup/supabase-storage/$(date +%F)/reaction-media/
```

Archiviare su disco esterno o cloud storage personale (iCloud / pCloud / Proton Drive).

### 6.2 Object lifecycle (automatico, via Supabase settings)
- Da `Storage → Bucket → Settings` abilitare versioning (se supportato dal piano)
- Consente recovery di file sovrascritti o cancellati entro retention

### 6.3 Replica via script Supabase Functions
Opzionale per il futuro: una Edge Function schedulata che replica i nuovi file su un bucket S3 esterno.

---

## 7. Accettazione del rischio residuo

Documentare esplicitamente cosa NON è coperto:
- RPO &gt; 24h teoricamente possibile se backup giornaliero fallisce e non ce ne accorgiamo → mitigazione: alert Sentry su assenza di conferma backup
- Perdita totale Supabase Inc. (evento improbabile — SOC 2 Type II) → nessuna mitigazione locale realistica, rischio residuo accettato
- Corruzione silent di bucket Storage tra backup settimanali → accettato in fase di lancio

Aggiornare questa sezione in accordo con l'avvocato.

---

## 8. Checklist pre-lancio

- [ ] Eseguito almeno 1 drill completo sezione 3
- [ ] Registro drill creato con esito OK
- [ ] Storage bucket: almeno un export manuale eseguito
- [ ] RTO misurato &lt; 2h
- [ ] Procedura documentata anche su carta (offline kit incident)
