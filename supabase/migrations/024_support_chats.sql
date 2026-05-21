-- ============================================================
-- Migration 024: Support Concierge — chat history
-- ============================================================
-- Branch: feature/email-parser-poc
-- Spec: docs/strategy/SUPPORT_CONCIERGE_BUILD_PLAN.md
--
-- Tabella per persistere ogni turn di chat tra utente e Support
-- Concierge AI agent. Usata per:
--  - reload della conversazione quando l'utente ricarica la pagina
--  - audit + improvement del prompt (analisi conversation patterns)
--  - escalation flow (Luca riceve mail con cronologia in contesto)
--
-- Privacy: nessun accesso pubblico (RLS attiva, niente policy public).
-- Solo service_role via API server-side. Le chat di utenti anonimi
-- non hanno user_id, sono identificate da session_id (sessionStorage
-- browser, non persistente cross-device).
--
-- Feature flag: NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_chats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL,
                  -- identificatore conversazione (random hex 16ch dal client,
                  -- salvato in sessionStorage. Cross-tab persistente, cross-
                  -- device no — accettato: una nuova chat per device va bene)
  user_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
                  -- null se utente anonimo
  role          text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       text NOT NULL,
  metadata      jsonb,
                  -- es. {"current_url": "/draft/abc", "user_agent_hash": "..."}
  escalated     boolean NOT NULL DEFAULT false,
                  -- true se questo turn ha triggerato escalation a Luca
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.support_chats IS
'Cronologia chat Support Concierge AI agent (Sonnet 4). Vedi docs/strategy/SUPPORT_CONCIERGE_BUILD_PLAN.md';

-- Indici per i query pattern principali
CREATE INDEX IF NOT EXISTS idx_support_chats_session
  ON public.support_chats (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_chats_user
  ON public.support_chats (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_chats_escalated
  ON public.support_chats (escalated, created_at DESC)
  WHERE escalated = true;

-- RLS — nessun accesso anon/authenticated, solo service_role
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
-- Nessuna policy CREATE = nessun accesso via Data API anon/auth
-- (e' intenzionale: la chat e' privacy-sensitive)

-- GRANT per service_role (Supabase Data API + admin client server-side)
GRANT SELECT, INSERT, UPDATE ON public.support_chats TO service_role;
