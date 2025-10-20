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
          supplierName: supplier?.companyName || 'Unknown Supplier',
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

      try {
        await updateDoc(docRef, {
          status: 'Quoting' as TicketStatus,
          quoteRequests: finalQuoteRequests,
          activityLog: [...ticket.activityLog, activityLogEntry],
          updatedAt: serverTimestamp()
        })
        
        console.log('✅ Firebase update completed successfully')
        
        // Verify the update by fetching the ticket again
        const updatedTicket = await this.getTicketById(ticketId)
        console.log('🔍 Post-update verification:', {
          ticketId,
          status: updatedTicket?.status,
          quoteRequestsLength: updatedTicket?.quoteRequests?.length || 0,
          activityLogLength: updatedTicket?.activityLog?.length || 0
        })
      } catch (updateError) {
        console.error('❌ Firebase update failed:', updateError)
        throw updateError
      }

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
  async selectWinningQuote(ticketId: string, supplierId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      // Find the selected quote request
      const selectedQuoteRequest = ticket.quoteRequests?.find(req => req.supplierId === supplierId)
      if (!selectedQuoteRequest) throw new Error('Selected quote request not found')
      if (!selectedQuoteRequest.quoteAmount) throw new Error('Quote request has no quote amount')

      // Update quote requests to mark winner and others as rejected
      const { QuoteRequestStatus } = await import('../types')
      const updatedQuoteRequests = ticket.quoteRequests?.map(req => ({
        ...req,
        status: req.supplierId === supplierId ? QuoteRequestStatus.ACCEPTED : req.status === QuoteRequestStatus.RECEIVED ? QuoteRequestStatus.REJECTED : req.status,
        isWinner: req.supplierId === supplierId
      })) || []

      // Also update quotes array for compatibility - find the corresponding quote
      const selectedQuote = ticket.quotes.find(q => q.supplierId === supplierId)
      const updatedQuotes = ticket.quotes.map(quote => ({
        ...quote,
        status: quote.supplierId === supplierId ? 'accepted' : 'declined',
        isWinner: quote.supplierId === supplierId
      }))

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Selected',
        description: `Winning quote selected from ${selectedQuoteRequest.supplierName} - ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(selectedQuoteRequest.quoteAmount)}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          winningSupplierId: supplierId,
          supplierName: selectedQuoteRequest.supplierName,
          winningAmount: selectedQuoteRequest.quoteAmount
        }
      }

      await updateDoc(docRef, {
        quoteRequests: updatedQuoteRequests,
        quotes: updatedQuotes,
        assignedTo: supplierId,
        // Keep status as 'Quoting' - winner selection happens within the Quoting phase
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: serverTimestamp()
      })

      // Send confirmation/rejection emails to suppliers if quotes exist
      if (selectedQuote) {
        const rejectedQuotes = ticket.quotes.filter(q => q.supplierId !== supplierId)
        await this.sendQuoteSelectionEmails(ticketId, selectedQuote, rejectedQuotes)
      }
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

  // Check if a Complete ticket can be reopened (within 7 days by managers/admins)
  async canTicketBeReopened(ticketId: string): Promise<{ canReopen: boolean; daysRemaining: number; reason?: string }> {
    try {
      const ticket = await this.getTicketById(ticketId)
      if (!ticket) {
        return { canReopen: false, daysRemaining: 0, reason: 'Ticket not found' }
      }

      if (ticket.status !== 'Complete') {
        return { canReopen: false, daysRemaining: 0, reason: 'Ticket is not in Complete status' }
      }

      // Find when the ticket was completed from activity log
      const completedActivity = ticket.activityLog.find(log => 
        (log.action === 'Status Updated' && log.description.includes('Complete')) ||
        log.action.toLowerCase().includes('completed')
      )

      if (!completedActivity) {
        return { canReopen: false, daysRemaining: 0, reason: 'No completion activity found' }
      }

      const completedDate = new Date(completedActivity.timestamp)
      const daysSinceCompleted = Math.floor(
        (new Date().getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysRemaining = Math.max(0, 7 - daysSinceCompleted)
      
      return {
        canReopen: daysSinceCompleted <= 7,
        daysRemaining,
        reason: daysSinceCompleted > 7 ? '7-day reopening window has expired' : undefined
      }
    } catch (error) {
      console.error('Error checking if ticket can be reopened:', error)
      return { canReopen: false, daysRemaining: 0, reason: 'Error checking reopening eligibility' }
    }
  },

  // Reopen a Complete ticket back to Scheduled status
  async reopenTicket(ticketId: string, userId: string, reason?: string): Promise<void> {
    try {
      const reopenCheck = await this.canTicketBeReopened(ticketId)
      if (!reopenCheck.canReopen) {
        throw new Error(`Cannot reopen ticket: ${reopenCheck.reason}`)
      }

      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const ticket = await this.getTicketById(ticketId)
      
      if (!ticket) throw new Error('Ticket not found')

      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Ticket Reopened',
        description: `Ticket reopened from Complete status${reason ? `: ${reason}` : ''}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          previousStatus: 'Complete',
          newStatus: 'Scheduled',
          reopenReason: reason,
          daysRemainingWhenReopened: reopenCheck.daysRemaining
        }
      }

      await updateDoc(docRef, {
        status: 'Scheduled',
        updatedAt: serverTimestamp(),
        activityLog: [...ticket.activityLog, activityLogEntry]
      })
    } catch (error) {
      console.error('Error reopening ticket:', error)
      throw new Error('Failed to reopen ticket')
    }
  },

  // Complete ticket with final cost and expense forecast creation
  async completeTicket(
    ticketId: string, 
    userId: string, 
    finalCost: number,
    notes?: string
  ): Promise<void> {
    console.log('🏁 completeTicket method called with:', { ticketId, userId, finalCost, notes });
    try {
      console.log('📄 Creating document reference...');
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      console.log('✅ Document reference created');
      
      console.log('📥 Fetching ticket data...');
      const ticket = await this.getTicketById(ticketId)
      console.log('📋 Ticket data received:', { 
        id: ticket?.id, 
        status: ticket?.status, 
        buildingId: ticket?.buildingId 
      });
      
      console.log('🔍 Validating inputs...');
      if (!ticket) throw new Error('Ticket not found')
      if (!finalCost || finalCost <= 0) throw new Error('Final cost is required and must be greater than 0')
      console.log('✅ Input validation passed');

      // Find supplier information from accepted quote, direct assignment, or activity log
      let supplierId: string | undefined
      let supplierName: string | undefined
      
      console.log('🔍 Checking ticket.quoteRequests:', { hasQuoteRequests: !!ticket.quoteRequests, quoteRequestsType: typeof ticket.quoteRequests, quoteRequestsValue: ticket.quoteRequests });
      
      // 1. Check for accepted quote (quoting workflow)
      if (ticket.quoteRequests) {
        console.log('🔍 Finding accepted quote in quoteRequests...');
        const acceptedQuote = ticket.quoteRequests.find(req => req.status === 'Accepted' || req.isWinner)
        console.log('🔍 Accepted quote search result:', acceptedQuote);
        
        if (acceptedQuote) {
          supplierId = acceptedQuote.supplierId
          supplierName = acceptedQuote.supplierName
          console.log('✅ Found supplier from accepted quote:', { supplierId, supplierName });
        }
      }
      
      // 2. Check activity log for direct scheduling supplier assignment
      if (!supplierId && ticket.activityLog) {
        console.log('🔍 Searching activity log for supplier assignment...');
        const supplierActivity = ticket.activityLog
          .slice() // Create copy to avoid mutating original
          .reverse() // Start from most recent
          .find(log => 
            log.action === 'Supplier Assigned' && 
            log.metadata && 
            log.metadata.supplierName
          );
        
        console.log('🔍 Supplier activity search result:', supplierActivity);
        
        if (supplierActivity && supplierActivity.metadata) {
          // For direct scheduling, we may not have a real supplierId, so use a generated one
          supplierId = `scheduled-${supplierActivity.metadata.supplierName.toLowerCase().replace(/\s+/g, '-')}`
          supplierName = supplierActivity.metadata.supplierName
          console.log('✅ Found supplier from activity log (direct scheduling):', { supplierId, supplierName });
        }
      }
      
      // 3. Data integrity check - tickets should only reach Complete if they have supplier info
      if (!supplierId) {
        console.error('⚠️  DATA INTEGRITY WARNING: Ticket completed without supplier information!');
        console.error('📊 Ticket completion data:', {
          ticketId: ticket.id,
          status: ticket.status,
          hasQuoteRequests: !!ticket.quoteRequests,
          quoteRequestsCount: ticket.quoteRequests?.length || 0,
          activityLogCount: ticket.activityLog?.length || 0,
          hasAssignedTo: !!ticket.assignedTo,
          assignedTo: ticket.assignedTo
        });
        console.error('🔍 Activity log actions:', ticket.activityLog?.map(log => log.action) || []);
        
        // This indicates a workflow violation - the ticket should not have reached Complete status
        // without going through either the quote workflow or direct scheduling workflow
        console.warn('💡 This suggests the ticket workflow was not followed correctly.');
      }

      console.log('📝 Creating activity log entry...');
      
      // Create metadata object, filtering out undefined values to prevent Firebase errors
      const baseMetadata: any = {
        previousStatus: ticket.status,
        finalCost,
        gracePeriodExpires: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      }
      
      // Only add supplier info if it exists
      if (supplierId) baseMetadata.supplierId = supplierId
      if (supplierName) baseMetadata.supplierName = supplierName
      if (notes) baseMetadata.completionNotes = notes
      
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Work Completed',
        description: `Work completed with final cost of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(finalCost)}${notes ? `. ${notes}` : ''}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: baseMetadata
      }
      console.log('✅ Activity log entry created:', { action: activityLogEntry.action, description: activityLogEntry.description, metadataKeys: Object.keys(baseMetadata) });

      // Update ticket with completion data
      console.log('📝 Updating ticket document with completion data...');
      console.log('📊 Update payload:', {
        status: 'Complete',
        completedDateType: typeof serverTimestamp(),
        activityLogLength: [...ticket.activityLog, activityLogEntry].length,
        finalCost,
        finalCostCurrency: 'GBP'
      });
      
      try {
        console.log('🔄 Calling updateDoc...');
        const updateResult = await updateDoc(docRef, {
          status: 'Complete',
          completedDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
          activityLog: [...ticket.activityLog, activityLogEntry],
          // Store final cost in ticket for reference
          finalCost,
          finalCostCurrency: 'GBP'
        })
        console.log('✅ updateDoc completed, result:', updateResult);
        console.log('✅ Ticket document updated successfully');
      } catch (updateError: any) {
        console.error('❌ Error updating ticket document:', updateError);
        console.error('❌ Error code:', updateError?.code);
        console.error('❌ Error message:', updateError?.message);
        console.error('❌ Full error object:', updateError);
        
        // Check for specific Firebase errors
        if (updateError?.code === 'permission-denied') {
          console.error('🚫 PERMISSION DENIED - Check Firestore rules for ticket updates');
        } else if (updateError?.code === 'unavailable') {
          console.error('📡 FIREBASE UNAVAILABLE - Check network connection');
        } else if (updateError?.code === 'not-found') {
          console.error('🔍 DOCUMENT NOT FOUND - Ticket may have been deleted');
        }
        
        throw new Error(`Firebase update failed: ${updateError?.message || updateError}`);
      }

      // Create expense forecast record - always create for completed tickets with final costs
      console.log('📊 Checking expense forecast creation for completed ticket:', { 
        hasSupplierId: !!supplierId, 
        hasSupplierName: !!supplierName,
        finalCost,
        ticketId 
      });
      
      try {
        console.log('📊 Importing expense service...');
        const { expenseService } = await import('./expenseService')
        console.log('📊 Creating expense from ticket...');
        
        // Use supplier info if available, otherwise use defaults
        const expenseId = await expenseService.createExpenseFromTicket(
          ticketId,
          ticket.buildingId,
          finalCost,
          supplierId || 'unknown-supplier', // Default if no supplier
          supplierName || 'Unknown Supplier', // Default if no supplier name
          ticket.title,
          'reactive_maintenance', // Default category for ticket completion
          userId
        )
        
        console.log(`✅ Created forecast expense ${expenseId} for completed ticket ${ticketId}`);
        if (!supplierId || !supplierName) {
          console.log('📝 Note: Expense created with default supplier info - can be updated later');
        }
      } catch (expenseError) {
        console.error('❌ Failed to create expense forecast:', expenseError)
        console.error('❌ Expense creation error details:', {
          message: expenseError.message,
          ticketId,
          finalCost,
          supplierId,
          supplierName
        });
        // Don't fail the ticket completion if expense creation fails
      }

    } catch (error) {
      console.error('❌ Error completing ticket:', error)
      // Convert any error to a readable string for debugging
      const errorDetails = {
        message: error.message || 'Unknown error',
        name: error.name,
        stack: error.stack,
        toString: error.toString()
      };
      console.error('❌ Error details:', errorDetails);
      throw new Error(`Failed to complete ticket: ${errorDetails.message}`)
    }
  },

  // Get tickets that are eligible for auto-closure (Complete status for 7+ days)
  async getTicketsEligibleForAutoClosure(): Promise<Ticket[]> {
    try {
      const completeTicketsQuery = query(
        collection(db, TICKETS_COLLECTION),
        where('status', '==', 'Complete')
      )
      
      const querySnapshot = await getDocs(completeTicketsQuery)
      const eligibleTickets: Ticket[] = []
      
      for (const doc of querySnapshot.docs) {
        const ticket = {
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
          scheduledDate: convertTimestamp(doc.data().scheduledDate),
          completedDate: convertTimestamp(doc.data().completedDate),
          activityLog: doc.data().activityLog?.map((log: any) => ({
            ...log,
            timestamp: convertTimestamp(log.timestamp)
          })) || []
        } as Ticket
        
        // Check if it's been 7+ days since completion
        const completedActivity = ticket.activityLog.find(log => 
          (log.action === 'Status Updated' && log.description.includes('Complete')) ||
          log.action.toLowerCase().includes('completed')
        )
        
        if (completedActivity) {
          const daysSinceCompleted = Math.floor(
            (new Date().getTime() - new Date(completedActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysSinceCompleted >= 7) {
            eligibleTickets.push(ticket)
          }
        }
      }
      
      return eligibleTickets
    } catch (error) {
      console.error('Error getting tickets eligible for auto-closure:', error)
      throw new Error('Failed to get tickets eligible for auto-closure')
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