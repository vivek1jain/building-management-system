
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { AuthServerConfig, AuthClientConfig } from 'next-firebase-auth-edge';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID_PLACEHOLDER",
};

const PLACEHOLDER_VALUES = [
  "YOUR_FIREBASE_API_KEY_PLACEHOLDER",
  "YOUR_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  "YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER",
  "YOUR_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  "YOUR_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  "YOUR_FIREBASE_APP_ID_PLACEHOLDER",
];

function hasPlaceholderValues(config: FirebaseOptions): boolean {
  return Object.values(config).some(value => typeof value === 'string' && PLACEHOLDER_VALUES.includes(value));
}

if (typeof window !== 'undefined' && hasPlaceholderValues(firebaseConfig)) {
  console.error(
    "******************************************************************************\n" +
    "CRITICAL FIREBASE CONFIGURATION ERROR:\n" +
    "Your Firebase configuration in src/lib/firebase/config.ts contains placeholder values.\n" +
    "Firebase services WILL NOT WORK correctly. \n" +
    "Please update this file with your actual Firebase project credentials or ensure \n" +
    "your NEXT_PUBLIC_FIREBASE_* environment variables are correctly set.\n" +
    "******************************************************************************"
  );
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with persistence
let auth: Auth;
if (typeof window !== 'undefined') {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  auth = getAuth(app);
}

const db = getFirestore(app);

// Auth Edge Config
export const authConfig: AuthClientConfig = {
  apiKey: firebaseConfig.apiKey!,
  cookieName: 'authSession',
  cookieSignatureKeys: ['secret1', 'secret2'], // Replace with your own secrets
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 12 * 60 * 60 * 24, // 12 days
  },
};


const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

if (USE_EMULATORS && typeof window !== 'undefined') {
  console.log("Firebase Emulators: Not configured to use emulators. Connecting to production Firebase.");
}

export { app, auth, db };
