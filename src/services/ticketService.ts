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
      } catch (firestoreError: any) {
        console.error('🚨 FIREBASE WRITE FAILED:', {
          error: firestoreError.message,
          code: firestoreError.code,
          details: firestoreError
        })
        
        if (firestoreError.code === 'permission-denied') {
          console.error('❌ PERMISSION DENIED - Check:')
          console.error('   1. User is authenticated')
          console.error('   2. User document exists in Firestore')
          console.error('   3. Firestore rules allow writes to tickets collection')
        }
        
        // Throw error instead of falling back to mock data
        throw new Error(`Failed to create ticket in Firebase: ${firestoreError.message}`)
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
      
      console.log('Returning Firebase tickets:', firebaseTickets.length)
      return firebaseTickets
      
    } catch (error) {
      console.error('Firebase query failed:', error)
      throw new Error('Failed to fetch tickets from Firebase')
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
        status: 'Quoting' as TicketStatus,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding quote:', error)
      throw new Error('Failed to add quote')
    }
  },

  // Add activity log entry to ticket
  async addActivityLogEntry(ticketId: string, action: string, description: string, userId: string, metadata: any = {}): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      const activityLogEntry = {
        id: Date.now().toString(),
        action,
        description,
        performedBy: userId,
        timestamp: new Date(),
        metadata
      }

      await updateDoc(docRef, {
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding activity log entry:', error)
      throw new Error('Failed to add activity log entry')
    }
  },

  // Schedule ticket with specific date/time
  async scheduleTicket(ticketId: string, scheduledDate: Date, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Scheduled',
        description: `Work scheduled for ${scheduledDate.toLocaleString()}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { scheduledDate: scheduledDate.toISOString() }
      }

      await updateDoc(docRef, {
        status: 'Scheduled',
        scheduledDate,
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error scheduling ticket:', error)
      throw new Error('Failed to schedule ticket')
    }
  },

  // Reschedule ticket with new date/time
  async rescheduleTicket(ticketId: string, newScheduledDate: Date, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      const oldDate = ticket.scheduledDate ? ticket.scheduledDate.toLocaleString() : 'Unknown'
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Rescheduled',
        description: `Work rescheduled from ${oldDate} to ${newScheduledDate.toLocaleString()}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          oldScheduledDate: ticket.scheduledDate?.toISOString(),
          newScheduledDate: newScheduledDate.toISOString() 
        }
      }

      await updateDoc(docRef, {
        scheduledDate: newScheduledDate,
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error rescheduling ticket:', error)
      throw new Error('Failed to reschedule ticket')
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
        callback(tickets)
      }, (error) => {
        // Handle Firebase errors (including permission-denied)
        console.error('Firebase snapshot listener error:', error)
        callback([])
      })
    } catch (error) {
      console.error('Firebase tickets subscription failed:', error)
      callback([])
      // Return empty unsubscribe function
      return () => {}
    }
  }
} 