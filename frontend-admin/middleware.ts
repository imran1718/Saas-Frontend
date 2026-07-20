import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the platform refresh token cookie
  const refreshToken = request.cookies.get('platform_refresh_token')?.value;

  if (!refreshToken) {
    // If not logged in, redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/revenue/:path*', '/analytics/:path*'],
};
