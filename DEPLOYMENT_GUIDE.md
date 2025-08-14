# Vercel Deployment Guide - Building Management System

## 🚨 Critical Steps to Prevent Functionality Loss

### 1. Environment Variables Setup

**MUST SET IN VERCEL DASHBOARD:**
```bash
# Firebase Configuration (REQUIRED)
VITE_FIREBASE_API_KEY=AIzaSyCU05i5ijemhu5_XOVK5V_QZTWbo8oe05E
VITE_FIREBASE_AUTH_DOMAIN=proper-213b7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proper-213b7
VITE_FIREBASE_STORAGE_BUCKET=proper-213b7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=140820685692
VITE_FIREBASE_APP_ID=1:140820685692:web:48b92fb67e144c8b27faf9

# Application Configuration
VITE_APP_NAME=Building Management System
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
NODE_ENV=production
```

### 2. Pre-Deployment Checklist

**Before Each Deployment:**
- [ ] All environment variables set in Vercel dashboard
- [ ] Firebase rules configured for production
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] Build passes locally (`npm run build`)
- [ ] All services have proper error handling
- [ ] Mock data fallbacks are in place

### 3. Common Issues & Solutions

#### Issue: Firebase Connection Fails
**Symptoms:** Authentication errors, data not loading
**Solution:** 
- Verify all Firebase env vars are set in Vercel
- Check Firebase project settings match env vars
- Ensure Firebase rules allow production domain

#### Issue: Routes Not Working (404 errors)
**Symptoms:** Direct URL access fails, refresh breaks app
**Solution:** 
- Verify `vercel.json` has proper rewrites configuration
- Ensure all routes are client-side routes

#### Issue: Build Failures
**Symptoms:** Deployment fails during build step
**Solution:**
- Check for TypeScript errors: `npm run type-check`
- Verify all imports are correct
- Check for missing dependencies

#### Issue: Features Not Working in Production
**Symptoms:** Components render but functionality broken
**Solution:**
- Check browser console for errors
- Verify API calls are using correct URLs
- Check Firebase security rules

### 4. Firebase Security Rules for Production

**Firestore Rules (`firestore.rules`):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their building data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules (`storage.rules`):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Vercel Domain Configuration

**Add to Vercel Environment Variables:**
```bash
VITE_ALLOWED_DOMAINS=your-domain.com,your-app.vercel.app
```

**Update Firebase Authentication:**
- Add Vercel domain to Firebase Auth authorized domains
- Add production domain to Firebase Auth authorized domains

### 6. Performance Optimization

**Vite Build Configuration (`vite.config.ts`):**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react', '@headlessui/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### 7. Monitoring & Debugging

**Add to main.tsx for production debugging:**
```typescript
if (import.meta.env.PROD) {
  console.log('🚀 Production build deployed successfully');
  console.log('📊 Environment check:', {
    hasFirebaseConfig: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    buildTime: new Date().toISOString()
  });
}
```

### 8. Deployment Commands

**Local Testing:**
```bash
# Test production build locally
npm run build
npm run preview

# Type checking
npm run type-check

# Lint checking
npm run lint
```

**Vercel CLI Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 9. Post-Deployment Verification

**Test These Features:**
- [ ] User authentication (login/logout)
- [ ] Building selection and data filtering
- [ ] CRUD operations (Create, Read, Update, Delete)
- [ ] File uploads
- [ ] Service charge generation
- [ ] Ticket creation and management
- [ ] Events management
- [ ] Financial calculations

### 10. Rollback Plan

**If Deployment Fails:**
1. Check Vercel deployment logs
2. Verify environment variables
3. Test build locally with production env vars
4. Use Vercel CLI to redeploy previous version:
   ```bash
   vercel rollback [deployment-url]
   ```

### 11. Firebase Configuration Verification

**Test Firebase Connection:**
```typescript
// Add to a test component
const testFirebaseConnection = async () => {
  try {
    const testDoc = await getDocs(collection(db, 'test'));
    console.log('✅ Firebase connected successfully');
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
};
```

## 🔧 Emergency Fixes

### If Authentication Breaks:
1. Check Firebase Auth domain settings
2. Verify environment variables
3. Check browser console for CORS errors

### If Data Loading Fails:
1. Check Firestore security rules
2. Verify collection names match code
3. Check network tab for failed requests

### If Build Fails:
1. Run `npm run type-check` locally
2. Fix all TypeScript errors
3. Verify all imports are correct
4. Check for missing environment variables

## 📞 Support Checklist

Before reporting issues:
- [ ] Checked Vercel deployment logs
- [ ] Verified environment variables
- [ ] Tested locally with production build
- [ ] Checked Firebase console for errors
- [ ] Verified all dependencies are installed
