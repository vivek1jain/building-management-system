import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Invoice, InvoiceStatus, PaymentStatus } from '../types'
import { handleFirebaseError } from '../utils/errorHandler';
import { fromFirestoreTimestamp, toFirestoreTimestamp, toOptionalFirestoreTimestamp } from '../utils/firestore';

// Get all invoices for a building
export const getInvoicesByBuilding = async (buildingId: string): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const q = query(
      invoicesRef,
      where('buildingId', '==', buildingId)
    )
    
    const querySnapshot = await getDocs(q)
    const invoices: Invoice[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      invoices.push({
        id: doc.id,
        ticketId: data.ticketId,
        vendorId: data.vendorId,
        buildingId: data.buildingId,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        status: data.status,
        paymentStatus: data.paymentStatus,
        dueDate: data.dueDate?.toDate(),
        paidDate: data.paidDate?.toDate(),
        description: data.description,
        attachments: data.attachments || [],
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate(),
        createdBy: data.createdBy,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt)
      })
    })
    
    // Sort by creation date (newest first) in memory
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getInvoicesByBuilding',
        buildingId,
      })
    }
}


// Get invoice statistics
export const getInvoiceStats = async (buildingId: string) => {
  try {
    const invoices = await getInvoicesByBuilding(buildingId)
    
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      overdueAmount: 0,
      overdueCount: 0,
      pendingCount: 0,
      paidCount: 0
    }
    
    const today = new Date()
    
    invoices.forEach(invoice => {
      stats.totalAmount += invoice.amount
      
      switch (invoice.paymentStatus) {
        case 'pending':
          stats.pendingAmount += invoice.amount
          stats.pendingCount++
          break
        case 'paid':
          stats.paidAmount += invoice.amount
          stats.paidCount++
          break
        case 'overdue':
          stats.overdueAmount += invoice.amount
          stats.overdueCount++
          break
      }
      
      // Additional check for overdue based on due date
      if (invoice.dueDate && invoice.dueDate < today && invoice.paymentStatus !== 'paid') {
        if (invoice.paymentStatus !== 'overdue') {
          stats.overdueAmount += invoice.amount
          stats.overdueCount++
        }
      }
    })
    
    return stats
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getInvoiceStats',
        buildingId,
      })
    }
}

