# Security Guidelines

## Firebase Credentials Management

### ⚠️ IMPORTANT: Credentials Security

Your Firebase credentials have been **removed from the codebase** and are now managed securely through environment variables.

### What Was Fixed

1. **Removed hardcoded credentials** from `src/firebase/config.ts`
2. **Added environment variable validation** to ensure all required variables are present
3. **Created `.env.local`** for local development (not committed to Git)
4. **Updated `.gitignore`** to exclude all environment files
5. **Rewrote Git history** to remove credentials from GitHub

### Environment Variables Required

The following environment variables must be set:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Local Development

1. Copy `env.example` to `.env.local`
2. Fill in your actual Firebase credentials in `.env.local`
3. The `.env.local` file is automatically ignored by Git

### Production Deployment (Vercel)

1. Add the environment variables in your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add each variable with the correct values

### Security Best Practices

✅ **DO:**
- Use environment variables for all credentials
- Keep `.env.local` in your local machine only
- Use Vercel's environment variable system for production
- Regularly rotate your Firebase API keys

❌ **DON'T:**
- Never commit credentials to Git
- Never hardcode API keys in source code
- Never share `.env.local` files
- Never expose credentials in client-side code (use Firebase Security Rules)

### Firebase Security Rules

Ensure your Firebase Security Rules are properly configured:

```javascript
// Example Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Monitoring

- Monitor your Firebase usage in the Firebase Console
- Set up alerts for unusual activity
- Regularly review your Firebase project settings

### Emergency Response

If credentials are ever compromised:

1. **Immediately rotate** your Firebase API keys
2. **Update environment variables** in all deployment platforms
3. **Review Firebase logs** for unauthorized access
4. **Consider regenerating** the entire Firebase project if necessary 