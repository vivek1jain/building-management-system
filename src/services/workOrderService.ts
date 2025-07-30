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
import { 
  WorkOrder, 
  WorkOrderStatus, 
  WorkOrderPriority, 
  QuoteRequest, 
  QuoteRequestStatus,
  UserFeedback,
  LogEntry
} from '../types'

// Get all work orders for a building
export const getWorkOrdersByBuilding = async (buildingId: string): Promise<WorkOrder[]> => {
  try {
    const workOrdersRef = collection(db, 'workOrders')
    const q = query(
      workOrdersRef,
      where('buildingId', '==', buildingId)
    )
    
    const querySnapshot = await getDocs(q)
    const workOrders: WorkOrder[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      workOrders.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        createdByUid: data.createdByUid,
        createdByUserEmail: data.createdByUserEmail,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        buildingId: data.buildingId,
        assignedToUid: data.assignedToUid,
        assignedToUserEmail: data.assignedToUserEmail,
        resolutionNotes: data.resolutionNotes?.map((note: any) => ({
          ...note,
          timestamp: note.timestamp?.toDate()
        })) || [],
        flatId: data.flatId,
        flatNumber: data.flatNumber,
        assetId: data.assetId,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        quotePrice: data.quotePrice,
        cost: data.cost,
        scheduledDate: data.scheduledDate?.toDate(),
        quoteRequests: data.quoteRequests?.map((quote: any) => ({
          ...quote,
          sentAt: quote.sentAt?.toDate(),
          updatedAt: quote.updatedAt?.toDate()
        })) || [],
        managerCommunication: data.managerCommunication?.map((comm: any) => ({
          ...comm,
          timestamp: comm.timestamp?.toDate()
        })) || [],
        lastStatusChangeByUid: data.lastStatusChangeByUid,
        resolvedAt: data.resolvedAt?.toDate(),
        userFeedbackLog: data.userFeedbackLog?.map((feedback: any) => ({
          ...feedback,
          timestamp: feedback.timestamp?.toDate()
        })) || []
      })
    })
    
    // Sort by creation date (newest first)
    return workOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error getting work orders by building:', error)
    throw error
  }
}

// Get work order by ID
export const getWorkOrderById = async (workOrderId: string): Promise<WorkOrder | null> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (workOrderSnap.exists()) {
      const data = workOrderSnap.data()
      return {
        id: workOrderSnap.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        createdByUid: data.createdByUid,
        createdByUserEmail: data.createdByUserEmail,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        buildingId: data.buildingId,
        assignedToUid: data.assignedToUid,
        assignedToUserEmail: data.assignedToUserEmail,
        resolutionNotes: data.resolutionNotes?.map((note: any) => ({
          ...note,
          timestamp: note.timestamp?.toDate()
        })) || [],
        flatId: data.flatId,
        flatNumber: data.flatNumber,
        assetId: data.assetId,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        quotePrice: data.quotePrice,
        cost: data.cost,
        scheduledDate: data.scheduledDate?.toDate(),
        quoteRequests: data.quoteRequests?.map((quote: any) => ({
          ...quote,
          sentAt: quote.sentAt?.toDate(),
          updatedAt: quote.updatedAt?.toDate()
        })) || [],
        managerCommunication: data.managerCommunication?.map((comm: any) => ({
          ...comm,
          timestamp: comm.timestamp?.toDate()
        })) || [],
        lastStatusChangeByUid: data.lastStatusChangeByUid,
        resolvedAt: data.resolvedAt?.toDate(),
        userFeedbackLog: data.userFeedbackLog?.map((feedback: any) => ({
          ...feedback,
          timestamp: feedback.timestamp?.toDate()
        })) || []
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting work order by ID:', error)
    throw error
  }
}

