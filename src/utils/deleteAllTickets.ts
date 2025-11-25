import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

const TICKETS_COLLECTION = 'tickets'

/**
 * Utility function to delete all tickets from Firebase
 * WARNING: This will permanently delete ALL tickets in the database
 */
export const deleteAllTickets = async (): Promise<void> => {
  try {
    
    // Get all tickets
    const ticketsCollection = collection(db, TICKETS_COLLECTION)
    const snapshot = await getDocs(ticketsCollection)
    
    
    if (snapshot.size === 0) {
      return
    }
    
    // Delete each ticket
    const deletePromises = snapshot.docs.map(async (ticketDoc) => {
      await deleteDoc(doc(db, TICKETS_COLLECTION, ticketDoc.id))
    })
    
    await Promise.all(deletePromises)
    
  } catch (error) {
    console.error('❌ Error deleting tickets:', error)
    throw error
  }
}

// Note: This utility can be used both in browser and Node.js environments
