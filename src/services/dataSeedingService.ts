import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  Building, 
  Flat, 
  Person, 
  PersonStatus,
  Asset, 
  AssetStatus,
  Ticket, 
  TicketStatus, 
  UrgencyLevel,
  Budget, 
  BudgetCategoryItem,
  Invoice, 
  InvoiceStatus,
  ServiceChargeDemand,
  ServiceChargeDemandStatus,
  Income,
  Expenditure,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  QuoteRequest,
  QuoteRequestStatus,
  Reminder,
  ReminderType,
  ReminderPriority,
  ReminderSeverity
} from '../types'

// Sample data for seeding
const sampleBuildings: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Sunset Towers',
    address: '123 Sunset Boulevard, Los Angeles, CA 90210',
    totalFloors: 15,
    totalUnits: 120,
    yearBuilt: 2010,
    propertyType: 'Residential',
    amenities: ['Pool', 'Gym', 'Parking', 'Security'],
    managerId: 'manager1',
    contactInfo: {
      phone: '+1-555-0123',
      email: 'manager@sunsettowers.com'
    },
    financialInfo: {
      serviceChargeRate: 2.5,
      reserveFundBalance: 500000,
      monthlyExpenses: 45000
    }
  },
  {
    name: 'Marina Heights',
    address: '456 Ocean Drive, Miami, FL 33139',
    totalFloors: 20,
    totalUnits: 180,
    yearBuilt: 2015,
    propertyType: 'Residential',
    amenities: ['Marina', 'Beach Access', 'Spa', 'Restaurant'],
    managerId: 'manager2',
    contactInfo: {
      phone: '+1-555-0456',
      email: 'manager@marinaheights.com'
    },
    financialInfo: {
      serviceChargeRate: 3.2,
      reserveFundBalance: 750000,
      monthlyExpenses: 65000
    }
  }
]

const sampleFlats: Omit<Flat, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Sunset Towers Flats
  { buildingId: 'building1', flatNumber: '101', floor: 1, areaSqFt: 850, bedrooms: 2, bathrooms: 2, status: 'occupied', currentRent: 2500, groundRent: 0 },
  { buildingId: 'building1', flatNumber: '102', floor: 1, areaSqFt: 950, bedrooms: 2, bathrooms: 2, status: 'occupied', currentRent: 2800, groundRent: 0 },
  { buildingId: 'building1', flatNumber: '201', floor: 2, areaSqFt: 1200, bedrooms: 3, bathrooms: 2, status: 'occupied', currentRent: 3500, groundRent: 0 },
  { buildingId: 'building1', flatNumber: '202', floor: 2, areaSqFt: 1100, bedrooms: 2, bathrooms: 2, status: 'vacant', currentRent: 3200, groundRent: 0 },
  { buildingId: 'building1', flatNumber: '301', floor: 3, areaSqFt: 1400, bedrooms: 3, bathrooms: 3, status: 'occupied', currentRent: 4200, groundRent: 0 },
  
  // Marina Heights Flats
  { buildingId: 'building2', flatNumber: 'A101', floor: 1, areaSqFt: 900, bedrooms: 2, bathrooms: 2, status: 'occupied', currentRent: 3800, groundRent: 200 },
  { buildingId: 'building2', flatNumber: 'A102', floor: 1, areaSqFt: 1100, bedrooms: 3, bathrooms: 2, status: 'occupied', currentRent: 4500, groundRent: 250 },
  { buildingId: 'building2', flatNumber: 'B201', floor: 2, areaSqFt: 1300, bedrooms: 3, bathrooms: 3, status: 'occupied', currentRent: 5200, groundRent: 300 },
  { buildingId: 'building2', flatNumber: 'B202', floor: 2, areaSqFt: 1500, bedrooms: 4, bathrooms: 3, status: 'vacant', currentRent: 5800, groundRent: 350 }
]

