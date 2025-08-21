import { db } from '../firebase/config'
import { 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { QuoteRequest, QuoteRequestStatus } from '../types'

const TICKETS_COLLECTION = 'tickets'

export const quoteRequestService = {
  // Request quotes from suppliers
  async requestQuotes(ticketId: string, supplierIds: string[], userId: string): Promise<void> {
    try {
      console.log('🔄 Requesting quotes for ticket:', ticketId, 'from suppliers:', supplierIds)
      
      // Get supplier details
      const { supplierService } = await import('./supplierService')
      const suppliers = await supplierService.getSuppliers()
      
      // Get current ticket
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Ticket not found')
      }
      
      const ticketData = docSnap.data()
      console.log('📋 Current ticket data:', { id: ticketId, currentQuoteRequests: ticketData.quoteRequests?.length || 0 })
      
      // Create new quote requests
      const newQuoteRequests: QuoteRequest[] = supplierIds.map(supplierId => {
        const supplier = suppliers.find(s => s.id === supplierId)
        if (!supplier) {
          console.warn('Supplier not found:', supplierId)
        }
        
        return {
          id: `${ticketId}-${supplierId}-${Date.now()}`,
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
      
      console.log('📝 Created new quote requests:', newQuoteRequests.length)
      
      // Combine with existing quote requests
      const existingQuoteRequests = ticketData.quoteRequests || []
      const allQuoteRequests = [...existingQuoteRequests, ...newQuoteRequests]
      
      console.log('🔗 Total quote requests after addition:', allQuoteRequests.length)
      
      // Activity log entry
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quotes Requested',
        description: `Quote requests sent to ${supplierIds.length} supplier(s)`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { supplierIds, supplierCount: supplierIds.length }
      }
      
      // Update ticket
      await updateDoc(docRef, {
        status: 'Quoting',
        quoteRequests: allQuoteRequests,
        activityLog: [...(ticketData.activityLog || []), activityLogEntry],
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Quote requests saved to Firebase successfully')
      
    } catch (error) {
      console.error('❌ Error requesting quotes:', error)
      throw new Error('Failed to request quotes from suppliers')
    }
  },

  // Update quote amount when received
  async updateQuoteAmount(ticketId: string, supplierId: string, amount: number, notes?: string, validUntil?: Date, userId?: string): Promise<void> {
    try {
      console.log('💰 Updating quote amount:', { ticketId, supplierId, amount })
      
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Ticket not found')
      }
      
      const ticketData = docSnap.data()
      const quoteRequests = ticketData.quoteRequests || []
      
      // Find and update the specific quote request
      const updatedQuoteRequests = quoteRequests.map((req: QuoteRequest) => {
        if (req.supplierId === supplierId) {
          return {
            ...req,
            status: QuoteRequestStatus.RECEIVED,
            quoteAmount: amount,
            notes: notes || req.notes,
            validUntil: validUntil || req.validUntil,
            updatedAt: new Date()
          }
        }
        return req
      })
      
      console.log('📊 Updated quote requests:', updatedQuoteRequests.length)
      
      // Activity log entry
      const supplierName = updatedQuoteRequests.find(req => req.supplierId === supplierId)?.supplierName || 'Unknown'
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Received',
        description: `Quote received from ${supplierName} - £${amount.toLocaleString()}`,
        performedBy: userId || 'system',
        timestamp: new Date(),
        metadata: { supplierId, supplierName, amount }
      }
      
      // Update ticket
      await updateDoc(docRef, {
        quoteRequests: updatedQuoteRequests,
        activityLog: [...(ticketData.activityLog || []), activityLogEntry],
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Quote amount updated successfully')
      
    } catch (error) {
      console.error('❌ Error updating quote amount:', error)
      throw new Error('Failed to update quote amount')
    }
  },

  // Accept a quote (mark as winner)
  async acceptQuote(ticketId: string, supplierId: string, userId: string): Promise<void> {
    try {
      console.log('🏆 Accepting quote:', { ticketId, supplierId })
      
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Ticket not found')
      }
      
      const ticketData = docSnap.data()
      const quoteRequests = ticketData.quoteRequests || []
      
      // Update quote requests: mark winner and reject others
      const updatedQuoteRequests = quoteRequests.map((req: QuoteRequest) => {
        if (req.supplierId === supplierId) {
          return {
            ...req,
            status: QuoteRequestStatus.ACCEPTED,
            isWinner: true,
            updatedAt: new Date()
          }
        } else if (req.status === QuoteRequestStatus.RECEIVED) {
          return {
            ...req,
            status: QuoteRequestStatus.REJECTED,
            isWinner: false,
            rejectionReason: 'Another quote was selected',
            updatedAt: new Date()
          }
        }
        return req
      })
      
      const winningQuote = updatedQuoteRequests.find(req => req.supplierId === supplierId)
      
      // Activity log entry
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Accepted',
        description: `Quote accepted from ${winningQuote?.supplierName} - £${winningQuote?.quoteAmount?.toLocaleString()}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          supplierId, 
          supplierName: winningQuote?.supplierName,
          amount: winningQuote?.quoteAmount 
        }
      }
      
      // Update ticket
      await updateDoc(docRef, {
        status: 'Contracted',
        assignedTo: supplierId,
        quoteRequests: updatedQuoteRequests,
        activityLog: [...(ticketData.activityLog || []), activityLogEntry],
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Quote accepted successfully')
      
    } catch (error) {
      console.error('❌ Error accepting quote:', error)
      throw new Error('Failed to accept quote')
    }
  },

  // Reject a quote
  async rejectQuote(ticketId: string, supplierId: string, reason: string, userId: string): Promise<void> {
    try {
      console.log('❌ Rejecting quote:', { ticketId, supplierId, reason })
      
      const docRef = doc(db, TICKETS_COLLECTION, ticketId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Ticket not found')
      }
      
      const ticketData = docSnap.data()
      const quoteRequests = ticketData.quoteRequests || []
      
      // Update the specific quote request
      const updatedQuoteRequests = quoteRequests.map((req: QuoteRequest) => {
        if (req.supplierId === supplierId) {
          return {
            ...req,
            status: QuoteRequestStatus.REJECTED,
            rejectionReason: reason,
            isWinner: false,
            updatedAt: new Date()
          }
        }
        return req
      })
      
      const rejectedQuote = updatedQuoteRequests.find(req => req.supplierId === supplierId)
      
      // Activity log entry
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Quote Rejected',
        description: `Quote rejected from ${rejectedQuote?.supplierName} - Reason: ${reason}`,
        performedBy: userId,
        timestamp: new Date(),
        metadata: { 
          supplierId, 
          supplierName: rejectedQuote?.supplierName,
          reason 
        }
      }
      
      // Update ticket
      await updateDoc(docRef, {
        quoteRequests: updatedQuoteRequests,
        activityLog: [...(ticketData.activityLog || []), activityLogEntry],
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Quote rejected successfully')
      
    } catch (error) {
      console.error('❌ Error rejecting quote:', error)
      throw new Error('Failed to reject quote')
    }
  }
}