// Create new work order
export const createWorkOrder = async (workOrderData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> => {
  try {
    const workOrdersRef = collection(db, 'workOrders')
    const newWorkOrder = {
      ...workOrderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(workOrdersRef, newWorkOrder)
    
    return {
      id: docRef.id,
      ...workOrderData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating work order:', error)
    throw error
  }
}

// Update work order
export const updateWorkOrder = async (workOrderId: string, workOrderData: Partial<Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    await updateDoc(workOrderRef, {
      ...workOrderData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating work order:', error)
    throw error
  }
}

// Update work order status
export const updateWorkOrderStatus = async (
  workOrderId: string, 
  newStatus: WorkOrderStatus, 
  changedByUid: string,
  notes?: string
): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (!workOrderSnap.exists()) {
      throw new Error('Work order not found')
    }
    
    const workOrder = workOrderSnap.data()
    const currentResolutionNotes = workOrder.resolutionNotes || []
    
    const newLogEntry: LogEntry = {
      message: `Status changed from ${workOrder.status} to ${newStatus}`,
      timestamp: new Date(),
      authorName: changedByUid // This should be the actual user name
    }
    
    const updatedResolutionNotes = [...currentResolutionNotes, newLogEntry]
    
    const updateData: any = {
      status: newStatus,
      lastStatusChangeByUid: changedByUid,
      resolutionNotes: updatedResolutionNotes,
      updatedAt: serverTimestamp()
    }
    
    // Set resolved date if status is RESOLVED
    if (newStatus === WorkOrderStatus.RESOLVED) {
      updateData.resolvedAt = serverTimestamp()
    }
    
    // Add notes if provided
    if (notes) {
      updateData.notes = notes
    }
    
    await updateDoc(workOrderRef, updateData)
  } catch (error) {
    console.error('Error updating work order status:', error)
    throw error
  }
}

// Add resolution note
export const addResolutionNote = async (workOrderId: string, note: string, authorUid: string): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (!workOrderSnap.exists()) {
      throw new Error('Work order not found')
    }
    
    const workOrder = workOrderSnap.data()
    const currentResolutionNotes = workOrder.resolutionNotes || []
    
    const newLogEntry: LogEntry = {
      message: note,
      timestamp: new Date(),
      authorName: authorUid // This should be the actual user name
    }
    
    const updatedResolutionNotes = [...currentResolutionNotes, newLogEntry]
    
    await updateDoc(workOrderRef, {
      resolutionNotes: updatedResolutionNotes,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding resolution note:', error)
    throw error
  }
}

// Add manager communication
export const addManagerCommunication = async (workOrderId: string, message: string, authorUid: string): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (!workOrderSnap.exists()) {
      throw new Error('Work order not found')
    }
    
    const workOrder = workOrderSnap.data()
    const currentManagerCommunication = workOrder.managerCommunication || []
    
    const newLogEntry: LogEntry = {
      message,
      timestamp: new Date(),
      authorName: authorUid // This should be the actual user name
    }
    
    const updatedManagerCommunication = [...currentManagerCommunication, newLogEntry]
    
    await updateDoc(workOrderRef, {
      managerCommunication: updatedManagerCommunication,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding manager communication:', error)
    throw error
  }
}

// Add user feedback
export const addUserFeedback = async (workOrderId: string, feedback: Omit<UserFeedback, 'timestamp'>): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (!workOrderSnap.exists()) {
      throw new Error('Work order not found')
    }
    
    const workOrder = workOrderSnap.data()
    const currentUserFeedbackLog = workOrder.userFeedbackLog || []
    
    const newFeedback: UserFeedback = {
      ...feedback,
      timestamp: new Date()
    }
    
    const updatedUserFeedbackLog = [...currentUserFeedbackLog, newFeedback]
    
    await updateDoc(workOrderRef, {
      userFeedbackLog: updatedUserFeedbackLog,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding user feedback:', error)
    throw error
  }
}

// Request quote from supplier
export const requestQuote = async (
  workOrderId: string, 
  supplierId: string, 
  supplierName: string,
  notes?: string
): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (!workOrderSnap.exists()) {
      throw new Error('Work order not found')
    }
    
    const workOrder = workOrderSnap.data()
    const currentQuoteRequests = workOrder.quoteRequests || []
    
    const newQuoteRequest: QuoteRequest = {
      supplierId,
      supplierName,
      sentAt: new Date(),
      status: QuoteRequestStatus.PENDING,
      notes: notes || null
    }
    
    const updatedQuoteRequests = [...currentQuoteRequests, newQuoteRequest]
    
    await updateDoc(workOrderRef, {
      quoteRequests: updatedQuoteRequests,
      status: WorkOrderStatus.QUOTING,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error requesting quote:', error)
    throw error
  }
}

// Update quote request status
export const updateQuoteRequestStatus = async (
  workOrderId: string,
  supplierId: string,
  newStatus: QuoteRequestStatus,
  quoteAmount?: number,
  quoteDocumentUrl?: string
): Promise<void> => {
  try {
    const workOrderRef = doc(db, 'workOrders', workOrderId)
    const workOrderSnap = await getDoc(workOrderRef)
    
    if (!workOrderSnap.exists()) {
      throw new Error('Work order not found')
    }
    
    const workOrder = workOrderSnap.data()
    const currentQuoteRequests = workOrder.quoteRequests || []
    
    const updatedQuoteRequests = currentQuoteRequests.map((quote: QuoteRequest) => {
      if (quote.supplierId === supplierId) {
        return {
          ...quote,
          status: newStatus,
          quoteAmount: quoteAmount || quote.quoteAmount,
          quoteDocumentUrl: quoteDocumentUrl || quote.quoteDocumentUrl,
          updatedAt: new Date()
        }
      }
      return quote
    })
    
    await updateDoc(workOrderRef, {
      quoteRequests: updatedQuoteRequests,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating quote request status:', error)
    throw error
  }
}

// Get work orders by status
export const getWorkOrdersByStatus = async (buildingId: string, status: WorkOrderStatus): Promise<WorkOrder[]> => {
  try {
    const workOrders = await getWorkOrdersByBuilding(buildingId)
    return workOrders.filter(workOrder => workOrder.status === status)
  } catch (error) {
    console.error('Error getting work orders by status:', error)
    throw error
  }
}

// Get work orders by priority
export const getWorkOrdersByPriority = async (buildingId: string, priority: WorkOrderPriority): Promise<WorkOrder[]> => {
  try {
    const workOrders = await getWorkOrdersByBuilding(buildingId)
    return workOrders.filter(workOrder => workOrder.priority === priority)
  } catch (error) {
    console.error('Error getting work orders by priority:', error)
    throw error
  }
}

// Get urgent work orders
export const getUrgentWorkOrders = async (buildingId: string): Promise<WorkOrder[]> => {
  try {
    const workOrders = await getWorkOrdersByBuilding(buildingId)
    return workOrders.filter(workOrder => 
      workOrder.priority === WorkOrderPriority.URGENT || 
      workOrder.priority === WorkOrderPriority.HIGH
    )
  } catch (error) {
    console.error('Error getting urgent work orders:', error)
    throw error
  }
}

// Get work order statistics
export const getWorkOrderStats = async (buildingId: string) => {
  try {
    const workOrders = await getWorkOrdersByBuilding(buildingId)
    
    const stats = {
      totalWorkOrders: workOrders.length,
      byStatus: {} as Record<WorkOrderStatus, number>,
      byPriority: {} as Record<WorkOrderPriority, number>,
      urgentWorkOrders: 0,
      resolvedThisMonth: 0,
      averageResolutionTime: 0
    }
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    workOrders.forEach(workOrder => {
      // Count by status
      if (stats.byStatus[workOrder.status]) {
        stats.byStatus[workOrder.status]++
      } else {
        stats.byStatus[workOrder.status] = 1
      }
      
      // Count by priority
      if (stats.byPriority[workOrder.priority]) {
        stats.byPriority[workOrder.priority]++
      } else {
        stats.byPriority[workOrder.priority] = 1
      }
      
      // Count urgent work orders
      if (workOrder.priority === WorkOrderPriority.URGENT || workOrder.priority === WorkOrderPriority.HIGH) {
        stats.urgentWorkOrders++
      }
      
      // Count resolved this month
      if (workOrder.status === WorkOrderStatus.RESOLVED && 
          workOrder.resolvedAt && 
          workOrder.resolvedAt.getMonth() === currentMonth &&
          workOrder.resolvedAt.getFullYear() === currentYear) {
        stats.resolvedThisMonth++
      }
    })
    
    return stats
  } catch (error) {
    console.error('Error getting work order stats:', error)
    throw error
  }
}

// Search work orders
export const searchWorkOrders = async (buildingId: string, searchTerm: string): Promise<WorkOrder[]> => {
  try {
    const workOrders = await getWorkOrdersByBuilding(buildingId)
    
    return workOrders.filter(workOrder => 
      workOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching work orders:', error)
    throw error
  }
} 