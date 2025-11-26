import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import app from './config';

/**
 * Initialize Firebase App Check
 * 
 * App Check helps protect your backend resources from abuse by preventing
 * unauthorized clients from accessing your backend resources.
 * 
 * For development: Uses debug tokens
 * For production: Uses reCAPTCHA v3
 */

// Declare self for App Check debug token
declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

export const initAppCheck = () => {
  // Enable debug mode in development
  if (import.meta.env.DEV) {
    // This allows the use of App Check debug tokens in development
    // Debug tokens can be generated in Firebase Console
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log('🔧 App Check: Debug mode enabled for development');
  }

  // Get reCAPTCHA site key from environment variable
  const recaptchaSiteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.warn(
      '⚠️ App Check: VITE_FIREBASE_RECAPTCHA_SITE_KEY not found. ' +
      'App Check will not be enabled. This is OK for development but ' +
      'should be configured for production.'
    );
    return null;
  }

  try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      
      // With reCAPTCHA, App Check runs in the background
      // Set to true to automatically refresh tokens before they expire
      isTokenAutoRefreshEnabled: true,
    });

    console.log('✅ App Check initialized successfully');
    return appCheck;
  } catch (error) {
    console.error('❌ App Check initialization failed:', error);
    return null;
  }
};
