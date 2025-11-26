# Staging Environment Setup

Your local development environment is now configured to run like a **production staging environment** with all security features enabled.

## What's Enabled

### ✅ Security Features
- **No hardcoded credentials** - All Firebase config from environment variables
- **Error Boundary** - Catches all React errors to prevent crashes
- **Sentry Integration** - Error monitoring ready (optional, disabled by default)
- **Production-ready code** - Runs with production-grade security

### ⚠️ Still Using Development Firestore Rules
Your app currently uses **development** Firestore security rules which are relaxed for testing. See below for production rules.

## Current Configuration

Your `.env.local` file:
```bash
# Firebase (Required)
VITE_FIREBASE_API_KEY=AIzaSyCU05i5ijemhu5_XOVK5V_QZTWbo8oe05E
VITE_FIREBASE_AUTH_DOMAIN=proper-213b7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proper-213b7
VITE_FIREBASE_STORAGE_BUCKET=proper-213b7.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=140820685692
VITE_FIREBASE_APP_ID=1:140820685692:web:48b92fb67e144c8b27faf9

# Sentry (Optional - disabled by default)
# VITE_SENTRY_DSN=  # Leave empty to disable
VITE_SENTRY_ENVIRONMENT=staging
```

## Running in Staging Mode

### Start Development Server
```bash
npm run dev
```

**What's different from before:**
- ✅ Firebase credentials are required (no fallbacks)
- ✅ Error boundary catches all crashes
- ✅ Sentry logs errors to console (but doesn't send to Sentry unless DSN is set)
- ✅ Production-ready error handling

### Test Error Handling

Try this in your browser console when the app is running:

```javascript
// Test error boundary
throw new Error('Test error - this should be caught by ErrorBoundary');
```

You should see a user-friendly error page instead of a blank screen.

## Optional: Enable Sentry Error Monitoring

If you want to test Sentry (completely optional):

### 1. Create Free Sentry Account
1. Go to https://sentry.io/signup/
2. Create a new project (React)
3. Copy your DSN (looks like: `https://abc123@o456789.ingest.sentry.io/123456`)

### 2. Add DSN to .env.local
```bash
VITE_SENTRY_DSN=https://YOUR_DSN_HERE
```

### 3. Restart Dev Server
```bash
npm run dev
```

### 4. Trigger Test Error
Open console and run:
```javascript
throw new Error('Test Sentry error tracking');
```

Check Sentry dashboard - you should see the error!

## Testing Production Security Rules

To test with **production** security rules (recommended before actual deployment):

### Option 1: Test Locally with Firebase Emulator
```bash
# Install emulator
npm install -g firebase-tools

# Copy production rules to test file
cp firestore.rules.production firestore.rules.test

# Start emulator with production rules
firebase emulators:start --import=./test-data
```

### Option 2: Create Staging Firebase Project

**Recommended for serious testing:**

1. Create new Firebase project: `your-app-staging`
2. Update `.env.local` with staging project credentials
3. Deploy production rules to staging:
   ```bash
   cp firestore.rules.production firestore.rules
   firebase deploy --only firestore:rules --project your-app-staging
   ```
4. Test thoroughly in staging before production

## What Breaks with Production Rules?

When you switch to production rules (`firestore.rules.production`), these will change:

### ❌ Will Stop Working (By Design)
- **Open user registration** - Users can't self-register (use invitation system)
- **Cross-building data access** - Users can only see their building's data
- **Financial record deletion** - No one can delete income/expense records
- **Public supplier access** - Suppliers require authentication

### ✅ Still Works
- All existing authenticated operations
- Role-based access control
- Manager/admin privileges
- Ticket creation and management

## Simulating Production

To run exactly like production:

### 1. Build Production Bundle
```bash
npm run build
npm run preview
```

This runs:
- Minified code
- Console statements stripped
- Production optimizations
- No source maps

### 2. Test Production Build
```bash
# Open http://localhost:4173
```

**Verify:**
- [ ] No console.log statements appear
- [ ] Errors are caught by Error Boundary
- [ ] App loads quickly
- [ ] All features work
- [ ] No TypeScript errors

## Environment Comparison

| Feature | Dev (Before) | Staging (Now) | Production |
|---------|-------------|---------------|------------|
| Firebase Credentials | Hardcoded fallbacks | From .env | From deploy platform |
| Error Boundary | ❌ No | ✅ Yes | ✅ Yes |
| Sentry | ❌ No | ⚠️ Optional | ✅ Yes |
| Console Logs | Visible | Visible | Stripped |
| Source Maps | Yes | Yes | No |
| Firestore Rules | Relaxed | Relaxed* | Strict |
| Security | Basic | Production-ready | Production-ready |

\* You can test with strict rules anytime

## Troubleshooting

### "Missing required Firebase environment variables"

**Cause:** .env.local not loaded or missing variables

**Fix:**
```bash
# Verify .env.local exists
ls -la .env.local

# Check contents
cat .env.local

# Restart dev server
npm run dev
```

### App won't start after changes

**Cause:** Sentry import error or missing package

**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify Sentry is installed
npm list @sentry/react
```

### Sentry not logging errors

**Cause:** No DSN configured (this is normal and intentional)

**Not a problem:** Sentry is optional. Leave VITE_SENTRY_DSN empty to disable.

## Next Steps

### Before Production Deployment:

1. **Test with Production Rules**
   - Create staging Firebase project
   - Deploy `firestore.rules.production`
   - Run full test suite
   - Verify multi-tenant isolation

2. **Set Up Real Sentry** (optional but recommended)
   - Create Sentry account
   - Add DSN to deployment platform
   - Test error tracking

3. **Enable Firebase App Check**
   - Follow `FIREBASE_APP_CHECK.md`
   - Start with monitor mode
   - Switch to enforcement after testing

4. **Final Security Audit**
   - Review `SECURITY_AUDIT.md`
   - Run security checklist
   - Test all user roles

## Support

- **Staging Issues:** Check `docs/` guides
- **Security Questions:** See `SECURITY_AUDIT.md`
- **Sentry Setup:** See `SENTRY_SETUP.md`
- **Firebase Rules:** See `SECURITY_AUDIT.md`

---

**Your app is now running in staging mode! 🚀**

All security features are active, and you're testing with production-grade code.
