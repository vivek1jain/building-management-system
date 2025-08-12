import { 
  Building, 
  Flat, 
  Ticket, 
  WorkOrder, 
  Budget, 
  UrgencyLevel,
  TicketStatus,
  WorkOrderStatus,
  WorkOrderPriority
} from '../types'

// Define interfaces for mock data
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

interface MockBuilding extends Omit<Building, 'totalFlats'> {
  totalFlats: number
  totalResidents: number
}

interface MockFlat extends Flat {
  squareFootage: number
}

// Comprehensive Mock Data Service for Multi-Building System
export class MockDataService {
  
  // Buildings Data
  static getBuildings(): Building[] {
    return [
      {
        id: 'building-1',
        name: 'Riverside Gardens',
        address: '123 Thames View, London SW1A 1AA',
        totalFlats: 24,
        totalResidents: 45,
        managementCompany: 'Premium Property Management Ltd',
        yearBuilt: 2018,
        propertyType: 'Residential',
        amenities: ['Gym', 'Concierge', 'Garden', 'Parking'],
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-03-10')
      },
      {
        id: 'building-2', 
        name: 'Victoria Heights',
        address: '456 Victoria Street, London SW1E 6QP',
        totalFlats: 18,
        totalResidents: 32,
        managementCompany: 'Elite Estates Management',
        yearBuilt: 2020,
        propertyType: 'Residential',
        amenities: ['Gym', 'Roof Terrace', 'Bike Storage'],
        createdAt: new Date('2023-02-20'),
        updatedAt: new Date('2024-03-08')
      },
      {
        id: 'building-3',
        name: 'Canary Wharf Towers',
        address: '789 Canary Wharf, London E14 5AB',
        totalFlats: 36,
        totalResidents: 68,
        managementCompany: 'Metropolitan Property Services',
        yearBuilt: 2019,
        propertyType: 'Residential',
        amenities: ['Gym', 'Pool', 'Concierge', 'Business Center', 'Parking'],
        createdAt: new Date('2023-03-10'),
        updatedAt: new Date('2024-03-12')
      }
    ]
  }

  // Flats Data
  static getFlats(): Flat[] {
    return [
      // Riverside Gardens
      { id: 'flat-1', buildingId: 'building-1', flatNumber: 'A101', floor: 1, bedrooms: 2, bathrooms: 2, squareFootage: 850, rent: 2800, serviceCharge: 280, groundRent: 350, leaseholdYears: 95, currentResidents: ['resident-1', 'resident-2'], createdAt: new Date('2023-01-15'), updatedAt: new Date('2024-03-10') },
      { id: 'flat-2', buildingId: 'building-1', flatNumber: 'A102', floor: 1, bedrooms: 1, bathrooms: 1, squareFootage: 650, rent: 2200, serviceCharge: 220, groundRent: 300, leaseholdYears: 95, currentResidents: ['resident-3'], createdAt: new Date('2023-01-15'), updatedAt: new Date('2024-03-10') },
      { id: 'flat-3', buildingId: 'building-1', flatNumber: 'A201', floor: 2, bedrooms: 2, bathrooms: 2, squareFootage: 900, rent: 3200, serviceCharge: 320, groundRent: 380, leaseholdYears: 95, currentResidents: ['resident-4', 'resident-5'], createdAt: new Date('2023-01-15'), updatedAt: new Date('2024-03-10') },
      
      // Victoria Heights
      { id: 'flat-5', buildingId: 'building-2', flatNumber: 'B101', floor: 1, bedrooms: 2, bathrooms: 2, squareFootage: 800, rent: 3000, serviceCharge: 300, groundRent: 400, leaseholdYears: 99, currentResidents: ['resident-9', 'resident-10'], createdAt: new Date('2023-02-20'), updatedAt: new Date('2024-03-08') },
      { id: 'flat-6', buildingId: 'building-2', flatNumber: 'B201', floor: 2, bedrooms: 1, bathrooms: 1, squareFootage: 600, rent: 2500, serviceCharge: 250, groundRent: 350, leaseholdYears: 99, currentResidents: ['resident-11'], createdAt: new Date('2023-02-20'), updatedAt: new Date('2024-03-08') },
      
      // Canary Wharf
      { id: 'flat-8', buildingId: 'building-3', flatNumber: 'C101', floor: 1, bedrooms: 2, bathrooms: 2, squareFootage: 950, rent: 3800, serviceCharge: 380, groundRent: 450, leaseholdYears: 125, currentResidents: ['resident-15', 'resident-16'], createdAt: new Date('2023-03-10'), updatedAt: new Date('2024-03-12') },
      { id: 'flat-9', buildingId: 'building-3', flatNumber: 'C201', floor: 2, bedrooms: 1, bathrooms: 1, squareFootage: 700, rent: 2800, serviceCharge: 280, groundRent: 380, leaseholdYears: 125, currentResidents: ['resident-17'], createdAt: new Date('2023-03-10'), updatedAt: new Date('2024-03-12') }
    ]
  }

