import { WorkOrder } from '../types'

// Get all work orders for a building
export const getWorkOrdersByBuilding = async (buildingId: string): Promise<WorkOrder[]> => {
  try {
    // Use comprehensive mock data for development
    const { mockWorkOrders, getDataByBuilding } = await import('./mockData')
    return getDataByBuilding(mockWorkOrders, buildingId)
  } catch (error) {
    console.error('Error fetching work orders by building:', error)
    return []
  }
}

// Get all work orders
export const getAllWorkOrders = async (): Promise<WorkOrder[]> => {
  try {
    const { mockWorkOrders } = await import('./mockData')
    return mockWorkOrders
  } catch (error) {
    console.error('Error fetching all work orders:', error)
    return []
  }
}

// Create work order (mock implementation)
export const createWorkOrder = async (workOrderData: Partial<WorkOrder>): Promise<WorkOrder> => {
  try {
    const newWorkOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      buildingId: workOrderData.buildingId || '',
      title: workOrderData.title || '',
      description: workOrderData.description || '',
      priority: workOrderData.priority || 'medium',
      status: workOrderData.status || 'scheduled',
      flatId: workOrderData.flatId,
      scheduledDate: workOrderData.scheduledDate,
      assignedToUid: workOrderData.assignedToUid || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      activityLog: [],
      quotes: [],
      userFeedback: undefined
    }
    
    console.log('Mock work order created:', newWorkOrder)
    return newWorkOrder
  } catch (error) {
    console.error('Error creating work order:', error)
    throw error
  }
}

// Update work order status (mock implementation)
export const updateWorkOrderStatus = async (
  workOrderId: string, 
  newStatus: string, 
  changedByUid: string
): Promise<void> => {
  try {
    console.log(`Mock update: Work order ${workOrderId} status changed to ${newStatus} by ${changedByUid}`)
  } catch (error) {
    console.error('Error updating work order status:', error)
    throw error
  }
}
