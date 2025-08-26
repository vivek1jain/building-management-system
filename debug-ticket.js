// Debug script to check ticket activity log
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase config - you'll need to replace this with your actual config
const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTicketActivityLog() {
  try {
    const ticketRef = doc(db, 'tickets', '8nCBoXwHNBf7gwAwhDhL');
    const docSnap = await getDoc(ticketRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('🎫 Ticket Status:', data.status);
      console.log('📅 Completed Date:', data.completedDate?.toDate?.() || data.completedDate);
      console.log('\n📋 Activity Log:');
      
      if (data.activityLog && data.activityLog.length > 0) {
        data.activityLog.forEach((log, index) => {
          console.log(`[${index}] ${log.timestamp?.toDate?.() || log.timestamp}`);
          console.log(`    Action: "${log.action}"`);
          console.log(`    Description: "${log.description}"`);
          console.log(`    Metadata:`, log.metadata);
          console.log('');
        });
        
        // Test the completion detection logic
        console.log('\n🔍 Testing completion detection:');
        const completedActivity = data.activityLog.find(log => {
          const matches = (log.action === 'Status Updated' && log.description.includes('Complete')) ||
                         log.action.toLowerCase().includes('completed');
          if (matches) {
            console.log(`✅ Found match: "${log.action}" - "${log.description}"`);
          }
          return matches;
        });
        
        if (completedActivity) {
          console.log('✅ Completed activity found:', completedActivity);
          const daysSinceCompleted = Math.floor(
            (new Date().getTime() - new Date(completedActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          );
          console.log(`📅 Days since completed: ${daysSinceCompleted}`);
          console.log(`🚪 Can reopen: ${daysSinceCompleted <= 7}`);
        } else {
          console.log('❌ No completed activity found');
        }
      } else {
        console.log('No activity log found');
      }
    } else {
      console.log('Ticket not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTicketActivityLog();
