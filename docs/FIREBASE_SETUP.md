# Firebase Setup Guide

## 🔧 Step 1: Deploy Security Rules

### Firestore Rules
1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules`
5. Click **Publish**

### Storage Rules
1. In Firebase Console, go to **Storage** → **Rules**
2. Replace the existing rules with the content from `storage.rules`
3. Click **Publish**

## 🔧 Step 2: Enable Services

### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Click **Save**

### Firestore Database
1. Go to **Firestore Database**
2. If not already created, click **Create database**
3. Choose **Start in test mode** (we'll secure it with rules)
4. Select a location close to your users

### Storage
1. Go to **Storage**
2. If not already created, click **Get started**
3. Choose **Start in test mode** (we'll secure it with rules)
4. Select a location close to your users

## 🔧 Step 3: Update Firebase Config

Make sure your `src/firebase/config.ts` has the correct configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 🔧 Step 4: Test the Setup

1. **Create Demo Users:**
   - Go to your app's login page
   - Click "Create Demo Users"
   - This will create test accounts

2. **Login and Test:**
   - Use any of the demo credentials
   - Try creating a ticket
   - Check if files upload correctly

## 🔧 Step 5: Security Rules Explained

### Firestore Rules
- **Users**: Can read/write their own data, managers can read all
- **Tickets**: Anyone authenticated can read/create, owners/managers can update
- **Suppliers**: Managers have full access, suppliers can read their own data
- **Events**: Anyone can read, only managers can create/update/delete

### Storage Rules
- **Tickets**: Authenticated users can upload files (max 5MB)
- **Profiles**: Users can upload their own profile pictures (max 2MB)

## 🚨 Troubleshooting

### "Missing or insufficient permissions" Error
1. Make sure you've deployed the security rules
2. Check that you're logged in
3. Verify the rules match your user's role

### File Upload Fails
1. Check Storage rules are deployed
2. Verify file size is under 5MB
3. Ensure file type is allowed (images, PDF, text)

### Authentication Issues
1. Make sure Email/Password auth is enabled
2. Check your Firebase config is correct
3. Verify the user exists in Authentication

## 🔒 Production Security

For production, consider:
1. **Stricter rules** - Limit access based on user roles
2. **Rate limiting** - Prevent abuse
3. **Data validation** - Ensure data integrity
4. **Backup strategy** - Regular data backups

## 📞 Support

If you encounter issues:
1. Check Firebase Console logs
2. Verify all services are enabled
3. Test with the demo users first
4. Check browser console for detailed error messages 