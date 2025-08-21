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
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '../types'

const WORK_ORDERS_COLLECTION = 'workOrders'

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date()
}

// Get all work orders for a building
export const getWorkOrdersByBuilding = async (buildingId: string): Promise<WorkOrder[]> => {
  try {
    const q = query(
      collection(db, WORK_ORDERS_COLLECTION),
      where('buildingId', '==', buildingId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const workOrders: WorkOrder[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      workOrders.push({
        id: doc.id,
        buildingId: data.buildingId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        flatId: data.flatId,
        scheduledDate: convertTimestamp(data.scheduledDate),
        assignedToUid: data.assignedToUid,
        createdByUid: data.createdByUid,
        createdByUserEmail: data.createdByUserEmail,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        resolutionNotes: data.resolutionNotes || [],
        quoteRequests: data.quoteRequests || [],
        managerCommunication: data.managerCommunication || []
      })
    })
    
    return workOrders
  } catch (error) {
    console.error('Error fetching work orders by building:', error)
    throw error
  }
}

// Get all work orders
export const getAllWorkOrders = async (): Promise<WorkOrder[]> => {
  try {
    const q = query(
      collection(db, WORK_ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const workOrders: WorkOrder[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      workOrders.push({
        id: doc.id,
        buildingId: data.buildingId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        flatId: data.flatId,
        scheduledDate: convertTimestamp(data.scheduledDate),
        assignedToUid: data.assignedToUid,
        createdByUid: data.createdByUid,
        createdByUserEmail: data.createdByUserEmail,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        resolutionNotes: data.resolutionNotes || [],
        quoteRequests: data.quoteRequests || [],
        managerCommunication: data.managerCommunication || []
      })
    })
    
    return workOrders
  } catch (error) {
    console.error('Error fetching all work orders:', error)
    throw error
  }
}

// Get work order by ID
export const getWorkOrderById = async (workOrderId: string): Promise<WorkOrder | null> => {
  try {
    const docRef = doc(db, WORK_ORDERS_COLLECTION, workOrderId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        buildingId: data.buildingId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        flatId: data.flatId,
        scheduledDate: convertTimestamp(data.scheduledDate),
        assignedToUid: data.assignedToUid,
        createdByUid: data.createdByUid,
        createdByUserEmail: data.createdByUserEmail,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        resolutionNotes: data.resolutionNotes || [],
        quoteRequests: data.quoteRequests || [],
        managerCommunication: data.managerCommunication || []
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting work order by ID:', error)
    throw error
  }
}

// Create work order
export const createWorkOrder = async (workOrderData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> => {
  try {
    const newWorkOrder = {
      ...workOrderData,
      resolutionNotes: workOrderData.resolutionNotes || [],
      quoteRequests: workOrderData.quoteRequests || [],
      managerCommunication: workOrderData.managerCommunication || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, WORK_ORDERS_COLLECTION), newWorkOrder)
    
    return {
      id: docRef.id,
      ...workOrderData,
      resolutionNotes: workOrderData.resolutionNotes || [],
      quoteRequests: workOrderData.quoteRequests || [],
      managerCommunication: workOrderData.managerCommunication || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating work order:', error)
    throw error
  }
}

// Update work order
export const updateWorkOrder = async (workOrderId: string, updates: Partial<Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, WORK_ORDERS_COLLECTION, workOrderId)
    await updateDoc(docRef, {
      ...updates,
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
  changedByUid: string
): Promise<void> => {
  try {
    const docRef = doc(db, WORK_ORDERS_COLLECTION, workOrderId)
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating work order status:', error)
    throw error
  }
}

// Delete work order
export const deleteWorkOrder = async (workOrderId: string): Promise<void> => {
  try {
    const docRef = doc(db, WORK_ORDERS_COLLECTION, workOrderId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting work order:', error)
    throw error
  }
}

// Get work order statistics
export const getWorkOrderStats = async (buildingId?: string) => {
  try {
    const workOrders = buildingId ? 
      await getWorkOrdersByBuilding(buildingId) : 
      await getAllWorkOrders()
    
    const currentDate = new Date()
    
    return {
      total: workOrders.length,
      scheduled: workOrders.filter(wo => wo.status === WorkOrderStatus.SCHEDULED).length,
      in_progress: workOrders.filter(wo => wo.status === WorkOrderStatus.TRIAGE).length,
      completed: workOrders.filter(wo => wo.status === WorkOrderStatus.RESOLVED).length,
      overdue: workOrders.filter(wo => {
        if (!wo.scheduledDate) return false
        return wo.scheduledDate < currentDate && wo.status !== WorkOrderStatus.RESOLVED
      }).length
    }
  } catch (error) {
    console.error('Error getting work order stats:', error)
    return {
      total: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0
    }
  }
}

// Subscribe to work orders changes
export const subscribeToWorkOrders = (buildingId: string | null, callback: (workOrders: WorkOrder[]) => void) => {
  try {
    const q = buildingId ?
      query(
        collection(db, WORK_ORDERS_COLLECTION),
        where('buildingId', '==', buildingId),
        orderBy('createdAt', 'desc')
      ) :
      query(
        collection(db, WORK_ORDERS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
    
    return onSnapshot(q, (querySnapshot) => {
      const workOrders: WorkOrder[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        workOrders.push({
          id: doc.id,
          buildingId: data.buildingId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          flatId: data.flatId,
          scheduledDate: convertTimestamp(data.scheduledDate),
          assignedToUid: data.assignedToUid,
          createdByUid: data.createdByUid,
          createdByUserEmail: data.createdByUserEmail,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          resolutionNotes: data.resolutionNotes || [],
          quoteRequests: data.quoteRequests || [],
          managerCommunication: data.managerCommunication || []
        })
      })
      callback(workOrders)
    })
  } catch (error) {
    console.error('Error subscribing to work orders:', error)
    callback([])
    return () => {}
  }
}