const samplePeople: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Sunset Towers Residents
  { buildingId: 'building1', flatId: 'flat1', name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-0001', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident1', emergencyContact: { name: 'Jane Smith', phone: '+1-555-0002' }, createdByUid: 'manager1' },
  { buildingId: 'building1', flatId: 'flat2', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '+1-555-0003', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident2', emergencyContact: { name: 'Mike Johnson', phone: '+1-555-0004' }, createdByUid: 'manager1' },
  { buildingId: 'building1', flatId: 'flat3', name: 'David Wilson', email: 'david.wilson@email.com', phone: '+1-555-0005', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident3', emergencyContact: { name: 'Lisa Wilson', phone: '+1-555-0006' }, createdByUid: 'manager1' },
  { buildingId: 'building1', flatId: 'flat4', name: 'Emily Brown', email: 'emily.brown@email.com', phone: '+1-555-0007', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident4', emergencyContact: { name: 'Robert Brown', phone: '+1-555-0008' }, createdByUid: 'manager1' },
  { buildingId: 'building1', flatId: 'flat5', name: 'Michael Davis', email: 'michael.davis@email.com', phone: '+1-555-0009', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident5', emergencyContact: { name: 'Jennifer Davis', phone: '+1-555-0010' }, createdByUid: 'manager1' },
  
  // Marina Heights Residents
  { buildingId: 'building2', flatId: 'flat6', name: 'Jessica Garcia', email: 'jessica.garcia@email.com', phone: '+1-555-0011', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident6', emergencyContact: { name: 'Carlos Garcia', phone: '+1-555-0012' }, createdByUid: 'manager2' },
  { buildingId: 'building2', flatId: 'flat7', name: 'Christopher Martinez', email: 'chris.martinez@email.com', phone: '+1-555-0013', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident7', emergencyContact: { name: 'Maria Martinez', phone: '+1-555-0014' }, createdByUid: 'manager2' },
  { buildingId: 'building2', flatId: 'flat8', name: 'Amanda Rodriguez', email: 'amanda.rodriguez@email.com', phone: '+1-555-0015', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident8', emergencyContact: { name: 'Jose Rodriguez', phone: '+1-555-0016' }, createdByUid: 'manager2' },
  { buildingId: 'building2', flatId: 'flat9', name: 'Daniel Lopez', email: 'daniel.lopez@email.com', phone: '+1-555-0017', role: 'resident', status: PersonStatus.RESIDENT, uid: 'resident9', emergencyContact: { name: 'Ana Lopez', phone: '+1-555-0018' }, createdByUid: 'manager2' }
]

const sampleAssets: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Sunset Towers Assets
  { buildingId: 'building1', name: 'HVAC System - Floor 1', type: 'HVAC', locationDescription: 'Mechanical Room - Floor 1', status: AssetStatus.OPERATIONAL, purchaseDate: new Date('2020-01-15'), warrantyExpiryDate: new Date('2025-01-15'), nextServiceDate: new Date('2024-02-15'), createdByUid: 'manager1' },
  { buildingId: 'building1', name: 'Elevator - Main', type: 'Elevator', locationDescription: 'Main Lobby', status: AssetStatus.OPERATIONAL, purchaseDate: new Date('2019-06-20'), warrantyExpiryDate: new Date('2024-06-20'), nextServiceDate: new Date('2024-01-17'), createdByUid: 'manager1' },
  { buildingId: 'building1', name: 'Security System', type: 'Security', locationDescription: 'Security Office', status: AssetStatus.OPERATIONAL, purchaseDate: new Date('2021-03-10'), warrantyExpiryDate: new Date('2026-03-10'), nextServiceDate: new Date('2024-04-15'), createdByUid: 'manager1' },
  
  // Marina Heights Assets
  { buildingId: 'building2', name: 'Pool Filtration System', type: 'Pool Equipment', locationDescription: 'Pool Equipment Room', status: AssetStatus.OPERATIONAL, purchaseDate: new Date('2020-08-05'), warrantyExpiryDate: new Date('2025-08-05'), nextServiceDate: new Date('2024-01-19'), createdByUid: 'manager2' },
  { buildingId: 'building2', name: 'Marina Dock System', type: 'Marina Equipment', locationDescription: 'Marina Area', status: AssetStatus.OPERATIONAL, purchaseDate: new Date('2019-12-01'), warrantyExpiryDate: new Date('2024-12-01'), nextServiceDate: new Date('2024-02-15'), createdByUid: 'manager2' },
  { buildingId: 'building2', name: 'Spa Equipment', type: 'Spa Equipment', locationDescription: 'Spa Area', status: AssetStatus.OPERATIONAL, purchaseDate: new Date('2021-01-20'), warrantyExpiryDate: new Date('2026-01-20'), nextServiceDate: new Date('2024-02-05'), createdByUid: 'manager2' }
]

const sampleTickets: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { title: 'HVAC not cooling properly', description: 'Air conditioning unit in apartment 101 is not cooling effectively', location: 'Apartment 101', urgency: 'Medium', status: 'In Progress', requestedBy: 'resident1', assignedTo: 'supplier1', attachments: [], activityLog: [], quotes: [] },
  { title: 'Elevator making strange noise', description: 'Main elevator is making grinding noises when moving between floors', location: 'Main Lobby', urgency: 'High', status: 'New', requestedBy: 'resident2', assignedTo: 'supplier2', attachments: [], activityLog: [], quotes: [] },
  { title: 'Security camera malfunction', description: 'Camera 3 in parking garage is showing black screen', location: 'Parking Garage', urgency: 'Low', status: 'Complete', requestedBy: 'resident3', assignedTo: 'supplier3', attachments: [], activityLog: [], quotes: [] },
  
  { title: 'Pool heater not working', description: 'Pool water temperature is too cold, heater seems to be malfunctioning', location: 'Pool Area', urgency: 'High', status: 'In Progress', requestedBy: 'resident6', assignedTo: 'supplier4', attachments: [], activityLog: [], quotes: [] },
  { title: 'Marina dock lights out', description: 'Several dock lights are not working, creating safety hazard', location: 'Marina Dock', urgency: 'Medium', status: 'New', requestedBy: 'resident7', assignedTo: 'supplier5', attachments: [], activityLog: [], quotes: [] },
  { title: 'Spa jets not functioning', description: 'Half of the spa jets are not working properly', location: 'Spa Area', urgency: 'Low', status: 'Complete', requestedBy: 'resident8', assignedTo: 'supplier6', attachments: [], activityLog: [], quotes: [] }
]

const sampleBudgets: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', year: 2024, totalAmount: 500000, allocatedAmount: 450000, spentAmount: 420000, remainingAmount: 50000, status: 'approved', categories: [], createdBy: 'manager1' },
  { buildingId: 'building2', year: 2024, totalAmount: 750000, allocatedAmount: 680000, spentAmount: 650000, remainingAmount: 70000, status: 'approved', categories: [], createdBy: 'manager2' }
]

const sampleBudgetCategories: Omit<BudgetCategoryItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { budgetId: 'budget1', name: 'Maintenance', type: 'expenditure', budgetAmount: 150000, actualAmount: 120000, allocatedAmount: 150000, spentAmount: 120000, remainingAmount: 30000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget1', name: 'Utilities', type: 'expenditure', budgetAmount: 100000, actualAmount: 95000, allocatedAmount: 100000, spentAmount: 95000, remainingAmount: 5000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget1', name: 'Security', type: 'expenditure', budgetAmount: 80000, actualAmount: 75000, allocatedAmount: 80000, spentAmount: 75000, remainingAmount: 5000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget1', name: 'Landscaping', type: 'expenditure', budgetAmount: 60000, actualAmount: 55000, allocatedAmount: 60000, spentAmount: 55000, remainingAmount: 5000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget1', name: 'Insurance', type: 'expenditure', budgetAmount: 50000, actualAmount: 48000, allocatedAmount: 50000, spentAmount: 48000, remainingAmount: 2000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget1', name: 'Administrative', type: 'expenditure', budgetAmount: 60000, actualAmount: 52000, allocatedAmount: 60000, spentAmount: 52000, remainingAmount: 8000, approvalThreshold: 10000, attachments: [] },
  
  { budgetId: 'budget2', name: 'Maintenance', type: 'expenditure', budgetAmount: 200000, actualAmount: 180000, allocatedAmount: 200000, spentAmount: 180000, remainingAmount: 20000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget2', name: 'Utilities', type: 'expenditure', budgetAmount: 150000, actualAmount: 140000, allocatedAmount: 150000, spentAmount: 140000, remainingAmount: 10000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget2', name: 'Marina Operations', type: 'expenditure', budgetAmount: 100000, actualAmount: 85000, allocatedAmount: 100000, spentAmount: 85000, remainingAmount: 15000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget2', name: 'Pool & Spa', type: 'expenditure', budgetAmount: 80000, actualAmount: 72000, allocatedAmount: 80000, spentAmount: 72000, remainingAmount: 8000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget2', name: 'Security', type: 'expenditure', budgetAmount: 120000, actualAmount: 110000, allocatedAmount: 120000, spentAmount: 110000, remainingAmount: 10000, approvalThreshold: 10000, attachments: [] },
  { budgetId: 'budget2', name: 'Administrative', type: 'expenditure', budgetAmount: 100000, actualAmount: 93000, allocatedAmount: 100000, spentAmount: 93000, remainingAmount: 7000, approvalThreshold: 10000, attachments: [] }
]

const sampleInvoices: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', ticketId: 'ticket1', vendorId: 'supplier1', invoiceNumber: 'INV-2024-001', amount: 450, currency: 'USD', description: 'HVAC repair - Apartment 101', status: InvoiceStatus.APPROVED, paymentStatus: 'paid', dueDate: new Date('2024-02-15'), paidDate: new Date('2024-01-25'), category: 'Maintenance', attachments: [], createdBy: 'manager1' },
  { buildingId: 'building1', ticketId: 'ticket2', vendorId: 'supplier2', invoiceNumber: 'INV-2024-002', amount: 1200, currency: 'USD', description: 'Elevator maintenance and repair', status: InvoiceStatus.PENDING, paymentStatus: 'pending', dueDate: new Date('2024-02-20'), category: 'Maintenance', attachments: [], createdBy: 'manager1' },
  { buildingId: 'building1', ticketId: 'ticket3', vendorId: 'supplier3', invoiceNumber: 'INV-2024-003', amount: 280, currency: 'USD', description: 'Security camera replacement', status: InvoiceStatus.PAID, paymentStatus: 'paid', dueDate: new Date('2024-01-30'), paidDate: new Date('2024-01-20'), category: 'Security', attachments: [], createdBy: 'manager1' },
  
  { buildingId: 'building2', ticketId: 'ticket4', vendorId: 'supplier4', invoiceNumber: 'INV-2024-004', amount: 800, currency: 'USD', description: 'Pool heater repair', status: InvoiceStatus.PENDING, paymentStatus: 'pending', dueDate: new Date('2024-02-25'), category: 'Pool Equipment', attachments: [], createdBy: 'manager2' },
  { buildingId: 'building2', ticketId: 'ticket5', vendorId: 'supplier5', invoiceNumber: 'INV-2024-005', amount: 600, currency: 'USD', description: 'Dock lighting repair', status: InvoiceStatus.PENDING, paymentStatus: 'pending', dueDate: new Date('2024-02-28'), category: 'Marina Equipment', attachments: [], createdBy: 'manager2' },
  { buildingId: 'building2', ticketId: 'ticket6', vendorId: 'supplier6', invoiceNumber: 'INV-2024-006', amount: 380, currency: 'USD', description: 'Spa jet repair', status: InvoiceStatus.PAID, paymentStatus: 'paid', dueDate: new Date('2024-01-25'), paidDate: new Date('2024-01-18'), category: 'Spa Equipment', attachments: [], createdBy: 'manager2' }
]

const sampleServiceChargeDemands: Omit<ServiceChargeDemand, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', flatId: 'flat1', flatNumber: '101', residentUid: 'resident1', residentName: 'John Smith', financialQuarterDisplayString: 'Q1 2024', areaSqFt: 850, rateApplied: 2.5, baseAmount: 2125, groundRentAmount: 0, penaltyAmountApplied: 0, totalAmountDue: 2125, amountPaid: 2125, outstandingAmount: 0, dueDate: new Date('2024-03-31'), issuedDate: new Date('2024-01-01'), status: ServiceChargeDemandStatus.PAID, paymentHistory: [], notes: '', issuedByUid: 'manager1', penaltyAppliedAt: null, invoiceGrouping: 'per_unit', showBreakdown: false, chargeBreakdown: [], penaltyConfig: { type: 'flat', flatAmount: 50, gracePeriodDays: 7 }, remindersConfig: { reminderDays: [7, 3, 1], maxReminders: 3 }, remindersSent: 0 },
  { buildingId: 'building1', flatId: 'flat2', flatNumber: '102', residentUid: 'resident2', residentName: 'Sarah Johnson', financialQuarterDisplayString: 'Q1 2024', areaSqFt: 950, rateApplied: 2.5, baseAmount: 2375, groundRentAmount: 0, penaltyAmountApplied: 0, totalAmountDue: 2375, amountPaid: 2000, outstandingAmount: 375, dueDate: new Date('2024-03-31'), issuedDate: new Date('2024-01-01'), status: ServiceChargeDemandStatus.PARTIALLY_PAID, paymentHistory: [], notes: '', issuedByUid: 'manager1', penaltyAppliedAt: null, invoiceGrouping: 'per_unit', showBreakdown: false, chargeBreakdown: [], penaltyConfig: { type: 'flat', flatAmount: 50, gracePeriodDays: 7 }, remindersConfig: { reminderDays: [7, 3, 1], maxReminders: 3 }, remindersSent: 1, lastReminderSent: new Date('2024-01-15') },
  { buildingId: 'building1', flatId: 'flat3', flatNumber: '201', residentUid: 'resident3', residentName: 'David Wilson', financialQuarterDisplayString: 'Q1 2024', areaSqFt: 1200, rateApplied: 2.5, baseAmount: 3000, groundRentAmount: 0, penaltyAmountApplied: 0, totalAmountDue: 3000, amountPaid: 0, outstandingAmount: 3000, dueDate: new Date('2024-03-31'), issuedDate: new Date('2024-01-01'), status: ServiceChargeDemandStatus.OVERDUE, paymentHistory: [], notes: '', issuedByUid: 'manager1', penaltyAppliedAt: null, invoiceGrouping: 'per_unit', showBreakdown: false, chargeBreakdown: [], penaltyConfig: { type: 'flat', flatAmount: 50, gracePeriodDays: 7 }, remindersConfig: { reminderDays: [7, 3, 1], maxReminders: 3 }, remindersSent: 2, lastReminderSent: new Date('2024-01-20') },
  
  { buildingId: 'building2', flatId: 'flat6', flatNumber: 'A101', residentUid: 'resident6', residentName: 'Jessica Garcia', financialQuarterDisplayString: 'Q1 2024', areaSqFt: 900, rateApplied: 3.2, baseAmount: 2880, groundRentAmount: 200, penaltyAmountApplied: 0, totalAmountDue: 3080, amountPaid: 3080, outstandingAmount: 0, dueDate: new Date('2024-03-31'), issuedDate: new Date('2024-01-01'), status: ServiceChargeDemandStatus.PAID, paymentHistory: [], notes: '', issuedByUid: 'manager2', penaltyAppliedAt: null, invoiceGrouping: 'per_unit', showBreakdown: false, chargeBreakdown: [], penaltyConfig: { type: 'flat', flatAmount: 75, gracePeriodDays: 7 }, remindersConfig: { reminderDays: [7, 3, 1], maxReminders: 3 }, remindersSent: 0 },
  { buildingId: 'building2', flatId: 'flat7', flatNumber: 'A102', residentUid: 'resident7', residentName: 'Christopher Martinez', financialQuarterDisplayString: 'Q1 2024', areaSqFt: 1100, rateApplied: 3.2, baseAmount: 3520, groundRentAmount: 250, penaltyAmountApplied: 0, totalAmountDue: 3770, amountPaid: 0, outstandingAmount: 3770, dueDate: new Date('2024-03-31'), issuedDate: new Date('2024-01-01'), status: ServiceChargeDemandStatus.OVERDUE, paymentHistory: [], notes: '', issuedByUid: 'manager2', penaltyAppliedAt: null, invoiceGrouping: 'per_unit', showBreakdown: false, chargeBreakdown: [], penaltyConfig: { type: 'flat', flatAmount: 75, gracePeriodDays: 7 }, remindersConfig: { reminderDays: [7, 3, 1], maxReminders: 3 }, remindersSent: 3, lastReminderSent: new Date('2024-01-25') }
]

const sampleIncome: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', date: new Date('2024-01-15'), amount: 2125, source: 'building_charges', description: 'Service charge payment - Flat 101', relatedInvoiceId: 'demand1', recordedByUid: 'manager1' },
  { buildingId: 'building1', date: new Date('2024-01-20'), amount: 2000, source: 'building_charges', description: 'Partial payment - Flat 102', relatedInvoiceId: 'demand2', recordedByUid: 'manager1' },
  { buildingId: 'building1', date: new Date('2024-01-25'), amount: 450, source: 'penalty', description: 'Late payment penalty - Flat 201', relatedInvoiceId: 'demand3', recordedByUid: 'manager1' },
  
  { buildingId: 'building2', date: new Date('2024-01-10'), amount: 3080, source: 'building_charges', description: 'Service charge payment - Flat A101', relatedInvoiceId: 'demand4', recordedByUid: 'manager2' },
  { buildingId: 'building2', date: new Date('2024-01-15'), amount: 75, source: 'penalty', description: 'Late payment penalty - Flat A102', relatedInvoiceId: 'demand5', recordedByUid: 'manager2' }
]

