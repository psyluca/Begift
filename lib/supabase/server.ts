import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function createSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const all = cookieStore.getAll();
          const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
            .replace("https://", "").split(".")[0];

          // Prova cookie nel formato @supabase/ssr standard
          const ssoToken = all.find(c => c.name === `sb-${projectRef}-auth-token`);
          if (ssoToken) return all;

          // Prova con sb-access-token e sb-refresh-token separati
          const at = all.find(c => c.name === "sb-access-token")?.value;
          const rt = all.find(c => c.name === "sb-refresh-token")?.value;
          if (at && rt) {
            return [
              ...all,
              {
                name: `sb-${projectRef}-auth-token`,
                value: JSON.stringify({
                  access_token: at,
                  refresh_token: rt,
                  token_type: "bearer",
                  expires_in: 3600,
                }),
              },
            ];
          }

          // Prova con begift-session
          const session = all.find(c => c.name === "begift-session");
          if (session) {
            try {
              const val = session.value.startsWith("base64-")
                ? atob(session.value.slice(7))
                : session.value;
              const parsed = JSON.parse(decodeURIComponent(val));
              if (parsed.access_token) {
                return [
                  ...all,
                  {
                    name: `sb-${projectRef}-auth-token`,
                    value: JSON.stringify({
                      access_token: parsed.access_token,
                      refresh_token: parsed.refresh_token,
                      token_type: "bearer",
                      expires_in: 3600,
                    }),
                  },
                ];
              }
            } catch {}
          }

          return all;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
