import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // NOTE: The platform_refresh_token cookie is set by api.nanoshipy.com with domain=.nanoshipy.com
  // so it IS accessible here. We check for it to protect dashboard routes.
  // The AuthProvider (client-side) also handles session restoration via localStorage.
  const refreshToken = request.cookies.get('platform_refresh_token')?.value;

  // Also allow if there is a platform_access_token cookie (set as backup)
  const accessToken = request.cookies.get('platform_access_token')?.value;

  if (!refreshToken && !accessToken) {
    // No auth at all — redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/revenue/:path*', '/analytics/:path*'],
};