const sampleExpenditure: Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', date: new Date('2024-01-15'), amount: 450, category: 'reactive_maintenance', description: 'HVAC repair - Apartment 101', tag: 'reactive', supportingDocumentUrl: '', vendorId: 'supplier1', vendorName: 'ABC Plumbing', recordedByUid: 'manager1' },
  { buildingId: 'building1', date: new Date('2024-01-20'), amount: 280, category: 'security', description: 'Security camera replacement', tag: 'reactive', supportingDocumentUrl: '', vendorId: 'supplier3', vendorName: 'Secure Systems Inc.', recordedByUid: 'manager1' },
  { buildingId: 'building1', date: new Date('2024-01-25'), amount: 1200, category: 'proactive_maintenance', description: 'Elevator maintenance', tag: 'proactive', supportingDocumentUrl: '', vendorId: 'supplier2', vendorName: 'XYZ Elevator Co.', recordedByUid: 'manager1' },
  
  { buildingId: 'building2', date: new Date('2024-01-10'), amount: 380, category: 'other', description: 'Spa jet repair', tag: 'reactive', supportingDocumentUrl: '', vendorId: 'supplier6', vendorName: 'Spa Specialists', recordedByUid: 'manager2' },
  { buildingId: 'building2', date: new Date('2024-01-15'), amount: 800, category: 'other', description: 'Pool heater repair', tag: 'reactive', supportingDocumentUrl: '', vendorId: 'supplier4', vendorName: 'Pool Masters', recordedByUid: 'manager2' },
  { buildingId: 'building2', date: new Date('2024-01-20'), amount: 600, category: 'other', description: 'Dock lighting repair', tag: 'reactive', supportingDocumentUrl: '', vendorId: 'supplier5', vendorName: 'Marina Services', recordedByUid: 'manager2' }
]

