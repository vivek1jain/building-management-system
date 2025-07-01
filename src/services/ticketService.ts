import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { Ticket, CreateTicketForm, TicketStatus } from '../types'

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
        const storageRef = ref(storage, `tickets/${Date.now()}_${file.name}`)
        const snapshot = await uploadBytes(storageRef, file)
        const url = await getDownloadURL(snapshot.ref)
        uploadedUrls.push(url)
      }

      // Create ticket document
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

      const docRef = await addDoc(collection(db, TICKETS_COLLECTION), ticketDoc)
      return docRef.id
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
      
      return querySnapshot.docs.map(doc => ({
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
    } catch (error) {
      console.error('Error getting tickets:', error)
      throw new Error('Failed to fetch tickets')
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
    const q = query(
      collection(db, TICKETS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({
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
      
      callback(tickets)
    })
  }
} 