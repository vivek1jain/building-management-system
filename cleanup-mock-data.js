// Cleanup script to remove mock/sample data from Firebase
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up your service account key)
// admin.initializeApp({
//   credential: admin.credential.cert(require('./path-to-service-account-key.json')),
//   projectId: 'your-project-id'
// });

const db = admin.firestore();

async function cleanupMockData() {
  try {
    console.log('Starting cleanup of mock data...');
    
    // Clean up service charge demands with mock resident names
    const serviceChargeQuery = await db.collection('serviceChargeDemands')
      .where('residentName', '>=', 'Resident of')
      .where('residentName', '<=', 'Resident of\uf8ff')
      .get();
    
    console.log(`Found ${serviceChargeQuery.size} mock service charge demands`);
    
    const batch = db.batch();
    serviceChargeQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Clean up flat ledger transactions
    const ledgerQuery = await db.collection('flatLedgerTransactions').get();
    console.log(`Found ${ledgerQuery.size} ledger transactions to review`);
    
    ledgerQuery.docs.forEach(doc => {
      const data = doc.data();
      // Remove transactions with mock resident names or test data
      if (data.residentName && data.residentName.includes('Resident of')) {
        batch.delete(doc.ref);
      }
    });
    
    // Clean up resident account ledgers
    const accountQuery = await db.collection('residentAccountLedgers').get();
    console.log(`Found ${accountQuery.size} account ledgers to review`);
    
    accountQuery.docs.forEach(doc => {
      const data = doc.data();
      if (data.residentName && data.residentName.includes('Resident of')) {
        batch.delete(doc.ref);
      }
    });
    
    // Clean up account transactions
    const transactionQuery = await db.collection('accountTransactions').get();
    console.log(`Found ${transactionQuery.size} account transactions to review`);
    
    transactionQuery.docs.forEach(doc => {
      const data = doc.data();
      if (data.residentName && data.residentName.includes('Resident of')) {
        batch.delete(doc.ref);
      }
    });
    
    // Execute the batch delete
    await batch.commit();
    console.log('Mock data cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Uncomment to run cleanup
// cleanupMockData();

module.exports = { cleanupMockData };
