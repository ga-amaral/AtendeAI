import { NextRequest, NextResponse } from "next/server";

const SUPABASE_AUTH_COOKIE_LIMIT = 4096;

function getSupabaseCookiePrefix(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = url.replace(/^https?:\/\//, "").split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

function isSupabaseAuthCookie(name: string, prefix: string): boolean {
  return (
    name === prefix ||
    name.startsWith(`${prefix}.`) ||
    name.startsWith(`${prefix}-`)
  );
}

export function middleware(request: NextRequest) {
  const prefix = getSupabaseCookiePrefix();

  const oversized = request.cookies
    .getAll()
    .filter(({ name }) => isSupabaseAuthCookie(name, prefix))
    .reduce((total, { name, value }) => total + name.length + value.length, 0);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (oversized > SUPABASE_AUTH_COOKIE_LIMIT) {
    request.cookies
      .getAll()
      .filter(({ name }) => isSupabaseAuthCookie(name, prefix))
      .forEach(({ name }) => {
        response.cookies.set(name, "", {
          path: "/",
          sameSite: "lax",
          maxAge: 0,
        });
      });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};