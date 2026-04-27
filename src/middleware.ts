import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Edge middleware runs on every request matching `config.matcher` below.
 * It refreshes the Supabase session cookie and redirects unauthenticated
 * users away from protected routes — see PROTECTED_PREFIXES in
 * src/lib/supabase/middleware.ts.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request EXCEPT:
     *   - _next/static, _next/image  (build assets)
     *   - favicon, logo, public images
     *   - API routes (they auth themselves with the same cookies)
     *
     * We exclude /api so middleware doesn't double-redirect API calls;
     * API routes use createClient() from @/lib/supabase/server.ts and
     * return JSON 401s, which is the right behavior for fetch callers.
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
