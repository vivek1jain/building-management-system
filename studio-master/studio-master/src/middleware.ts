
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

// Middleware is no longer needed for authentication.
// This is a placeholder that allows all requests to pass through.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
