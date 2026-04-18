import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const next         = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const accessToken  = req.nextUrl.searchParams.get("at");
  const refreshToken = req.nextUrl.searchParams.get("rt");

  const response = NextResponse.redirect(new URL(next, req.url));

  if (!accessToken || !refreshToken) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
          });
        },
      },
    }
  );

  await supabase.auth.setSession({
    access_token:  accessToken,
    refresh_token: refreshToken,
  });

  return response;
}