const sampleWorkOrders: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', title: 'HVAC System Maintenance', description: 'Annual maintenance of all HVAC units', status: WorkOrderStatus.SCHEDULED, priority: WorkOrderPriority.MEDIUM, createdByUid: 'manager1', createdByUserEmail: 'manager@sunsettowers.com', assignedToUid: 'supplier1', assignedToUserEmail: 'supplier1@email.com', resolutionNotes: [], quoteRequests: [], managerCommunication: [] },
  { buildingId: 'building1', title: 'Security System Upgrade', description: 'Upgrade security cameras and access control system', status: WorkOrderStatus.TRIAGE, priority: WorkOrderPriority.HIGH, createdByUid: 'manager1', createdByUserEmail: 'manager@sunsettowers.com', assignedToUid: 'supplier3', assignedToUserEmail: 'supplier3@email.com', resolutionNotes: [], quoteRequests: [], managerCommunication: [] },
  
  { buildingId: 'building2', title: 'Pool Deck Resurfacing', description: 'Resurface pool deck and repair cracks', status: WorkOrderStatus.RESOLVED, priority: WorkOrderPriority.MEDIUM, createdByUid: 'manager2', createdByUserEmail: 'manager@marinaheights.com', assignedToUid: 'supplier4', assignedToUserEmail: 'supplier4@email.com', resolutionNotes: [], quoteRequests: [], managerCommunication: [] },
  { buildingId: 'building2', title: 'Marina Dock Inspection', description: 'Annual inspection and maintenance of marina dock system', status: WorkOrderStatus.SCHEDULED, priority: WorkOrderPriority.LOW, createdByUid: 'manager2', createdByUserEmail: 'manager@marinaheights.com', assignedToUid: 'supplier5', assignedToUserEmail: 'supplier5@email.com', resolutionNotes: [], quoteRequests: [], managerCommunication: [] }
]

