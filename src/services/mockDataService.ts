// Mock data service for development and testing
// This service re-exports working mock data from mockData.ts to maintain compatibility

import { 
  Building, 
  Flat, 
  Ticket, 
  WorkOrder, 
  Person, 
  Budget,
  Supplier,
  Asset
} from '../types'

// Import working mock data
import {
  mockBuildings,
  mockFlats,
  mockResidents,
  mockSuppliers,
  mockAssets,
  mockTickets,
  mockWorkOrders,
  mockBudgets
} from './mockData'

// Re-export types for compatibility
interface Resident {
  id: string
  buildingId: string
  flatId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyContact: string
  leaseStartDate: Date
  leaseEndDate: Date
  isOwner: boolean
  createdAt: Date
  updatedAt: Date
}

// Comprehensive Mock Data Service for Multi-Building System
export class MockDataService {
  
  // Buildings Data
  static getBuildings(): Building[] {
    return mockBuildings
  }

  // Flats Data
  static getFlats(): Flat[] {
    return mockFlats
  }

  // Residents Data
  static getResidents(): Person[] {
    return mockResidents
  }

  // Tickets Data
  static getTickets(): Ticket[] {
    return mockTickets
  }

  // Work Orders Data
  static getWorkOrders(): WorkOrder[] {
    return mockWorkOrders
  }

  // Suppliers Data
  static getSuppliers(): Supplier[] {
    return mockSuppliers
  }

  // Assets Data
  static getAssets(): Asset[] {
    return mockAssets
  }

  // Budgets Data
  static getBudgets(): Budget[] {
    return mockBudgets
  }

  // Filtered data methods for building-specific queries
  static getBuildingFlats(buildingId: string): Flat[] {
    return mockFlats.filter(flat => flat.buildingId === buildingId)
  }

  static getBuildingResidents(buildingId: string): Person[] {
    return mockResidents.filter(resident => resident.buildingId === buildingId)
  }

  static getBuildingTickets(buildingId: string): Ticket[] {
    return mockTickets.filter(ticket => ticket.buildingId === buildingId)
  }

  static getBuildingWorkOrders(buildingId: string): WorkOrder[] {
    return mockWorkOrders.filter(workOrder => workOrder.buildingId === buildingId)
  }

  static getBuildingSuppliers(buildingId: string): Supplier[] {
    return mockSuppliers.filter(supplier => supplier.buildingId === buildingId)
  }

  static getBuildingAssets(buildingId: string): Asset[] {
    return mockAssets.filter(asset => asset.buildingId === buildingId)
  }

  static getBuildingBudgets(buildingId: string): Budget[] {
    return mockBudgets.filter(budget => budget.buildingId === buildingId)
  }
}

// Export individual data arrays for direct access
export {
  mockBuildings,
  mockFlats,
  mockResidents,
  mockSuppliers,
  mockAssets,
  mockTickets,
  mockWorkOrders,
  mockBudgets
}
