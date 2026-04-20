import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code       = req.nextUrl.searchParams.get("code");
  const next       = req.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=nocode", req.url));
  }

  // Redirige alla finalize page invece che direttamente a `next`:
  // la finalize è un bridge client-side che sincronizza la session
  // dai cookie (scritti da exchangeCodeForSession qui sotto) al
  // localStorage, così il resto dell'app — che legge dallo storage
  // legacy — vede l'utente come loggato anche dopo un F5. Senza
  // questo bridge l'utente OAuth appariva "non loggato" al reload.
  const finalizeUrl = new URL(`/auth/finalize?next=${encodeURIComponent(next)}`, req.url);
  const response = NextResponse.redirect(finalizeUrl);

  // Cookie options: NO httpOnly — il client deve poter leggere la
  // session lato browser per specchiarla in localStorage. Secure è
  // condizionato all'HTTPS (altrimenti i cookie non si impostano in
  // dev su http://localhost).
  const isHttps = req.nextUrl.protocol === "https:";
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, {
              ...options,
              httpOnly: false,
              secure: isHttps,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(new URL(`/auth/login?error=${error.code}`, req.url));
  }

  return response;
}
