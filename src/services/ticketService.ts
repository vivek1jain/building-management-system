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
        })) || [],
        quoteRequests: doc.data().quoteRequests?.map((request: any) => ({
          ...request,
          sentAt: convertTimestamp(request.sentAt),
          updatedAt: convertTimestamp(request.updatedAt),
          validUntil: convertTimestamp(request.validUntil)
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
      console.log('📥 getTicketById called for:', id)
      const docRef = doc(db, TICKETS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('📋 Raw Firebase data for ticket:', { id, quoteRequests: data.quoteRequests?.length || 0, quotes: data.quotes?.length || 0 })
        
        const ticket = {
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
          })) || [],
          quoteRequests: data.quoteRequests?.map((request: any) => ({
            ...request,
            sentAt: convertTimestamp(request.sentAt),
            updatedAt: convertTimestamp(request.updatedAt),
            validUntil: convertTimestamp(request.validUntil)
          })) || []
        } as Ticket
        
        console.log('✅ Processed ticket data:', { id: ticket.id, quoteRequests: ticket.quoteRequests?.length || 0, quotes: ticket.quotes?.length || 0 })
        return ticket
      }
      console.log('❌ Ticket not found in Firebase:', id)
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

  // Request quotes from selected suppliers
  async requestQuotesFromSuppliers(ticketId: string, supplierIds: string[], userId: string): Promise<void> {
    try {
      console.log('🔄 requestQuotesFromSuppliers called with:', { ticketId, supplierIds, userId })
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')
      console.log('✅ Ticket found:', { id: ticket.id, currentQuoteRequests: ticket.quoteRequests?.length || 0 })

      // Get supplier details
      const { supplierService } = await import('./supplierService')
      const suppliers = await supplierService.getSuppliers()
      
      // Create quote request objects  
      const { QuoteRequestStatus } = await import('../types')
      const quoteRequests = supplierIds.map(supplierId => {
        const supplier = suppliers.find(s => s.id === supplierId)
        return {
          id: `${ticketId}-${supplierId}`,
          supplierId,
          supplierName: supplier?.name || 'Unknown Supplier',
          supplierEmail: supplier?.email || '',
          specialties: supplier?.specialties || [],
          sentAt: new Date(),
          status: QuoteRequestStatus.PENDING,
          quoteAmount: null,
          notes: null,
          validUntil: null,
          isWinner: false,
          rejectionReason: null,
          responseTime: null
        }
      })
      
      console.log('📝 Created quote requests:', quoteRequests)
      console.log('📊 Existing quote requests:', ticket.quoteRequests?.length || 0)
      
      const finalQuoteRequests = [...(ticket.quoteRequests || []), ...quoteRequests]
      console.log('🔗 Final quote requests array:', finalQuoteRequests.length)

      // Update ticket status to Quoting and store quote requests
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quotes Requested',
        description: `Quote requests sent to ${supplierIds.length} supplier(s)`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { supplierIds, quoteRequestCount: supplierIds.length }
      }

      console.log('💾 About to update Firebase with:', {
        status: 'Quoting',
        quoteRequestsCount: finalQuoteRequests.length,
        activityLogCount: [...ticket.activityLog, activityLogEntry].length
      })

      await updateDoc(docRef, {
        status: 'Quoting' as TicketStatus,
        quoteRequests: finalQuoteRequests,
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Firebase update completed successfully')

      // Send quote request emails
      await supplierService.requestQuotes(ticketId, supplierIds, userId)
    } catch (error) {
      console.error('Error requesting quotes from suppliers:', error)
      throw new Error('Failed to request quotes from suppliers')
    }
  },

  // Add quote to ticket (when supplier responds)
  async addQuoteToTicket(ticketId: string, quote: any, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      const newQuote = {
        ...quote,
        id: Date.now().toString(),
        submittedAt: new Date(),
        responseReceivedAt: new Date()
      }

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Received',
        description: `Quote received from ${quote.supplierName} - ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(quote.amount)}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          supplierId: quote.supplierId, 
          supplierName: quote.supplierName, 
          quoteAmount: quote.amount 
        }
      }

      await updateDoc(docRef, {
        quotes: [...ticket.quotes, newQuote],
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding quote to ticket:', error)
      throw new Error('Failed to add quote to ticket')
    }
  },

  // Select winning quote and proceed to scheduling
  async selectWinningQuote(ticketId: string, quoteId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      // Find the selected quote
      const selectedQuote = ticket.quotes.find(q => q.id === quoteId)
      if (!selectedQuote) throw new Error('Selected quote not found')

      // Update quotes to mark winner and rejected quotes
      const updatedQuotes = ticket.quotes.map(quote => ({
        ...quote,
        status: quote.id === quoteId ? 'accepted' : 'declined',
        isWinner: quote.id === quoteId
      }))

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Selected',
        description: `Winning quote selected from ${selectedQuote.supplierName} - ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(selectedQuote.amount)}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          winningQuoteId: quoteId,
          supplierId: selectedQuote.supplierId, 
          supplierName: selectedQuote.supplierName,
          winningAmount: selectedQuote.amount
        }
      }

      await updateDoc(docRef, {
        quotes: updatedQuotes,
        assignedTo: selectedQuote.supplierId,
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })

      // Send confirmation/rejection emails to suppliers
      await this.sendQuoteSelectionEmails(ticketId, selectedQuote, ticket.quotes.filter(q => q.id !== quoteId))
    } catch (error) {
      console.error('Error selecting winning quote:', error)
      throw new Error('Failed to select winning quote')
    }
  },

  // Send quote selection emails (mock implementation)
  async sendQuoteSelectionEmails(ticketId: string, winningQuote: any, rejectedQuotes: any[]): Promise<void> {
    try {
      // Import email service dynamically
      const { emailService } = await import('./emailService')
      
      // Send winner confirmation email
      await emailService.sendQuoteWinnerEmail({
        ticketId,
        supplierId: winningQuote.supplierId,
        supplierEmail: winningQuote.supplierEmail || winningQuote.submittedBy,
        supplierName: winningQuote.supplierName,
        winningAmount: winningQuote.amount,
        quoteDetails: winningQuote
      })

      // Send rejection emails to other suppliers
      for (const rejectedQuote of rejectedQuotes) {
        await emailService.sendQuoteRejectionEmail({
          ticketId,
          supplierId: rejectedQuote.supplierId,
          supplierEmail: rejectedQuote.supplierEmail || rejectedQuote.submittedBy,
          supplierName: rejectedQuote.supplierName,
          rejectedAmount: rejectedQuote.amount
        })
      }
    } catch (error) {
      console.warn('Failed to send quote selection emails:', error)
      // Don't throw error - email failures shouldn't block the workflow
    }
  },

  // Update quote request with quote information
  async updateQuoteRequest(ticketId: string, supplierId: string, quoteData: { amount: number, description: string, terms: string, validUntil: Date }, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      // Update the specific quote request
      const { QuoteRequestStatus } = await import('../types')
      const updatedQuoteRequests = ticket.quoteRequests?.map(req => 
        req.supplierId === supplierId
          ? { 
              ...req, 
              status: QuoteRequestStatus.RECEIVED, 
              quoteAmount: quoteData.amount, 
              notes: quoteData.description,
              validUntil: quoteData.validUntil,
              updatedAt: new Date() 
            }
          : req
      ) || []

      // Also add to quotes array for compatibility
      const supplierName = updatedQuoteRequests.find(req => req.supplierId === supplierId)?.supplierName || 'Unknown Supplier'
      const newQuote = {
        id: Date.now().toString(),
        supplierId,
        supplierName,
        amount: quoteData.amount,
        currency: 'GBP',
        description: quoteData.description,
        terms: quoteData.terms,
        validUntil: quoteData.validUntil,
        status: 'pending',
        submittedAt: new Date(),
        responseReceivedAt: new Date()
      }

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Received',
        description: `Quote received from ${supplierName} - ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(quoteData.amount)}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          supplierId, 
          supplierName, 
          quoteAmount: quoteData.amount 
        }
      }

      await updateDoc(docRef, {
        quoteRequests: updatedQuoteRequests,
        quotes: [...ticket.quotes, newQuote],
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating quote request:', error)
      throw new Error('Failed to update quote request')
    }
  },

  // Get quotes for a ticket with enhanced data
  async getTicketQuotes(ticketId: string): Promise<any[]> {
    try {
      const ticket = await this.getTicketById(ticketId)
      if (!ticket) throw new Error('Ticket not found')
      
      return ticket.quotes || []
    } catch (error) {
      console.error('Error getting ticket quotes:', error)
      throw new Error('Failed to get ticket quotes')
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
            })) || [],
            quoteRequests: data.quoteRequests?.map((request: any) => ({
              ...request,
              sentAt: convertTimestamp(request.sentAt),
              updatedAt: convertTimestamp(request.updatedAt),
              validUntil: convertTimestamp(request.validUntil)
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