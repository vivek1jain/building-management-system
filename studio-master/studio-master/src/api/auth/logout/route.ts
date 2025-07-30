import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  // To log out, we just need to clear the cookie.
  const cookie = serialize('authSession', '', {
    maxAge: -1, // Expire the cookie immediately
    path: '/',
  });

  const response = NextResponse.json({ status: 'success' }, { status: 200 });
  response.headers.set('Set-Cookie', cookie);
  return response;
}
