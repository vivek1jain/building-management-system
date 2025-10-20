#!/usr/bin/env node

// Script to create demo users for the Building Management System

console.log(`
===============================================
    Building Management System Demo Users
===============================================

Since we don't have Firebase Admin SDK set up, you'll need to create
demo users through the web interface.

1. Start the development server: npm run dev
2. Go to http://localhost:3003
3. Click "Create Account" on the login page
4. Create these demo users:

   📧 Email: manager@building.com
   🔒 Password: password123
   👤 Name: John Manager
   🔑 Role: manager (you'll need to update this in Firebase Console)

   📧 Email: supplier@building.com
   🔒 Password: password123
   👤 Name: ABC Plumbing
   🔑 Role: supplier (you'll need to update this in Firebase Console)

   📧 Email: requester@building.com
   🔒 Password: password123
   👤 Name: Jane Requester
   🔑 Role: requester (default)

5. After creating users, go to Firebase Console:
   - https://console.firebase.google.com/project/proper-213b7/firestore
   - Navigate to the 'users' collection
   - Update the 'role' field for manager and supplier accounts

ALTERNATIVELY: Install Firebase Admin SDK
==========================================
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a private key and save as 'serviceAccountKey.json'
3. Uncomment the Admin SDK code below
4. Run: node create-demo-users.js

===============================================
`);

// Uncomment this section after setting up Firebase Admin SDK:
/*
try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://proper-213b7-default-rtdb.asia-southeast1.firebasedatabase.app'
  });

  const auth = getAuth();
  const db = getFirestore();

  async function createDemoUsers() {
    const demoUsers = [
      {
        email: 'manager@building.com',
        password: 'password123',
        name: 'John Manager',
        role: 'manager'
      },
      {
        email: 'supplier@building.com',
        password: 'password123',
        name: 'ABC Plumbing',
        role: 'supplier'
      },
      {
        email: 'requester@building.com',
        password: 'password123',
        name: 'Jane Requester',
        role: 'requester'
      }
    ];

    for (const userData of demoUsers) {
      try {
        // Create Firebase Auth user
        const userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
        });

        // Create Firestore user document
        await db.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`ℹ️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Demo user creation completed!');
    process.exit(0);
  }

  createDemoUsers().catch(console.error);
} catch (error) {
  console.log('⚠️  Firebase Admin SDK not configured. Using manual instructions above.');
}
*/
