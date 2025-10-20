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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by creation date (newest first) in memory
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error getting invoices by building:', error)
      throw error
    }
}

  // Get invoices by ticket
export const getInvoicesByTicket = async (ticketId: string): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const q = query(
      invoicesRef,
      where('ticketId', '==', ticketId)
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by creation date (newest first) in memory
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error getting invoices by ticket:', error)
      throw error
    }
}

  // Get invoices by vendor
export const getInvoicesByVendor = async (vendorId: string): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const q = query(
      invoicesRef,
      where('vendorId', '==', vendorId)
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by creation date (newest first) in memory
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error getting invoices by vendor:', error)
      throw error
    }
}

  // Get pending invoices
export const getPendingInvoices = async (buildingId: string): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const q = query(
      invoicesRef,
      where('buildingId', '==', buildingId),
      where('status', '==', 'pending')
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by due date (earliest first) in memory
    return invoices.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.getTime() - b.dueDate.getTime()
    })
    } catch (error) {
      console.error('Error getting pending invoices:', error)
      throw error
    }
}

  // Get overdue invoices
export const getOverdueInvoices = async (buildingId: string): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const q = query(
      invoicesRef,
      where('buildingId', '==', buildingId),
      where('paymentStatus', '==', 'overdue')
    )
    
    const querySnapshot = await getDocs(q)
    const invoices: Invoice[] = []
    const today = new Date()
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const invoice = {
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }
      
      // Additional check for overdue invoices based on due date
      if (invoice.dueDate && invoice.dueDate < today && invoice.paymentStatus !== 'paid') {
        invoices.push(invoice)
      }
    })
    
    // Sort by due date (earliest first) in memory
    return invoices.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.getTime() - b.dueDate.getTime()
    })
    } catch (error) {
      console.error('Error getting overdue invoices:', error)
      throw error
    }
}

// Get all invoices
export const getAllInvoices = async (): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const querySnapshot = await getDocs(invoicesRef)
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by creation date (newest first) in memory
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error getting all invoices:', error)
    throw error
  }
}

// Get invoice by ID
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId)
    const invoiceSnap = await getDoc(invoiceRef)
    
    if (invoiceSnap.exists()) {
      const data = invoiceSnap.data()
      return {
        id: invoiceSnap.id,
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting invoice by ID:', error)
    throw error
  }
}

// Create new invoice
export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  try {
    const invoicesRef = collection(db, 'invoices')
    const newInvoice = {
      ...invoiceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(invoicesRef, newInvoice)
    
    return {
      id: docRef.id,
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

  // Update invoice
export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    try {
    const invoiceRef = doc(db, 'invoices', invoiceId)
    await updateDoc(invoiceRef, {
      ...invoiceData,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
}

// Delete invoice
export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId)
    await deleteDoc(invoiceRef)
  } catch (error) {
    console.error('Error deleting invoice:', error)
    throw error
  }
}

  // Approve invoice
export const approveInvoice = async (invoiceId: string, approvedBy: string): Promise<void> => {
    try {
    const invoiceRef = doc(db, 'invoices', invoiceId)
    await updateDoc(invoiceRef, {
        status: 'approved',
        approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error approving invoice:', error)
      throw error
    }
}

  // Mark invoice as paid
export const markInvoiceAsPaid = async (invoiceId: string): Promise<void> => {
    try {
    const invoiceRef = doc(db, 'invoices', invoiceId)
    await updateDoc(invoiceRef, {
        paymentStatus: 'paid',
        paidDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      throw error
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
    } catch (error) {
      console.error('Error getting invoice stats:', error)
      throw error
    }
}

// Search invoices
export const searchInvoices = async (buildingId: string, searchTerm: string): Promise<Invoice[]> => {
  try {
    const invoices = await getInvoicesByBuilding(buildingId)
    
    return invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    } catch (error) {
    console.error('Error searching invoices:', error)
      throw error
  }
} 