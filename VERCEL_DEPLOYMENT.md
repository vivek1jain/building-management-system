# Vercel Deployment Guide

This guide will help you deploy your Building Management System to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
3. **Firebase Project**: Ensure your Firebase project is properly configured

## Step 1: Prepare Your Repository

1. **Commit all changes** to your Git repository
2. **Push to GitHub/GitLab/Bitbucket**

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your Git repository
4. Vercel will automatically detect it's a Vite project
5. Configure the following settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel
   ```

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following environment variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 4: Configure Firebase for Production

1. **Update Firebase Security Rules**: Ensure your Firestore and Storage rules allow your Vercel domain
2. **Add Vercel Domain to Firebase Auth**: 
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

## Step 5: Test Your Deployment

1. Visit your deployed URL
2. Test all major functionality:
   - User registration/login
   - Ticket creation and management
   - Dashboard functionality
   - Firebase connectivity

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS settings as instructed

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes locally

2. **Firebase Connection Issues**:
   - Verify environment variables are set correctly
   - Check Firebase security rules
   - Ensure Vercel domain is authorized in Firebase

3. **Routing Issues**:
   - The `vercel.json` file handles React Router routing
   - All routes should redirect to `index.html`

### Environment Variables Reference:

```bash
# Required Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCU05i5ijemhu5_XOVK5V_QZTWbo8oe05E
VITE_FIREBASE_AUTH_DOMAIN=proper-213b7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proper-213b7
VITE_FIREBASE_STORAGE_BUCKET=proper-213b7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=140820685692
VITE_FIREBASE_APP_ID=1:140820685692:web:48b92fb67e144c8b27faf9

# Optional
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false
```

## Continuous Deployment

Once deployed, Vercel will automatically:
- Deploy new versions when you push to your main branch
- Create preview deployments for pull requests
- Provide automatic HTTPS certificates

## Performance Optimization

The current configuration includes:
- Code splitting for vendor and Firebase libraries
- Optimized asset caching
- Source maps disabled for production

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify Firebase configuration
3. Test locally with `npm run build && npm run preview` 