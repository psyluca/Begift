/**
 * GET /api/users?q=...
 *
 * SOSPESA 2026-04-28 — privacy hardening pre-lancio.
 *
 * La versione precedente esponeva email completo + display_name di
 * QUALSIASI profilo registrato a chiunque chiamasse l'endpoint, senza
 * auth check, con `ilike %q%`. Era una user enumeration "by design".
 * Decisione: sospendere finche' non viene implementato un sistema di
 * "cerchia / connessioni" che permetta search SOLO entro le persone
 * con cui l'utente ha gia' scambiato gift (oppure entro chi ha
 * acconsentito esplicitamente a essere "trovabile" via toggle privacy).
 *
 * Comportamento attuale: ritorna sempre array vuoto. Niente errori,
 * niente segnali utili a un attaccante. Il client InAppSend e' stato
 * nascosto in CreateGiftClient — quindi questa API non dovrebbe nemmeno
 * essere chiamata in produzione, ma manteniamo la rotta no-op per non
 * rompere eventuali client cached/old.
 *
 * Riabilitazione futura prevede:
 *  - Auth check (solo utenti loggati)
 *  - Filtro "tuoi contatti" basato su gift_opens / reactions / blocks
 *  - O toggle profile.searchable boolean (default false → opt-in)
 *  - Mai esporre email completa — solo display_name + handle pubblico
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}
