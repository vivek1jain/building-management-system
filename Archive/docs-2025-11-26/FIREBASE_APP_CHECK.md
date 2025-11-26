# Firebase App Check Setup Guide

## What is Firebase App Check?

Firebase App Check helps protect your backend resources (Firestore, Cloud Functions, Storage) from abuse by ensuring requests come from your legitimate app and not bots or unauthorized clients.

## Why Enable App Check?

- **Prevent Bot Attacks**: Stop automated abuse and scraping
- **Reduce Costs**: Prevent quota exhaustion from malicious traffic
- **Protect Data**: Ensure only your app can access Firebase services
- **Required for Production**: Best practice for any public-facing app

## Setup Steps

### 1. Enable App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/proper-213b7)
2. Click on **Build** → **App Check** in the left sidebar
3. Click **Get Started**

### 2. Register Your Web App

#### For Production (reCAPTCHA Enterprise - Recommended)

1. In App Check settings, click **Add app** or select your web app
2. Choose **reCAPTCHA Enterprise** (better than v3, fewer false positives)
3. Follow the setup wizard:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable reCAPTCHA Enterprise API
   - Create a new site key with these settings:
     - **Platform type**: Website
     - **Domain**: Your production domain (e.g., `your-app.vercel.app`)
     - **reCAPTCHA type**: Choose "Score-based (v3)" for invisible checks
   - Copy the site key
4. Return to Firebase Console and paste the site key
5. Click **Save**

#### For Development (Debug Token)

1. In App Check settings, click **Apps** tab
2. Select your web app
3. Scroll to **Debug tokens** section
4. Click **Add debug token**
5. Generate a debug token for local development
6. Copy the token and add to `.env.local`:
   ```bash
   VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=your_debug_token_here
   ```

### 3. Install App Check SDK

```bash
npm install @firebase/app-check
```

### 4. Initialize App Check in Your App

Create `src/firebase/appCheck.ts`:

```typescript
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import app from './config';

// Initialize App Check
export function initializeFirebaseAppCheck() {
  // In development, use debug token
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
    // @ts-ignore - self is not defined in TypeScript
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  }

  // Initialize App Check with reCAPTCHA Enterprise
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || ''
    ),
    isTokenAutoRefreshEnabled: true, // Auto-refresh tokens
  });

  console.log('Firebase App Check initialized');
  return appCheck;
}
```

Update `src/firebase/config.ts` to initialize App Check:

```typescript
import { initializeFirebaseAppCheck } from './appCheck';

// ... existing code ...

// Initialize App Check (only in production)
if (import.meta.env.PROD) {
  initializeFirebaseAppCheck();
}
```

### 5. Update Environment Variables

Add to `.env.example`:

```bash
# Firebase App Check (reCAPTCHA Enterprise)
VITE_FIREBASE_APPCHECK_SITE_KEY=your_recaptcha_site_key

# Debug token for local development (get from Firebase Console)
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=your_debug_token
```

Add to `.env.local` for development:

```bash
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=abc123-your-debug-token-xyz789
```

Add to Vercel/production environment variables:

