import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Script to check and fix tickets that are missing buildingId
 * Run this in your browser console after importing or via a temporary page
 */
export const fixTicketBuildingIds = async (defaultBuildingId: string) => {
  try {
    console.log('🔍 Checking tickets for missing buildingId...')
    
    const ticketsRef = collection(db, 'tickets')
    const snapshot = await getDocs(ticketsRef)
    
    const ticketsWithoutBuilding: any[] = []
    const allTickets: any[] = []
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      allTickets.push({ id: doc.id, ...data })
      
      if (!data.buildingId) {
        ticketsWithoutBuilding.push({ id: doc.id, ...data })
      }
    })
    
    console.log('📊 Total tickets:', allTickets.length)
    console.log('⚠️  Tickets without buildingId:', ticketsWithoutBuilding.length)
    
    if (ticketsWithoutBuilding.length > 0) {
      console.log('🔧 Tickets to fix:', ticketsWithoutBuilding.map(t => ({
        id: t.id,
        title: t.title,
        requestedBy: t.requestedBy
      })))
      
      // Fix each ticket by assigning the default building
      for (const ticket of ticketsWithoutBuilding) {
        const ticketRef = doc(db, 'tickets', ticket.id)
        await updateDoc(ticketRef, {
          buildingId: defaultBuildingId
        })
        console.log(`✅ Fixed ticket ${ticket.id} - assigned to building ${defaultBuildingId}`)
      }
      
      console.log(`✅ Fixed ${ticketsWithoutBuilding.length} tickets`)
    } else {
      console.log('✅ All tickets have buildingId assigned')
    }
    
    return {
      total: allTickets.length,
      fixed: ticketsWithoutBuilding.length,
      tickets: allTickets
    }
  } catch (error) {
    console.error('❌ Error fixing tickets:', error)
    throw error
  }
}

// To run this script:
// 1. Open browser console on your app
// 2. Get your building ID from the building selector
// 3. Run: fixTicketBuildingIds('your-building-id-here')