const sampleReminders: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { buildingId: 'building1', userId: 'resident3', title: 'Service Charge Due', description: 'Reminder for Q1 2024 service charge payment', type: ReminderType.LATE_PAYMENT_PENALTY, severity: ReminderSeverity.WARNING, priority: ReminderPriority.HIGH, isDismissed: false },
  { buildingId: 'building1', userId: 'supplier1', title: 'HVAC Maintenance', description: 'Schedule annual HVAC maintenance', type: ReminderType.USER_FEEDBACK_REQUESTED, severity: ReminderSeverity.INFO, priority: ReminderPriority.NORMAL, isDismissed: false },
  
  { buildingId: 'building2', userId: 'resident7', title: 'Service Charge Due', description: 'Reminder for Q1 2024 service charge payment', type: ReminderType.LATE_PAYMENT_PENALTY, severity: ReminderSeverity.WARNING, priority: ReminderPriority.HIGH, isDismissed: false },
  { buildingId: 'building2', userId: 'supplier4', title: 'Pool Equipment Maintenance', description: 'Schedule quarterly pool equipment maintenance', type: ReminderType.USER_FEEDBACK_REQUESTED, severity: ReminderSeverity.INFO, priority: ReminderPriority.NORMAL, isDismissed: false }
]

// Main seeding function
export const seedAllData = async (): Promise<{ success: boolean; message: string; dataCount: any }> => {
  try {
    const batch = writeBatch(db)
    const dataCount = {
      buildings: 0,
      flats: 0,
      people: 0,
      assets: 0,
      tickets: 0,
      budgets: 0,
      budgetCategories: 0,
      invoices: 0,
      serviceChargeDemands: 0,
      income: 0,
      expenditure: 0,
      workOrders: 0,
      reminders: 0
    }

    // Seed Buildings
    for (const building of sampleBuildings) {
      const buildingRef = doc(collection(db, 'buildings'))
      batch.set(buildingRef, {
        ...building,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.buildings++
    }

    // Seed Flats
    for (const flat of sampleFlats) {
      const flatRef = doc(collection(db, 'flats'))
      batch.set(flatRef, {
        ...flat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.flats++
    }

    // Seed People
    for (const person of samplePeople) {
      const personRef = doc(collection(db, 'people'))
      batch.set(personRef, {
        ...person,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.people++
    }

    // Seed Assets
    for (const asset of sampleAssets) {
      const assetRef = doc(collection(db, 'assets'))
      batch.set(assetRef, {
        ...asset,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.assets++
    }

    // Seed Tickets
    for (const ticket of sampleTickets) {
      const ticketRef = doc(collection(db, 'tickets'))
      batch.set(ticketRef, {
        ...ticket,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.tickets++
    }

    // Seed Budgets
    for (const budget of sampleBudgets) {
      const budgetRef = doc(collection(db, 'budgets'))
      batch.set(budgetRef, {
        ...budget,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.budgets++
    }

    // Seed Budget Categories
    for (const category of sampleBudgetCategories) {
      const categoryRef = doc(collection(db, 'budgetCategories'))
      batch.set(categoryRef, {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.budgetCategories++
    }

    // Seed Invoices
    for (const invoice of sampleInvoices) {
      const invoiceRef = doc(collection(db, 'invoices'))
      batch.set(invoiceRef, {
        ...invoice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.invoices++
    }

    // Seed Service Charge Demands
    for (const demand of sampleServiceChargeDemands) {
      const demandRef = doc(collection(db, 'serviceChargeDemands'))
      batch.set(demandRef, {
        ...demand,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.serviceChargeDemands++
    }

    // Seed Income
    for (const income of sampleIncome) {
      const incomeRef = doc(collection(db, 'income'))
      batch.set(incomeRef, {
        ...income,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.income++
    }

    // Seed Expenditure
    for (const expenditure of sampleExpenditure) {
      const expenditureRef = doc(collection(db, 'expenditure'))
      batch.set(expenditureRef, {
        ...expenditure,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.expenditure++
    }

    // Seed Work Orders
    for (const workOrder of sampleWorkOrders) {
      const workOrderRef = doc(collection(db, 'workOrders'))
      batch.set(workOrderRef, {
        ...workOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.workOrders++
    }

    // Seed Reminders
    for (const reminder of sampleReminders) {
      const reminderRef = doc(collection(db, 'reminders'))
      batch.set(reminderRef, {
        ...reminder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      dataCount.reminders++
    }

    await batch.commit()

    return {
      success: true,
      message: 'Successfully seeded all data',
      dataCount
    }
  } catch (error) {
    console.error('Error seeding data:', error)
    return {
      success: false,
      message: `Error seeding data: ${error}`,
      dataCount: {}
    }
  }
}

// Individual seeding functions for specific collections
export const seedBuildings = async () => {
  const batch = writeBatch(db)
  for (const building of sampleBuildings) {
    const buildingRef = doc(collection(db, 'buildings'))
    batch.set(buildingRef, {
      ...building,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  await batch.commit()
  return { success: true, message: 'Buildings seeded successfully' }
}

export const seedFinancialData = async () => {
  const batch = writeBatch(db)
  
  // Seed budgets and categories
  for (const budget of sampleBudgets) {
    const budgetRef = doc(collection(db, 'budgets'))
    batch.set(budgetRef, {
      ...budget,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  for (const category of sampleBudgetCategories) {
    const categoryRef = doc(collection(db, 'budgetCategories'))
    batch.set(categoryRef, {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  // Seed invoices
  for (const invoice of sampleInvoices) {
    const invoiceRef = doc(collection(db, 'invoices'))
    batch.set(invoiceRef, {
      ...invoice,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  // Seed service charge demands
  for (const demand of sampleServiceChargeDemands) {
    const demandRef = doc(collection(db, 'serviceChargeDemands'))
    batch.set(demandRef, {
      ...demand,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  // Seed income and expenditure
  for (const income of sampleIncome) {
    const incomeRef = doc(collection(db, 'income'))
    batch.set(incomeRef, {
      ...income,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  for (const expenditure of sampleExpenditure) {
    const expenditureRef = doc(collection(db, 'expenditure'))
    batch.set(expenditureRef, {
      ...expenditure,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  await batch.commit()
  return { success: true, message: 'Financial data seeded successfully' }
}

export const seedMaintenanceData = async () => {
  const batch = writeBatch(db)
  
  // Seed assets
  for (const asset of sampleAssets) {
    const assetRef = doc(collection(db, 'assets'))
    batch.set(assetRef, {
      ...asset,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  // Seed tickets
  for (const ticket of sampleTickets) {
    const ticketRef = doc(collection(db, 'tickets'))
    batch.set(ticketRef, {
      ...ticket,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  // Seed work orders
  for (const workOrder of sampleWorkOrders) {
    const workOrderRef = doc(collection(db, 'workOrders'))
    batch.set(workOrderRef, {
      ...workOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  await batch.commit()
  return { success: true, message: 'Maintenance data seeded successfully' }
} 