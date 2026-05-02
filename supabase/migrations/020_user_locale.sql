-- 020_user_locale.sql
--
-- Persistenza della lingua preferita dell'utente. Lo switcher i18n
-- (LangSwitcher) salva localmente in localStorage, ma per le email
-- transazionali server-side abbiamo bisogno di sapere la lingua
-- preferita del destinatario al momento dell'invio. Senza questo
-- campo, ogni email parte sempre in italiano anche se l'utente ha
-- scelto inglese nello switcher PWA.
--
-- Default: 'it' per mantenere comportamento attuale (utenti esistenti
-- continuano a ricevere email in italiano finche' non scelgono altro).
--
-- Idempotente: usa IF NOT EXISTS.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_locale text NOT NULL DEFAULT 'it';

-- Vincolo soft: accettiamo solo locale supportate dall'app
-- (vedi messages/*.json: it, en, ja, zh).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_locale_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_preferred_locale_chk
      CHECK (preferred_locale IN ('it', 'en', 'ja', 'zh'));
  END IF;
END$$;

COMMENT ON COLUMN public.profiles.preferred_locale IS 'Lingua preferita per UI e email transazionali. Sincronizzata dal client tramite POST /api/profile/locale al cambio di switcher.';
