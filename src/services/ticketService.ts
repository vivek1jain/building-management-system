import { db, storage } from '../firebase/config'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'
import { Ticket, TicketStatus, UrgencyLevel, ActivityLogEntry, CreateTicketForm } from '../types'
import MockDataService from './mockDataService'

const TICKETS_COLLECTION = 'tickets'

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date()
}

export const ticketService = {
  // Create a new ticket
  async createTicket(ticketData: CreateTicketForm, attachments: File[], userId: string): Promise<string> {
    try {
      // Upload attachments first
      const uploadedUrls: string[] = []
      
      for (const file of attachments) {
        try {
          const storageRef = ref(storage, `tickets/${Date.now()}_${file.name}`)
          const snapshot = await uploadBytes(storageRef, file)
          const url = await getDownloadURL(snapshot.ref)
          uploadedUrls.push(url)
        } catch (storageError) {
          console.warn('File upload failed, continuing without attachment:', storageError)
          // Continue without attachments if storage fails
        }
      }

      // Create ticket document
      console.log('Creating ticket with data:', ticketData)
      const ticketDoc = {
        ...ticketData,
        attachments: uploadedUrls,
        requestedBy: userId,
        status: 'New' as TicketStatus,
        activityLog: [{
          id: Date.now().toString(),
          action: 'Ticket Created',
          description: 'Ticket created by user',
          performedBy: userId,
          timestamp: new Date(),
          metadata: {}
        }],
        quotes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      console.log('Final ticket document before Firebase save:', ticketDoc)

      try {
        const docRef = await addDoc(collection(db, TICKETS_COLLECTION), ticketDoc)
        console.log('Ticket created successfully in Firebase:', docRef.id)
        return docRef.id
      } catch (firestoreError) {
        console.warn('Firebase creation failed, falling back to mock data:', firestoreError)
        
        // Fallback: Add to mock data for development
        const mockTicketId = `ticket-${Date.now()}`
        const mockTicket = {
          id: mockTicketId,
          ...ticketData,
          attachments: uploadedUrls,
          requestedBy: userId,
          status: 'New' as TicketStatus,
          urgency: ticketData.urgency || 'medium',
          activityLog: [{
            id: Date.now().toString(),
            action: 'Ticket Created',
            description: 'Ticket created by user',
            performedBy: userId,
            timestamp: new Date(),
            metadata: {}
          }],
          quotes: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        // Import and add to mock data
        const { mockTickets } = await import('../services/mockData')
        mockTickets.push(mockTicket as any)
        
        console.log('Ticket added to mock data:', mockTicketId)
        return mockTicketId
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw new Error('Failed to create ticket')
    }
  },

  // Get all tickets
  async getTickets(): Promise<Ticket[]> {
    try {
      const q = query(
        collection(db, TICKETS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const firebaseTickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        scheduledDate: convertTimestamp(doc.data().scheduledDate),
        completedDate: convertTimestamp(doc.data().completedDate),
        activityLog: doc.data().activityLog?.map((log: any) => ({
          ...log,
          timestamp: convertTimestamp(log.timestamp)
        })) || [],
        quotes: doc.data().quotes?.map((quote: any) => ({
          ...quote,
          validUntil: convertTimestamp(quote.validUntil),
          submittedAt: convertTimestamp(quote.submittedAt)
        })) || []
      })) as Ticket[]
      
      // If we have Firebase tickets, return them
      if (firebaseTickets.length > 0) {
        console.log('Returning Firebase tickets:', firebaseTickets.length)
        return firebaseTickets
      }
      
      // Otherwise, fall back to mock data
      console.log('No Firebase tickets found, falling back to mock data')
      const { mockTickets } = await import('../services/mockData')
      return mockTickets
      
    } catch (error) {
      console.warn('Firebase query failed, falling back to mock data:', error)
      
      // Fallback to mock data when Firebase is unavailable
      try {
        const { mockTickets } = await import('../services/mockData')
        console.log('Returning mock tickets:', mockTickets.length)
        return mockTickets
      } catch (mockError) {
        console.error('Error loading mock tickets:', mockError)
        return []
      }
    }
  },

  // Get ticket by ID
  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          scheduledDate: convertTimestamp(data.scheduledDate),
          completedDate: convertTimestamp(data.completedDate),
          activityLog: data.activityLog?.map((log: any) => ({
            ...log,
            timestamp: convertTimestamp(log.timestamp)
          })) || [],
          quotes: data.quotes?.map((quote: any) => ({
            ...quote,
            validUntil: convertTimestamp(quote.validUntil),
            submittedAt: convertTimestamp(quote.submittedAt)
          })) || []
        } as Ticket
      }
      return null
    } catch (error) {
      console.error('Error getting ticket:', error)
      throw new Error('Failed to fetch ticket')
    }
  },

  // Update ticket status
  async updateTicketStatus(id: string, status: TicketStatus, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, id)
      const ticket = await this.getTicketById(id)
      
      if (!ticket) throw new Error('Ticket not found')

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Status Updated',
        description: `Status changed from ${ticket.status} to ${status}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { previousStatus: ticket.status, newStatus: status }
      }

      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
        activityLog: [...ticket.activityLog, activityLogEntry]
      })
    } catch (error) {
      console.error('Error updating ticket status:', error)
      throw new Error('Failed to update ticket status')
    }
  },

  // Add quote to ticket
  async addQuote(ticketId: string, quote: any): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      const newQuote = {
        ...quote,
        id: Date.now().toString(),
        submittedAt: new Date()
      }

      await updateDoc(docRef, {
        quotes: [...ticket.quotes, newQuote],
        status: 'Quote Received' as TicketStatus,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding quote:', error)
      throw new Error('Failed to add quote')
    }
  },

  // Subscribe to tickets changes
  subscribeToTickets(callback: (tickets: Ticket[]) => void) {
    try {
      // Try Firebase first
      const q = query(
        collection(db, TICKETS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      
      return onSnapshot(q, async (querySnapshot) => {
        const tickets = querySnapshot.docs.map(doc => {
          const data = doc.data()
          console.log('Firebase ticket data:', { id: doc.id, buildingId: data.buildingId, title: data.title })
          return {
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            scheduledDate: convertTimestamp(data.scheduledDate),
            completedDate: convertTimestamp(data.completedDate),
            activityLog: data.activityLog?.map((log: any) => ({
              ...log,
              timestamp: convertTimestamp(log.timestamp)
            })) || [],
            quotes: data.quotes?.map((quote: any) => ({
              ...quote,
              validUntil: convertTimestamp(quote.validUntil),
              submittedAt: convertTimestamp(quote.submittedAt)
            })) || []
          }
        }) as Ticket[]
        
        console.log('All Firebase tickets:', tickets.map(t => ({ id: t.id, buildingId: t.buildingId, title: t.title })))
        
        // If no Firebase tickets found, fall back to mock data
        if (tickets.length === 0) {
          console.log('No Firebase tickets found, falling back to mock data')
          try {
            const { mockTickets } = await import('../services/mockData')
            console.log('Using mock tickets:', mockTickets.length)
            callback(mockTickets)
          } catch (mockError) {
            console.error('Error loading mock tickets:', mockError)
            callback([])
          }
        } else {
          callback(tickets)
        }
      }, (error) => {
        // Handle Firebase errors (including permission-denied)
        console.warn('Firebase snapshot listener error, falling back to mock data:', error)
        import('../services/mockData').then(({ mockTickets }) => {
          console.log('Using mock tickets due to Firebase error:', mockTickets.length)
          callback(mockTickets)
        }).catch((mockError) => {
          console.error('Error loading mock tickets after Firebase error:', mockError)
          callback([])
        })
      })
    } catch (error) {
      console.error('Firebase tickets subscription failed, using mock data:', error)
      // Fallback to mock data
      import('../services/mockData').then(({ mockTickets }) => {
        console.log('Firebase subscription failed, using mock tickets:', mockTickets.length)
        callback(mockTickets)
      }).catch((mockError) => {
        console.error('Error loading mock tickets after Firebase failure:', mockError)
        callback([])
      })
      // Return empty unsubscribe function
      return () => {}
    }
  }
} 