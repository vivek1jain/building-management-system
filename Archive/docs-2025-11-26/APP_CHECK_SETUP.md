# Firebase App Check - Setup Checklist

**Status**: ✅ Code integrated, awaiting Firebase Console configuration

## What is App Check?

Firebase App Check protects your backend resources (Firestore, Storage, Functions) from abuse by:
- Blocking requests from bots and unauthorized clients
- Preventing quota theft and data scraping
- Ensuring requests only come from your legitimate app

## Implementation Status

### ✅ Completed
- [x] App Check code integrated (`src/firebase/appCheck.ts`)
- [x] Auto-initialization in `src/main.tsx`
- [x] Environment variable added to `.env.example`
- [x] Developer Guide updated with setup instructions
- [x] Build verified (passing with App Check)
- [x] Development mode configured (uses debug tokens)

### ⏳ Pending - Firebase Console Setup

You need to complete these steps in the Firebase Console:

## Setup Steps

### 1. Enable App Check in Firebase Console

```bash
# Open your Firebase project
https://console.firebase.google.com/project/building-management-90bb2/appcheck
```

**Actions**:
1. Click **"Get Started"**
2. Select **"reCAPTCHA v3"** as provider
3. Click **"Register"**
4. Add your domains:
   - Production: Your Vercel/hosting domain
   - Development: `localhost`
5. **Copy the reCAPTCHA site key** (you'll need this)

### 2. Add reCAPTCHA Key to Environment

**Local development** (`.env.local`):
```bash
VITE_FIREBASE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

**Vercel/Production**:
- Go to Vercel project settings → Environment Variables
- Add: `VITE_FIREBASE_RECAPTCHA_SITE_KEY` = `your_site_key`

### 3. Test in Unenforced Mode

**Important**: Start with enforcement **OFF** to test without breaking your app.

1. In Firebase Console → App Check
2. Keep enforcement **disabled** for Firestore and Storage
3. Deploy and test your app
4. Check browser console for App Check status:
   - ✅ `App Check initialized successfully`
   - ⚠️ Warnings if token generation fails

### 4. Enable Enforcement (After Testing)

Once you've verified App Check is working:

1. In Firebase Console → App Check
2. Click **"Enforce"** for:
   - ✅ Firestore
   - ✅ Cloud Storage
   - ✅ Cloud Functions (if using)
3. Monitor your app - requests without valid tokens will be blocked

## Development Workflow

### Local Development (No Site Key)

If you don't set `VITE_FIREBASE_RECAPTCHA_SITE_KEY`:
- App Check will **not** initialize
- Console will show: `⚠️ App Check: VITE_FIREBASE_RECAPTCHA_SITE_KEY not found`
- This is **OK for development** - your app will work normally
- Firebase requests will succeed (because enforcement is off)

### Local Development (With Debug Token)

For testing App Check locally:

1. Start dev server: `npm run dev`
2. Check console for debug token:
   ```
   🔧 App Check: Debug mode enabled for development
   App Check debug token: ABC123...
   ```
3. Add debug token in Firebase Console:
   - Go to App Check → Settings → Debug tokens
   - Add the token
4. Your local app will now send valid App Check tokens

### Production

Production automatically uses reCAPTCHA v3:
- Runs invisibly in background
- No user interaction required
- Tokens auto-refresh
- Works with all authenticated and unauthenticated users

## Verification

### Check App Check is Working

**Browser Console (Development)**:
```
✅ App Check initialized successfully
```

**Browser Console (Production)**:
```
✅ App Check initialized successfully
[App Check] Token successfully obtained
```

**Firebase Console**:
- Go to App Check → Metrics
- You should see request counts with valid tokens

### Test Enforcement

1. Open DevTools → Application → Clear site data
2. Disable JavaScript briefly to prevent token generation
3. Try to access Firestore
4. Should see: `Permission denied` or `App Check token invalid`

## Troubleshooting

### "App Check token invalid" errors

**Cause**: Enforcement is ON but tokens not being generated

**Fix**:
1. Check `VITE_FIREBASE_RECAPTCHA_SITE_KEY` is set correctly
2. Verify domain is registered in Firebase Console
3. Check browser console for App Check errors
4. Temporarily disable enforcement to isolate issue

### "Debug token not recognized"

**Cause**: Debug token not added to Firebase Console

**Fix**:
1. Copy token from browser console
2. Add in Firebase Console → App Check → Debug tokens
3. Refresh your app

### reCAPTCHA errors

**Cause**: reCAPTCHA blocked by ad blockers or privacy tools

**Fix**:
1. Whitelist your domain in privacy tools
2. Consider using App Attest for iOS/Android apps instead

## Security Best Practices

### ✅ Do's
- Enable enforcement for all Firebase services in production
- Monitor App Check metrics regularly
- Rotate debug tokens periodically
- Use different Firebase projects for dev/staging/prod

### ❌ Don'ts
- Don't commit `.env.local` with real keys to Git
- Don't enable enforcement without testing first
- Don't share debug tokens publicly
- Don't disable App Check in production without good reason

## Cost Considerations

**reCAPTCHA v3**: Free tier includes:
- 1 million assessments/month
- Beyond that: $1 per 1,000 assessments

**Expected Usage**:
- Each app load: 1 assessment
- Token refresh: 1 assessment every ~30 minutes
- Estimate: 100 daily users = ~7,000 assessments/month (well within free tier)

## Next Steps

1. **Immediate**: Complete Firebase Console setup (Steps 1-3 above)
2. **Before Production**: Test thoroughly in unenforced mode
3. **Production Launch**: Enable enforcement
4. **Post-Launch**: Monitor metrics weekly

## Reference Links

- [Firebase App Check Docs](https://firebase.google.com/docs/app-check)
- [reCAPTCHA v3 Setup](https://cloud.google.com/recaptcha-enterprise/docs/quickstart)
- Your Firebase Console: https://console.firebase.google.com/project/building-management-90bb2/appcheck

---

**Status**: Ready to configure in Firebase Console  
**Priority**: High (recommended before production)  
**Estimated Time**: 15 minutes
