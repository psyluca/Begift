/**
 * Wrapper di osservabilita' minimo e agnostico.
 *
 * Oggi (pre-lancio) logga solo su console. Una volta integrato Sentry
 * (vedi docs/ALERTING_SETUP.md), basta sostituire qui l'implementazione
 * con Sentry.captureException / Sentry.captureMessage senza toccare il
 * resto del codebase.
 *
 * Usare SEMPRE questo wrapper invece di console.error diretto per
 * errori di cui vogliamo essere notificati.
 */

type ErrorContext = {
  /** Modulo/endpoint da cui proviene l'errore (es. "api/gifts"). */
  source?: string;
  /** User id se disponibile (no email, no PII). */
  userId?: string;
  /** Metadati aggiuntivi non PII. */
  extra?: Record<string, unknown>;
};

/**
 * Registra un errore "non fatal" (qualcosa e' andato storto ma il
 * sistema ha continuato a funzionare). Esempi: fallimento invio push
 * singolo, errore di parse di un payload opzionale, ecc.
 */
export function trackError(err: unknown, ctx: ErrorContext = {}): void {
  const source = ctx.source ?? "unknown";
  const userId = ctx.userId;
  const extra = ctx.extra;

  // Log strutturato per grep e log drain.
  const payload = {
    level: "error",
    source,
    userId,
    extra,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  };

  try {
    console.error("[observability]", JSON.stringify(payload));
  } catch {
    // Fallback in caso di cyclic refs.
    console.error("[observability]", source, payload.message);
  }

  // TODO(Fase hardening post-Sentry): sostituire con
  //   Sentry.captureException(err, { tags: { source }, user: { id: userId }, extra });
}

/**
 * Registra un evento di sicurezza rilevante (non necessariamente errore):
 * login admin, cancellazione account, export GDPR, report DSA creato,
 * user_block aggiunto. Questi eventi vanno tracciati per audit trail.
 */
export function trackSecurityEvent(
  event: string,
  ctx: ErrorContext = {},
): void {
  const payload = {
    level: "security",
    event,
    source: ctx.source ?? "unknown",
    userId: ctx.userId,
    extra: ctx.extra,
    timestamp: new Date().toISOString(),
  };
  try {
    console.info("[security]", JSON.stringify(payload));
  } catch {
    console.info("[security]", event, ctx.source);
  }

  // TODO: inoltrare anche a Sentry come breadcrumb + tag "security".
}
