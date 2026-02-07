// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for user_session cookie
  const userSession = request.cookies.get('user_session')?.value;
  
  // Protect WhatsApp inbox route
  if (request.nextUrl.pathname.startsWith('/whatsappInbox')) {
    if (!userSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Optional: Add user info to headers for server components
    try {
      const sessionData = JSON.parse(userSession);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-email', sessionData.email);
      requestHeaders.set('x-user-org', sessionData.organization_id);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/whatsappInbox/:path*']
};