```bash
VITE_FIREBASE_APPCHECK_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 6. Enforce App Check in Firebase

#### Option A: Monitor Mode (Recommended First)

1. Go to Firebase Console → App Check
2. Click on each service (Firestore, Cloud Functions, Storage)
3. Enable **Monitor mode**
4. This logs violations but doesn't block requests
5. Monitor for 1-2 weeks to catch any issues

#### Option B: Enforcement Mode (After Monitoring)

1. After verifying everything works in monitor mode
2. Switch each service to **Enforcement mode**
3. Now only verified requests are allowed
4. **Warning**: This will break any requests without valid App Check tokens

### 7. Testing App Check

#### Local Development Testing

1. Start your dev server: `npm run dev`
2. Open browser console
3. Look for "Firebase App Check initialized" message
4. Make a Firestore request (e.g., load dashboard)
5. Check Firebase Console → App Check → Metrics
6. You should see your requests logged

#### Production Testing

1. Deploy to production
2. Visit your production URL
3. Open Network tab in DevTools
4. Look for requests to `firebaseappcheck.googleapis.com`
5. Verify App Check token in request headers

### 8. Troubleshooting

#### "App Check token verification failed"

**Cause**: App Check not initialized or reCAPTCHA misconfigured

**Fix**:
1. Verify site key is correct
2. Check domain is added to reCAPTCHA allowed domains
3. Ensure `initializeFirebaseAppCheck()` is called before any Firebase requests

#### Requests blocked in production

**Cause**: Enforcement mode enabled but App Check not working

**Fix**:
1. Temporarily switch to Monitor mode
2. Check browser console for errors
3. Verify reCAPTCHA Enterprise is enabled
4. Check site key matches production domain

#### Debug token not working

**Cause**: Token expired or not set correctly

**Fix**:
1. Generate new debug token in Firebase Console
2. Update `.env.local`
3. Restart dev server
4. Clear browser cache

#### reCAPTCHA Badge Showing

**Cause**: reCAPTCHA v3 visible badge

**Fix**: Add CSS to hide (only if using invisible reCAPTCHA):

```css
.grecaptcha-badge {
  visibility: hidden;
}
```

Add privacy notice to your Terms:
> This site is protected by reCAPTCHA and the Google
> [Privacy Policy](https://policies.google.com/privacy) and
> [Terms of Service](https://policies.google.com/terms) apply.

## Cost Considerations

### reCAPTCHA Enterprise Pricing

- **First 10,000 assessments/month**: Free
- **10,001 - 1,000,000**: $1 per 1,000 assessments
- **1,000,001+**: Volume pricing available

### Typical Usage

- Single-page load: 1-2 assessments
- Average monthly users (1,000): ~2,000-5,000 assessments
- **Most apps stay in free tier**

### Cost Optimization

1. Enable token auto-refresh (done by default)
2. Use monitor mode initially
3. Only enforce on critical services (Firestore, Functions)
4. Storage can stay in monitor mode

## Security Best Practices

### 1. Use Different Keys for Staging/Production

```typescript
const siteKey = import.meta.env.MODE === 'production'
  ? import.meta.env.VITE_APPCHECK_PROD_KEY
  : import.meta.env.VITE_APPCHECK_STAGING_KEY;
```

### 2. Rotate Debug Tokens Regularly

- Generate new tokens monthly
- Remove old tokens from Firebase Console
- Update team's `.env.local` files

### 3. Monitor App Check Metrics

- Firebase Console → App Check → Metrics
- Look for:
  - High rejection rates (possible misconfiguration)
  - Unusual traffic patterns (possible attack)
  - Failed verification attempts

### 4. Rate Limiting

Even with App Check, implement rate limiting:

```typescript
// Cloud Function with rate limiting
exports.createTicket = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    // App Check automatically verified by Firebase
    if (!context.app) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'App Check verification failed'
      );
    }
    
    // Additional rate limiting...
  });
```

## Monitoring and Alerts

### Set Up Alerts

1. Firebase Console → App Check → Metrics
2. Click **Create Alert**
3. Alert conditions:
   - Rejection rate > 10%
   - Unusual traffic spikes
   - Failed verifications increasing

### Weekly Review Checklist

- [ ] Check App Check metrics
- [ ] Review rejection reasons
- [ ] Verify debug tokens are current
- [ ] Check reCAPTCHA Enterprise quota usage
- [ ] Review security events

## Migration Path

### Phase 1: Setup (Week 1)
1. ✅ Install SDK
2. ✅ Configure reCAPTCHA Enterprise
3. ✅ Initialize App Check
4. ✅ Set up debug tokens

### Phase 2: Monitor (Week 2-3)
1. ⏳ Enable Monitor mode
2. ⏳ Observe traffic patterns
3. ⏳ Fix any issues
4. ⏳ Verify all clients work

### Phase 3: Enforce (Week 4+)
1. ⏳ Enable Enforcement mode
2. ⏳ Monitor rejection rate
3. ⏳ Set up alerts
4. ⏳ Document for team

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs/app-check
- **reCAPTCHA Enterprise**: https://cloud.google.com/recaptcha-enterprise/docs
- **Stack Overflow**: Tag `firebase-app-check`
- **Firebase Discord**: https://discord.gg/firebase

## Next Steps

After setup:
1. ✅ Enable monitor mode for all services
2. ✅ Monitor for 1-2 weeks
3. ✅ Review metrics weekly
4. ✅ Switch to enforcement mode
5. ✅ Set up alerts
6. ✅ Document in team runbook
