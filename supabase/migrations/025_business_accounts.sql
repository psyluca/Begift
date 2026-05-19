-- ============================================================
-- Migration 025: BeGift Business — account B2B per gifting
-- ============================================================
-- Branch: feature/email-parser-poc
-- Scope: prima cliente B2B (massaggiatrice, 2026-05-18) e successivi
--   professionisti (estetisti, fotografi, personal trainer, etc.)
--   che vogliono inviare coupon-regalo "impacchettati" ai loro clienti.
--
-- Design:
--   - business_accounts: 1-to-1 con profiles, contiene info brand
--     (nome attivita', mail contatto, status onboarding)
--   - gifts esistente esteso con flag is_business_gift + FK al
--     business_account + URL coupon file + open_token random
--   - Storage bucket business-coupons (private, signed URL)
--
-- Pagina apertura cliente:
--   path /g/[token] (NON /gift/[id]) — token random URL-safe ~20 char
--   diverso dall'UUID interno gifts.id. Permette URL piu' corti +
--   evita enumeration (UUID e' "indovinabile" se sequenziale, token
--   no). Pagina pubblica, no auth, no top bar BeGift.
--
-- Onboarding MVP (2026-05-18): manuale. Luca crea il record
-- business_accounts con SQL admin, comunica alla cliente la mail
-- collegata per il login. NIENTE self-service signup in MVP.
--
-- Feature flag: NEXT_PUBLIC_FEATURE_BUSINESS_DASHBOARD
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. business_accounts
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
                    -- 1-to-1 con profiles. Una persona puo' avere al massimo
                    -- un business account (per ora). Per multi-business in
                    -- futuro: rimuovere UNIQUE e gestire selezione attiva.

  business_name   text NOT NULL,                -- "Centro Massaggi Aurora"
  contact_email   text NOT NULL,                -- mail visibile ai clienti (puo' diff da auth)
  contact_phone   text,                          -- opzionale, mostrato sui pacchi se presente

  -- Branding (per pagina apertura cliente)
  logo_url        text,                          -- URL logo della cliente su Supabase Storage
  brand_color     text,                          -- hex #RRGGBB, accent della pagina apertura
                                                  -- default in app: #D4537E (BeGift pink)

  -- Stato onboarding
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'archived')),
                    -- 'pending'   = appena creato, Luca deve completare info
                    -- 'active'    = puo' creare pacchi
                    -- 'suspended' = sospeso (es. pilot scaduto, da rinnovare)
                    -- 'archived'  = chiuso, no piu' creazione pacchi

  -- Note interne (curatela Luca)
  internal_notes  text,
  pilot_started_at timestamptz,
  pilot_ends_at   timestamptz,                   -- per pilot gratis a tempo

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_accounts IS
'Account B2B per professionisti che inviano coupon-regalo via BeGift. Una riga per profilo.';

CREATE INDEX IF NOT EXISTS idx_business_accounts_user
  ON public.business_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_status
  ON public.business_accounts (status)
  WHERE status = 'active';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.business_accounts_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_accounts_updated_at ON public.business_accounts;
CREATE TRIGGER trg_business_accounts_updated_at
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.business_accounts_set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 2. profiles — flag is_business per gating UI
-- ──────────────────────────────────────────────────────────────
-- Ridondante con (business_accounts.user_id IS NOT NULL) ma piu'
-- veloce da controllare in middleware/auth checks senza join.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_business boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_business
  ON public.profiles (is_business)
  WHERE is_business = true;

-- ──────────────────────────────────────────────────────────────
-- 3. gifts — estensione per business gifts
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS is_business_gift boolean NOT NULL DEFAULT false;

ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS business_account_id uuid
  REFERENCES public.business_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS coupon_file_url text;
  -- URL al file coupon (PDF/immagine) su Supabase Storage bucket
  -- 'business-coupons'. Conservato come URL signed pubblica (timeout
  -- lungo, refreshato runtime se serve).

ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS open_token text UNIQUE;
  -- Random URL-safe ~20 char per /g/[token]. Generato runtime al
  -- create dal backend. NULL per gift normali (usano /gift/[id]).

CREATE INDEX IF NOT EXISTS idx_gifts_open_token
  ON public.gifts (open_token)
  WHERE open_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gifts_business_account
  ON public.gifts (business_account_id, created_at DESC)
  WHERE business_account_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. Storage bucket: business-coupons
-- ──────────────────────────────────────────────────────────────
-- Private bucket per i file coupon caricati dai business accounts.
-- Accesso via signed URL generata server-side.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-coupons',
  'business-coupons',
  false,                                          -- NON pubblico
  10 * 1024 * 1024,                                -- 10 MB max per file
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: solo authenticated può upload nel proprio path
-- (path pattern: <business_account_id>/<gift_id>/<filename>)

DROP POLICY IF EXISTS "business owners can upload coupons" ON storage.objects;
CREATE POLICY "business owners can upload coupons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-coupons'
    AND EXISTS (
      SELECT 1 FROM public.business_accounts ba
      WHERE ba.user_id = auth.uid()
        AND ba.id::text = split_part(name, '/', 1)
        AND ba.status = 'active'
    )
  );

DROP POLICY IF EXISTS "business owners can read own coupons" ON storage.objects;
CREATE POLICY "business owners can read own coupons"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-coupons'
    AND EXISTS (
      SELECT 1 FROM public.business_accounts ba
      WHERE ba.user_id = auth.uid()
        AND ba.id::text = split_part(name, '/', 1)
    )
  );

-- Nota: la pagina apertura cliente /g/[token] accede al coupon via
-- signed URL generata server-side (endpoint /api/g/[token]/coupon).
-- Quindi non serve policy SELECT pubblica sul bucket.

-- ──────────────────────────────────────────────────────────────
-- 5. RLS — business_accounts
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

-- Owner puo' leggere il proprio business account
CREATE POLICY "business owners read own account"
  ON public.business_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owner puo' aggiornare il proprio account (es. brand_color, contact_email)
CREATE POLICY "business owners update own account"
  ON public.business_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT: solo service_role (onboarding manuale Luca via admin client)
-- DELETE: solo service_role

-- ──────────────────────────────────────────────────────────────
-- 6. GRANT per Data API (Supabase post 2026-10-30 policy)
-- ──────────────────────────────────────────────────────────────

GRANT SELECT, UPDATE ON public.business_accounts TO authenticated;
-- INSERT/DELETE: solo service_role (default, gia' coperto)

-- ──────────────────────────────────────────────────────────────
-- 7. Trigger: auto-set profiles.is_business al INSERT business_account
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.business_account_sync_profile_flag()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET is_business = true WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET is_business = false WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_business_account_sync_flag ON public.business_accounts;
CREATE TRIGGER trg_business_account_sync_flag
  AFTER INSERT OR DELETE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.business_account_sync_profile_flag();
