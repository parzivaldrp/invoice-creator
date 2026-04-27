import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Build a request-scoped Supabase client that reads the user's session
 * from cookies. Use this in:
 *   - API route handlers (`app/api/.../route.ts`)
 *   - Server Components and Server Actions
 *
 * Always create a fresh client per request — never cache the result
 * across requests, because the cookies belong to the current caller.
 *
 * @example
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) return NextResponse.json({ error: '...' }, { status: 401 });
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll was called from a read-only context (e.g. a Server
            // Component during static rendering). Safe to ignore: the
            // middleware refreshes session cookies on every request, so
            // the next page load will pick up the latest token.
          }
        },
      },
    }
  );
}
