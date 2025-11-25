import { collection, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../firebase/config'

/**
 * Debug function to check ticket data and permissions
 * Call this from browser console: window.debugTickets()
 */
export const debugTickets = async () => {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser
    
    console.log('=== TICKET DEBUG INFO ===')
    console.log('Current User ID:', currentUser?.uid)
    console.log('Current User Email:', currentUser?.email)
    
    // Try to read tickets
    console.log('\nAttempting to read tickets...')
    try {
      const ticketsRef = collection(db, 'tickets')
      console.log('Got tickets collection reference')
      const snapshot = await getDocs(ticketsRef)
      console.log('Got tickets snapshot')
      
      console.log('\n--- TICKETS IN DATABASE ---')
      console.log('Total tickets:', snapshot.size)
      
      if (snapshot.size === 0) {
        console.log('❌ No tickets found in database')
      } else {
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data()
          console.log(`\nTicket ${index + 1}:`, {
            id: doc.id,
            title: data.title,
            buildingId: data.buildingId || 'MISSING',
            requestedBy: data.requestedBy || 'MISSING',
            status: data.status,
            createdAt: data.createdAt
          })
          
          // Check if this ticket belongs to current user
          if (currentUser && data.requestedBy === currentUser.uid) {
            console.log('  ✅ This ticket belongs to you!')
          } else if (currentUser) {
            console.log('  ❌ This ticket belongs to someone else')
            console.log('     Expected:', currentUser.uid)
            console.log('     Got:', data.requestedBy)
          }
        })
      }
    } catch (error: any) {
      console.error('❌ ERROR reading tickets:', error.message)
      if (error.code === 'permission-denied') {
        console.error('PERMISSION DENIED - Check Firestore rules')
      }
    }
    
    console.log('\n=== END DEBUG ===')
  } catch (error) {
    console.error('Debug error:', error)
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).debugTickets = debugTickets
}
