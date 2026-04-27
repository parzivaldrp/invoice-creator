import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routes that require an authenticated user. Anyone hitting these without
 * a valid session is redirected to /login?next=<original-path>.
 *
 * Add new protected sections here — the middleware does the gate, so
 * individual pages don't have to (though ProtectedRoute is kept as a
 * client-side belt-and-braces fallback for slow networks).
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/myInvoice',
  '/profile',
  '/invoice_generator',
  '/editInvoice',
  '/billing',
  '/InvoiceDetailPage',
];

/**
 * Refreshes the Supabase session cookie on every request and gates
 * access to PROTECTED_PREFIXES at the edge. Called from
 * `src/middleware.ts`.
 *
 * Important: this function MUST always return the `supabaseResponse`
 * built here (or a redirect) so the refreshed cookies are forwarded
 * to the browser. Returning a plain `NextResponse.next()` would drop
 * the rotated tokens and silently log users out.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() forces a server round-trip to verify the JWT,
  // unlike getSession() which trusts the cookie. Use getUser() in
  // middleware to defend against forged/expired tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    path === prefix || path.startsWith(`${prefix}/`)
  );

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', path + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
