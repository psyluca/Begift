/**
 * Supabase Edge Function: send-push
 *
 * Invia push notification iOS via APNs (Apple Push Notification service)
 * a tutti i device dell'utente target. Letta dalla tabella push_device_tokens.
 *
 * Flow:
 *  1. Riceve POST con { userId, title, body, data? }
 *  2. Carica i token iOS dell'utente dal DB
 *  3. Firma JWT ES256 con .p8 key (cached 55 min)
 *  4. POST HTTP/2 a api.development.push.apple.com (dev) o
 *     api.push.apple.com (prod) — vedi APNS_HOST env var
 *  5. Ritorna risultati fanout (status code per ogni token)
 *
 * Secrets richiesti (configurati via `supabase secrets set ...`):
 *  - APNS_KEY_ID — es. "DV6UQV84V6"
 *  - APNS_TEAM_ID — "TMG9NMWDP5"
 *  - APNS_BUNDLE_ID — "app.begift.mobile"
 *  - APNS_PRIVATE_KEY — contenuto del file .p8 (incluso BEGIN/END markers)
 *  - APNS_HOST — opzionale, default "api.development.push.apple.com"
 *  - SUPABASE_URL — auto-popolato da Supabase
 *  - SUPABASE_SERVICE_ROLE_KEY — auto-popolato da Supabase
 *
 * Auth: la function verifica che chi chiama abbia il SERVICE_ROLE_KEY
 * nel header Authorization. Usata da backend trigger o cron, non da
 * client diretto.
 *
 * Invocation example:
 *   curl -X POST https://acoettfsxcfpvhjzreoy.supabase.co/functions/v1/send-push \
 *     -H "Authorization: Bearer SERVICE_ROLE_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"userId":"...","title":"Test","body":"Funziona"}'
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID")!;
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID")!;
const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY")!;
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID")!;
const APNS_HOST = Deno.env.get("APNS_HOST") ?? "api.development.push.apple.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let cachedJwt: { token: string; expiresAt: number } | null = null;

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.expiresAt > now + 60) return cachedJwt.token;

  const header = { alg: "ES256", kid: APNS_KEY_ID, typ: "JWT" };
  const payload = { iss: APNS_TEAM_ID, iat: now };
  const message = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  const pem = APNS_PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(message)
  );

  const jwt = `${message}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
  cachedJwt = { token: jwt, expiresAt: now + 55 * 60 };
  return jwt;
}

interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authHeader = req.headers.get("authorization") ?? "";
  console.log("[Auth] header prefix:", authHeader.slice(0, 30));
  console.log("[Auth] service_role env prefix:", SUPABASE_SERVICE_ROLE_KEY.slice(0, 30));
  if (!authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: SendPushRequest;
  try { payload = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const { userId, title, body, data = {} } = payload;
  if (!userId || !title || !body) return new Response("Missing userId, title, or body", { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: tokens, error } = await supabase
    .from("push_device_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("platform", "ios");

  if (error) {
    console.error("DB error:", error);
    return new Response(JSON.stringify({ error: "DB error" }), { status: 500 });
  }
  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
  }

  const jwt = await getApnsJwt();
  const apnsPayload = JSON.stringify({
    aps: { alert: { title, body }, sound: "default", badge: 1 },
    ...data,
  });

  const results = await Promise.all(
    tokens.map(async ({ token }) => {
      try {
        const response = await fetch(`https://${APNS_HOST}/3/device/${token}`, {
          method: "POST",
          headers: {
            "authorization": `bearer ${jwt}`,
            "apns-topic": APNS_BUNDLE_ID,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "content-type": "application/json",
          },
          body: apnsPayload,
        });
        return { token: token.slice(0, 10) + "...", status: response.status, ok: response.ok };
      } catch (err) {
        return { token: token.slice(0, 10) + "...", error: String(err) };
      }
    })
  );

  return new Response(JSON.stringify({ ok: true, sent: tokens.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
