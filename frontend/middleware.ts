import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the refresh token cookie
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    // If not logged in, redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // The actual access token validation is done on the client or by API routes,
  // but presence of refresh token cookie is a good basic proxy for "logged in"
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
