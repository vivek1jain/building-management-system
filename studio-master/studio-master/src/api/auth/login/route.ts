
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { serialize } from 'cookie';
import { getAuth } from 'firebase-admin/auth';
import { initAdminApp } from '@/lib/firebase/admin-config';

initAdminApp();

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // It's possible for claims to change (e.g., admin promotion).
    // Revoking tokens on login forces a refresh, ensuring the user gets the latest claims.
    // This is especially important for the very first login after sign-up.
    try {
        await getAuth().revokeRefreshTokens(userCredential.user.uid);
    } catch (revokeError) {
        console.warn(`Could not revoke refresh tokens for ${userCredential.user.uid}, they may have old claims.`, revokeError);
    }
    
    // Now get a fresh token which will include any newly set custom claims.
    const freshIdToken = await userCredential.user.getIdToken(true);

    const cookie = serialize('authSession', freshIdToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error: any) {
    // Firebase auth errors have a 'code' property
    let errorMessage = "An unexpected error occurred.";
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        errorMessage = "Invalid email or password.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    console.error("Login API Error:", error.code, errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 401 });
  }
}