  // Residents Data
  static getResidents(): Resident[] {
    return [
      // Riverside Gardens
      { id: 'resident-1', buildingId: 'building-1', flatId: 'flat-1', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@email.com', phone: '+44 7700 900001', emergencyContact: 'Sarah Wilson - +44 7700 900002', leaseStartDate: new Date('2023-06-01'), leaseEndDate: new Date('2025-05-31'), isOwner: false, createdAt: new Date('2023-05-15'), updatedAt: new Date('2024-03-01') },
      { id: 'resident-2', buildingId: 'building-1', flatId: 'flat-1', firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@email.com', phone: '+44 7700 900002', emergencyContact: 'James Wilson - +44 7700 900001', leaseStartDate: new Date('2023-06-01'), leaseEndDate: new Date('2025-05-31'), isOwner: false, createdAt: new Date('2023-05-15'), updatedAt: new Date('2024-03-01') },
      { id: 'resident-3', buildingId: 'building-1', flatId: 'flat-2', firstName: 'Oliver', lastName: 'Brown', email: 'oliver.brown@email.com', phone: '+44 7700 900003', emergencyContact: 'Lisa Brown - +44 7700 900004', leaseStartDate: new Date('2023-08-01'), leaseEndDate: new Date('2024-07-31'), isOwner: true, createdAt: new Date('2023-07-10'), updatedAt: new Date('2024-02-15') },
      
      // Victoria Heights
      { id: 'resident-9', buildingId: 'building-2', flatId: 'flat-5', firstName: 'Charlotte', lastName: 'Taylor', email: 'charlotte.taylor@email.com', phone: '+44 7700 900009', emergencyContact: 'Thomas Taylor - +44 7700 900010', leaseStartDate: new Date('2023-09-01'), leaseEndDate: new Date('2025-08-31'), isOwner: true, createdAt: new Date('2023-08-10'), updatedAt: new Date('2024-02-28') },
      { id: 'resident-10', buildingId: 'building-2', flatId: 'flat-5', firstName: 'Thomas', lastName: 'Taylor', email: 'thomas.taylor@email.com', phone: '+44 7700 900010', emergencyContact: 'Charlotte Taylor - +44 7700 900009', leaseStartDate: new Date('2023-09-01'), leaseEndDate: new Date('2025-08-31'), isOwner: true, createdAt: new Date('2023-08-10'), updatedAt: new Date('2024-02-28') },
      
      // Canary Wharf
      { id: 'resident-15', buildingId: 'building-3', flatId: 'flat-8', firstName: 'Alexander', lastName: 'Johnson', email: 'alexander.johnson@email.com', phone: '+44 7700 900015', emergencyContact: 'Victoria Johnson - +44 7700 900016', leaseStartDate: new Date('2023-10-01'), leaseEndDate: new Date('2025-09-30'), isOwner: true, createdAt: new Date('2023-09-15'), updatedAt: new Date('2024-03-05') }
    ]
  }

  // Tickets Data with Complete Workflow
  static getTickets(): Ticket[] {
    return [
      {
        id: 'ticket-1',
        buildingId: 'building-1',
        title: 'Heating System Not Working',
        description: 'Central heating in flat A101 stopped working. Residents without heating for 2 days.',
        location: 'Flat A101',
        urgency: 'high' as UrgencyLevel,
        status: 'Manager Review' as TicketStatus,
        requestedBy: 'resident-1',
        assignedTo: 'manager-1',
        attachments: [],
        activityLog: [{
          id: 'activity-1',
          action: 'Ticket Created',
          description: 'Heating system reported as not working',
          performedBy: 'resident-1',
          timestamp: new Date('2024-03-10T09:00:00Z'),
          metadata: {}
        }],
        quotes: [],
        scheduledDate: new Date('2024-03-12T10:00:00Z'),
        createdAt: new Date('2024-03-10T09:00:00Z'),
        updatedAt: new Date('2024-03-10T15:30:00Z')
      },
      {
        id: 'ticket-2',
        buildingId: 'building-1',
        title: 'Leaking Kitchen Tap',
        description: 'Kitchen tap in flat A201 leaking constantly, causing water waste.',
        location: 'Flat A201 - Kitchen',
        urgency: 'medium' as UrgencyLevel,
        status: 'Quote Management' as TicketStatus,
        requestedBy: 'resident-4',
        assignedTo: 'manager-1',
        attachments: [],
        activityLog: [{
          id: 'activity-2',
          action: 'Quote Requested',
          description: 'Quote requested from plumbing contractors',
          performedBy: 'manager-1',
          timestamp: new Date('2024-03-09T10:00:00Z'),
          metadata: {}
        }],
        quotes: [{
          id: 'quote-1',
          ticketId: 'ticket-2',
          supplierId: 'supplier-1',
          amount: 150,
          description: 'Replace kitchen tap and check plumbing',
          validUntil: new Date('2024-03-20'),
          status: 'pending',
          submittedAt: new Date('2024-03-09T16:00:00Z'),
          notes: 'Can complete within 2 days'
        }],
        createdAt: new Date('2024-03-08T14:30:00Z'),
        updatedAt: new Date('2024-03-09T16:00:00Z')
      },
      {
        id: 'ticket-3',
        buildingId: 'building-2',
        title: 'Elevator Making Strange Noises',
        description: 'Main elevator making grinding noises and running slower than usual.',
        location: 'Main Elevator',
        urgency: 'high' as UrgencyLevel,
        status: 'Work Order' as TicketStatus,
        requestedBy: 'resident-9',
        assignedTo: 'contractor-1',
        attachments: [],
        activityLog: [{
          id: 'activity-4',
          action: 'Work Order Created',
          description: 'Elevator maintenance work order created',
          performedBy: 'manager-2',
          timestamp: new Date('2024-03-08T09:00:00Z'),
          metadata: { workOrderId: 'wo-1' }
        }],
        quotes: [],
        scheduledDate: new Date('2024-03-11T08:00:00Z'),
        createdAt: new Date('2024-03-07T11:00:00Z'),
        updatedAt: new Date('2024-03-08T09:00:00Z')
      },
      {
        id: 'ticket-4',
        buildingId: 'building-3',
        title: 'Gym Equipment Maintenance',
        description: 'Treadmill #2 in gym not working properly, needs servicing.',
        location: 'Building Gym',
        urgency: 'low' as UrgencyLevel,
        status: 'Complete' as TicketStatus,
        requestedBy: 'resident-15',
        assignedTo: 'contractor-2',
        attachments: [],
        activityLog: [{
          id: 'activity-6',
          action: 'Work Completed',
          description: 'Treadmill serviced and repaired',
          performedBy: 'contractor-2',
          timestamp: new Date('2024-03-06T14:00:00Z'),
          metadata: {}
        }],
        quotes: [],
        completedDate: new Date('2024-03-06T14:00:00Z'),
        createdAt: new Date('2024-03-05T16:00:00Z'),
        updatedAt: new Date('2024-03-06T14:00:00Z')
      }
    ]
  }

  // Work Orders Data
  static getWorkOrders(): WorkOrder[] {
    return [
      {
        id: 'wo-1',
        buildingId: 'building-2',
        title: 'Elevator Maintenance and Repair',
        description: 'Complete maintenance check and repair of main elevator grinding noise issue',
        priority: 'high' as WorkOrderPriority,
        status: 'in_progress' as WorkOrderStatus,
        flatId: null,
        scheduledDate: new Date('2024-03-11T08:00:00Z'),
        assignedToUid: 'contractor-1',
        requestedBy: 'manager-2',
        createdAt: new Date('2024-03-08T09:00:00Z'),
        updatedAt: new Date('2024-03-10T10:00:00Z'),
        activityLog: [{
          id: 'wo-activity-1',
          action: 'Work Started',
          description: 'Contractor began elevator inspection',
          performedBy: 'contractor-1',
          timestamp: new Date('2024-03-10T10:00:00Z'),
          metadata: {}
        }],
        quotes: [],
        userFeedback: null
      },
      {
        id: 'wo-2',
        buildingId: 'building-1',
        title: 'Plumbing Repair - Kitchen Tap',
        description: 'Replace leaking kitchen tap in flat A201',
        priority: 'medium' as WorkOrderPriority,
        status: 'scheduled' as WorkOrderStatus,
        flatId: 'flat-3',
        scheduledDate: new Date('2024-03-13T09:00:00Z'),
        assignedToUid: 'contractor-3',
        requestedBy: 'manager-1',
        createdAt: new Date('2024-03-09T17:00:00Z'),
        updatedAt: new Date('2024-03-09T17:00:00Z'),
        activityLog: [{
          id: 'wo-activity-3',
          action: 'Work Order Created',
          description: 'Plumbing work order created from accepted quote',
          performedBy: 'manager-1',
          timestamp: new Date('2024-03-09T17:00:00Z'),
          metadata: { ticketId: 'ticket-2' }
        }],
        quotes: [],
        userFeedback: null
      },
      {
        id: 'wo-3',
        buildingId: 'building-3',
        title: 'Gym Equipment Service Complete',
        description: 'Completed servicing and repair of treadmill #2',
        priority: 'low' as WorkOrderPriority,
        status: 'completed' as WorkOrderStatus,
        flatId: null,
        scheduledDate: new Date('2024-03-06T10:00:00Z'),
        assignedToUid: 'contractor-2',
        requestedBy: 'manager-3',
        createdAt: new Date('2024-03-05T17:00:00Z'),
        updatedAt: new Date('2024-03-06T15:00:00Z'),
        activityLog: [{
          id: 'wo-activity-5',
          action: 'Work Completed',
          description: 'Treadmill serviced, belt replaced, calibration completed',
          performedBy: 'contractor-2',
          timestamp: new Date('2024-03-06T15:00:00Z'),
          metadata: {}
        }],
        quotes: [],
        userFeedback: {
          rating: 5,
          comment: 'Excellent service, treadmill working perfectly now',
          submittedBy: 'resident-15',
          submittedAt: new Date('2024-03-07T09:00:00Z')
        }
      }
    ]
  }

  // Budget Data with UK Compliance
  static getBudgets(): Budget[] {
    return [
      {
        id: 'budget-1',
        buildingId: 'building-1',
        year: 2024,
        financialYearStart: new Date('2024-04-01'),
        financialYearEnd: new Date('2025-03-31'),
        status: 'active',
        isLocked: false,
        totalBudget: 85000,
        categories: [
          {
            id: 'cat-1',
            name: 'Service Charges',
            type: 'income',
            budgetedAmount: 67200,
            actualAmount: 45600,
            description: 'Quarterly service charges from residents'
          },
          {
            id: 'cat-2', 
            name: 'Ground Rent',
            type: 'income',
            budgetedAmount: 8400,
            actualAmount: 8400,
            description: 'Annual ground rent collection'
          },
          {
            id: 'cat-3',
            name: 'Planned Maintenance',
            type: 'expenditure',
            budgetedAmount: 25000,
            actualAmount: 18500,
            description: 'Scheduled maintenance and repairs'
          },
          {
            id: 'cat-4',
            name: 'Insurance',
            type: 'expenditure',
            budgetedAmount: 12000,
            actualAmount: 11800,
            description: 'Building insurance premiums'
          }
        ],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-10'),
        createdBy: 'manager-1',
        approvedBy: 'admin-1',
        approvedAt: new Date('2024-03-05')
      },
      {
        id: 'budget-2',
        buildingId: 'building-2',
        year: 2024,
        financialYearStart: new Date('2024-04-01'),
        financialYearEnd: new Date('2025-03-31'),
        status: 'active',
        isLocked: false,
        totalBudget: 72000,
        categories: [
          {
            id: 'cat-6',
            name: 'Service Charges',
            type: 'income',
            budgetedAmount: 54000,
            actualAmount: 36000,
            description: 'Quarterly service charges'
          },
          {
            id: 'cat-7',
            name: 'Ground Rent', 
            type: 'income',
            budgetedAmount: 7200,
            actualAmount: 7200,
            description: 'Annual ground rent'
          }
        ],
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-03-08'),
        createdBy: 'manager-2',
        approvedBy: 'admin-1',
        approvedAt: new Date('2024-02-20')
      },
      {
        id: 'budget-3',
        buildingId: 'building-3',
        year: 2024,
        financialYearStart: new Date('2024-04-01'),
        financialYearEnd: new Date('2025-03-31'),
        status: 'active',
        isLocked: false,
        totalBudget: 125000,
        categories: [
          {
            id: 'cat-10',
            name: 'Service Charges',
            type: 'income',
            budgetedAmount: 91800,
            actualAmount: 68850,
            description: 'Quarterly service charges'
          },
          {
            id: 'cat-11',
            name: 'Ground Rent',
            type: 'income',
            budgetedAmount: 15300,
            actualAmount: 15300,
            description: 'Annual ground rent'
          }
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-03-12'),
        createdBy: 'manager-3',
        approvedBy: 'admin-1',
        approvedAt: new Date('2024-02-10')
      }
    ]
  }

  // Service Methods
  static getDataByBuilding<T extends { buildingId: string }>(data: T[], buildingId: string): T[] {
    return data.filter(item => item.buildingId === buildingId)
  }

  static getAllData() {
    return {
      buildings: this.getBuildings(),
      flats: this.getFlats(),
      residents: this.getResidents(),
      tickets: this.getTickets(),
      workOrders: this.getWorkOrders(),
      budgets: this.getBudgets()
    }
  }
}

export default MockDataService
