// Comprehensive Mock Data for Multi-Building System Testing
import { Building, Flat, Ticket, WorkOrder, Person, PaymentFrequency, WorkOrderStatus, WorkOrderPriority, UrgencyLevel, TicketStatus, AssetCategory, AssetStatus } from '../types'

// Mock Buildings - Compatible with Building interface
export const mockBuildings = [
  {
    id: 'building-1',
    name: 'Riverside Gardens',
    address: '123 Thames View, London SW1A 1AA',
    code: 'RG001',
    buildingType: 'Residential',
    floors: 8,
    units: 24,
    capacity: 60,
    area: 28800, // sq ft
    financialYearStart: new Date('2024-04-01'),
    managers: ['manager-1'],
    admins: ['admin-1'],
    assets: [],
    meters: [],
    totalFloors: 8,
    totalUnits: 24,
    totalFlats: 24,
    yearBuilt: 2018,
    propertyType: 'Residential',
    amenities: ['Gym', 'Concierge', 'Garden', 'Parking'],
    managerId: 'manager-1',
    contactInfo: {
      phone: '+44 20 7123 4567',
      email: 'info@riversidegardens.co.uk'
    },
    financialInfo: {
      serviceChargeRate: 280,
      reserveFundBalance: 45000,
      monthlyExpenses: 12500
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'building-2', 
    name: 'Victoria Heights',
    address: '456 Victoria Street, London SW1E 6QP',
    code: 'VH002',
    buildingType: 'Residential',
    floors: 6,
    units: 18,
    capacity: 45,
    area: 21600, // sq ft
    financialYearStart: new Date('2024-04-01'),
    managers: ['manager-2'],
    admins: ['admin-2'],
    assets: [],
    meters: [],
    totalFloors: 6,
    totalUnits: 18,
    totalFlats: 18,
    yearBuilt: 2020,
    propertyType: 'Residential',
    amenities: ['Gym', 'Roof Terrace', 'Bike Storage'],
    managerId: 'manager-2',
    contactInfo: {
      phone: '+44 20 7234 5678',
      email: 'info@victoriaheights.co.uk'
    },
    financialInfo: {
      serviceChargeRate: 320,
      reserveFundBalance: 38000,
      monthlyExpenses: 9800
    },
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2024-03-08')
  },
  {
    id: 'building-3',
    name: 'Canary Wharf Towers',
    address: '789 Canary Wharf, London E14 5AB',
    code: 'CWT003',
    buildingType: 'Residential',
    floors: 12,
    units: 36,
    capacity: 90,
    area: 43200, // sq ft
    financialYearStart: new Date('2024-04-01'),
    managers: ['manager-3'],
    admins: ['admin-3'],
    assets: [],
    meters: [],
    totalFloors: 12,
    totalUnits: 36,
    totalFlats: 36,
    yearBuilt: 2019,
    propertyType: 'Residential',
    amenities: ['Gym', 'Pool', 'Concierge', 'Business Center', 'Parking'],
    managerId: 'manager-3',
    contactInfo: {
      phone: '+44 20 7345 6789',
      email: 'info@canarywharftowers.co.uk'
    },
    financialInfo: {
      serviceChargeRate: 450,
      reserveFundBalance: 75000,
      monthlyExpenses: 18500
    },
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-03-12')
  }
]

// Mock Flats - Compatible with Flat interface and Building Data components
export const mockFlats = [
  // Riverside Gardens
  { 
    id: 'flat-1', 
    buildingId: 'building-1', 
    flatNumber: 'A101', 
    floor: 1, 
    bedrooms: 2, 
    bathrooms: 2, 
    areaSqFt: 1200,
    currentRent: 2800, 
    rentFrequency: PaymentFrequency.MONTHLY,
    groundRent: 350, 
    groundRentFrequency: PaymentFrequency.ANNUALLY,
    maintenanceCharge: 280,
    maintenanceFrequency: PaymentFrequency.QUARTERLY,
    status: 'occupied',
    buildingBlock: 'A',
    createdAt: new Date('2023-01-15'), 
    updatedAt: new Date('2024-03-10'),
    isActive: true
  },
  { 
    id: 'flat-2', 
    buildingId: 'building-1', 
    flatNumber: 'A102', 
    floor: 1, 
    bedrooms: 1, 
    bathrooms: 1, 
    areaSqFt: 850,
    currentRent: 2200, 
    rentFrequency: 'Monthly',
    groundRent: 300, 
    groundRentFrequency: 'Annually',
    maintenanceCharge: 220,
    maintenanceFrequency: 'Quarterly',
    status: 'occupied',
    buildingBlock: 'A',
    createdAt: new Date('2023-01-15'), 
    updatedAt: new Date('2024-03-10'),
    isActive: true
  },
  { 
    id: 'flat-3', 
    buildingId: 'building-1', 
    flatNumber: 'A201', 
    floor: 2, 
    bedrooms: 2, 
    bathrooms: 2, 
    areaSqFt: 1350,
    currentRent: 3200, 
    rentFrequency: 'Monthly',
    groundRent: 380, 
    groundRentFrequency: 'Annually',
    maintenanceCharge: 320,
    maintenanceFrequency: 'Quarterly',
    status: 'occupied',
    buildingBlock: 'A',
    createdAt: new Date('2023-01-15'), 
    updatedAt: new Date('2024-03-10'),
    isActive: true
  },
  { 
    id: 'flat-4', 
    buildingId: 'building-1', 
    flatNumber: 'A301', 
    floor: 3, 
    bedrooms: 3, 
    bathrooms: 2, 
    areaSqFt: 1600,
    currentRent: 4200, 
    rentFrequency: 'Monthly',
    groundRent: 450, 
    groundRentFrequency: 'Annually',
    maintenanceCharge: 420,
    maintenanceFrequency: 'Quarterly',
    status: 'occupied',
    buildingBlock: 'A',
    createdAt: new Date('2023-01-15'), 
    updatedAt: new Date('2024-03-10'),
    isActive: true
  },
  
  // Victoria Heights
  { 
    id: 'flat-5', 
    buildingId: 'building-2', 
    flatNumber: 'B101', 
    floor: 1, 
    bedrooms: 2, 
    bathrooms: 2, 
    areaSqFt: 1300,
    currentRent: 3000, 
    rentFrequency: PaymentFrequency.MONTHLY,
    groundRent: 400, 
    groundRentFrequency: PaymentFrequency.ANNUALLY,
    maintenanceCharge: 300,
    maintenanceFrequency: PaymentFrequency.QUARTERLY,
    status: 'occupied',
    buildingBlock: 'B',
    createdAt: new Date('2023-02-20'), 
    updatedAt: new Date('2024-03-08'),
    isActive: true
  },
  { 
    id: 'flat-6', 
    buildingId: 'building-2', 
    flatNumber: 'B201', 
    floor: 2, 
    bedrooms: 1, 
    bathrooms: 1, 
    areaSqFt: 900,
    currentRent: 2500, 
    rentFrequency: PaymentFrequency.MONTHLY,
    groundRent: 350, 
    groundRentFrequency: PaymentFrequency.ANNUALLY,
    maintenanceCharge: 250,
    maintenanceFrequency: PaymentFrequency.QUARTERLY,
    status: 'occupied',
    buildingBlock: 'B',
    createdAt: new Date('2023-02-20'), 
    updatedAt: new Date('2024-03-08'),
    isActive: true
  },
  { 
    id: 'flat-7', 
    buildingId: 'building-2', 
    flatNumber: 'B301', 
    floor: 3, 
    bedrooms: 3, 
    bathrooms: 2, 
    areaSqFt: 1700,
    currentRent: 4500, 
    rentFrequency: PaymentFrequency.MONTHLY,
    groundRent: 500, 
    groundRentFrequency: PaymentFrequency.ANNUALLY,
    maintenanceCharge: 450,
    maintenanceFrequency: PaymentFrequency.QUARTERLY,
    status: 'occupied',
    buildingBlock: 'B',
    createdAt: new Date('2023-02-20'), 
    updatedAt: new Date('2024-03-08'),
    isActive: true
  },
  
  // Canary Wharf
  { id: 'flat-8', buildingId: 'building-3', flatNumber: 'C101', floor: 1, bedrooms: 2, bathrooms: 2, rent: 3800, serviceCharge: 380, groundRent: 450, leaseholdYears: 125, currentResidents: ['resident-15', 'resident-16'], createdAt: new Date('2023-03-10'), updatedAt: new Date('2024-03-12') },
  { id: 'flat-9', buildingId: 'building-3', flatNumber: 'C201', floor: 2, bedrooms: 1, bathrooms: 1, rent: 2800, serviceCharge: 280, groundRent: 380, leaseholdYears: 125, currentResidents: ['resident-17'], createdAt: new Date('2023-03-10'), updatedAt: new Date('2024-03-12') },
  { id: 'flat-10', buildingId: 'building-3', flatNumber: 'C501', floor: 5, bedrooms: 4, bathrooms: 3, rent: 7500, serviceCharge: 750, groundRent: 800, leaseholdYears: 125, currentResidents: ['resident-18', 'resident-19'], createdAt: new Date('2023-03-10'), updatedAt: new Date('2024-03-12') }
]

// Mock Residents - Compatible with Person interface
export const mockResidents = [
  // Riverside Gardens
  { 
    id: 'resident-1', 
    name: 'James Wilson', 
    buildingId: 'building-1', 
    flatId: 'flat-1', 
    flatNumber: 'A101',
    status: 'RESIDENT',
    email: 'james.wilson@email.com', 
    phone: '+44 7700 900001', 
    isPrimaryContact: true,
    emergencyContact: {
      name: 'Sarah Wilson',
      phone: '+44 7700 900002'
    },
    moveInDate: new Date('2023-06-01'), 
    moveOutDate: new Date('2025-05-31'), 
    notes: 'Tenant - 2 year lease',
    createdAt: new Date('2023-05-15'), 
    updatedAt: new Date('2024-03-01'),
    createdByUid: 'manager-1',
    isActive: true
  },
  { 
    id: 'resident-2', 
    name: 'Emma Wilson', 
    buildingId: 'building-1', 
    flatId: 'flat-1', 
    flatNumber: 'A101',
    status: 'RESIDENT',
    email: 'emma.wilson@email.com', 
    phone: '+44 7700 900002', 
    isPrimaryContact: false,
    emergencyContact: {
      name: 'James Wilson',
      phone: '+44 7700 900001'
    },
    moveInDate: new Date('2023-06-01'), 
    moveOutDate: new Date('2025-05-31'), 
    notes: 'Tenant - Joint lease with James',
    createdAt: new Date('2023-05-15'), 
    updatedAt: new Date('2024-03-01'),
    createdByUid: 'manager-1',
    isActive: true
  },
  { 
    id: 'resident-3', 
    name: 'Oliver Brown', 
    buildingId: 'building-1', 
    flatId: 'flat-2', 
    flatNumber: 'A102',
    status: 'OWNER',
    email: 'oliver.brown@email.com', 
    phone: '+44 7700 900003', 
    isPrimaryContact: true,
    emergencyContact: {
      name: 'Lisa Brown',
      phone: '+44 7700 900004'
    },
    moveInDate: new Date('2023-08-01'), 
    moveOutDate: null, 
    notes: 'Property owner - lives on site',
    createdAt: new Date('2023-07-10'), 
    updatedAt: new Date('2024-02-15'),
    createdByUid: 'manager-1',
    isActive: true
  },
  { 
    id: 'resident-4', 
    name: 'Sophie Davis', 
    buildingId: 'building-1', 
    flatId: 'flat-3', 
    flatNumber: 'A201',
    status: 'TENANT',
    email: 'sophie.davis@email.com', 
    phone: '+44 7700 900005', 
    isPrimaryContact: true,
    emergencyContact: {
      name: 'Michael Davis',
      phone: '+44 7700 900006'
    },
    moveInDate: new Date('2023-04-01'), 
    moveOutDate: new Date('2025-03-31'), 
    notes: 'Long-term tenant - 2 year lease',
    createdAt: new Date('2023-03-15'), 
    updatedAt: new Date('2024-01-20'),
    createdByUid: 'manager-1',
    isActive: true
  },
  
  // Victoria Heights
  { 
    id: 'resident-9', 
    name: 'Charlotte Taylor', 
    buildingId: 'building-2', 
    flatId: 'flat-5', 
    flatNumber: 'B101',
    status: 'OWNER',
    email: 'charlotte.taylor@email.com', 
    phone: '+44 7700 900009', 
    isPrimaryContact: true,
    emergencyContact: {
      name: 'Thomas Taylor',
      phone: '+44 7700 900010'
    },
    moveInDate: new Date('2023-09-01'), 
    moveOutDate: null, 
    notes: 'Property owner - joint ownership with Thomas',
    createdAt: new Date('2023-08-10'), 
    updatedAt: new Date('2024-02-28'),
    createdByUid: 'manager-2',
    isActive: true
  },
  { 
    id: 'resident-10', 
    name: 'Thomas Taylor', 
    buildingId: 'building-2', 
    flatId: 'flat-5', 
    flatNumber: 'B101',
    status: 'OWNER',
    email: 'thomas.taylor@email.com', 
    phone: '+44 7700 900010', 
    isPrimaryContact: false,
    emergencyContact: {
      name: 'Charlotte Taylor',
      phone: '+44 7700 900009'
    },
    moveInDate: new Date('2023-09-01'), 
    moveOutDate: null, 
    notes: 'Property owner - joint ownership with Charlotte',
    createdAt: new Date('2023-08-10'), 
    updatedAt: new Date('2024-02-28'),
    createdByUid: 'manager-2',
    isActive: true
  },
  { 
    id: 'resident-11', 
    name: 'Isabella Martinez', 
    buildingId: 'building-2', 
    flatId: 'flat-6', 
    flatNumber: 'B201',
    status: 'TENANT',
    email: 'isabella.martinez@email.com', 
    phone: '+44 7700 900011', 
    isPrimaryContact: true,
    emergencyContact: {
      name: 'Carlos Martinez',
      phone: '+44 7700 900012'
    },
    moveInDate: new Date('2023-07-01'), 
    moveOutDate: new Date('2024-06-30'), 
    notes: 'Short-term tenant - 1 year lease',
    createdAt: new Date('2023-06-15'), 
    updatedAt: new Date('2024-01-10'),
    createdByUid: 'manager-2',
    isActive: true
  },
  
  // Canary Wharf Towers
  { 
    id: 'resident-15', 
    name: 'Alexander Johnson', 
    buildingId: 'building-3', 
    flatId: 'flat-8', 
    flatNumber: 'C101',
    status: 'OWNER',
    email: 'alexander.johnson@email.com', 
    phone: '+44 7700 900015', 
    isPrimaryContact: true,
    emergencyContact: {
      name: 'Victoria Johnson',
      phone: '+44 7700 900016'
    },
    moveInDate: new Date('2023-10-01'), 
    moveOutDate: null, 
    notes: 'Property owner - luxury flat',
    createdAt: new Date('2023-09-15'), 
    updatedAt: new Date('2024-03-05'),
    createdByUid: 'manager-3',
    isActive: true
  },
  { 
    id: 'resident-16', 
    name: 'Victoria Johnson', 
    buildingId: 'building-3', 
    flatId: 'flat-8', 
    flatNumber: 'C101',
    status: 'OWNER',
    email: 'victoria.johnson@email.com', 
    phone: '+44 7700 900016', 
    isPrimaryContact: false,
    emergencyContact: {
      name: 'Alexander Johnson',
      phone: '+44 7700 900015'
    },
    moveInDate: new Date('2023-10-01'), 
    moveOutDate: null, 
    notes: 'Property owner - joint ownership with Alexander',
    createdAt: new Date('2023-09-15'), 
    updatedAt: new Date('2024-03-05'),
    createdByUid: 'manager-3',
    isActive: true
  }
]

// Mock Suppliers - Compatible with Supplier interface
export const mockSuppliers = [
  // Riverside Gardens Suppliers
  {
    id: 'supplier-1',
    name: 'Thames Plumbing Services',
    email: 'contact@thamesplumbing.co.uk',
    phone: '+44 20 7123 4567',
    role: 'supplier' as const,
    companyName: 'Thames Plumbing Services Ltd',
    specialties: ['Plumbing', 'Emergency Repairs', 'Boiler Service'],
    rating: 4.8,
    totalJobs: 45,
    buildingId: 'building-1',
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2024-03-10'),
    isActive: true
  },
  {
    id: 'supplier-2',
    name: 'London Electric Solutions',
    email: 'info@londonelectric.co.uk',
    phone: '+44 20 7234 5678',
    role: 'supplier' as const,
    companyName: 'London Electric Solutions Ltd',
    specialties: ['Electrical', 'Lighting', 'Emergency Callouts'],
    rating: 4.6,
    totalJobs: 32,
    buildingId: 'building-1',
    createdAt: new Date('2023-07-20'),
    updatedAt: new Date('2024-03-08'),
    isActive: true
  },
  
  // Victoria Heights Suppliers
  {
    id: 'supplier-3',
    name: 'Elite HVAC Systems',
    email: 'service@elitehvac.co.uk',
    phone: '+44 20 7345 6789',
    role: 'supplier' as const,
    companyName: 'Elite HVAC Systems Ltd',
    specialties: ['HVAC', 'Air Conditioning', 'Ventilation'],
    rating: 4.9,
    totalJobs: 67,
    buildingId: 'building-2',
    createdAt: new Date('2023-05-12'),
    updatedAt: new Date('2024-03-05'),
    isActive: true
  },
  
  // Canary Wharf Suppliers
  {
    id: 'supplier-4',
    name: 'Premium Elevator Services',
    email: 'maintenance@premiumelevator.co.uk',
    phone: '+44 20 7456 7890',
    role: 'supplier' as const,
    companyName: 'Premium Elevator Services Ltd',
    specialties: ['Elevator Maintenance', 'Emergency Repairs', '24/7 Service'],
    rating: 4.9,
    totalJobs: 89,
    buildingId: 'building-3',
    createdAt: new Date('2023-04-08'),
    updatedAt: new Date('2024-03-12'),
    isActive: true
  }
]

// Mock Assets - Compatible with Asset interface
export const mockAssets = [
  // Riverside Gardens Assets
  {
    id: 'asset-1-1',
    name: 'Main Boiler System',
    buildingId: 'building-1',
    category: AssetCategory.HVAC,
    type: 'Boiler System',
    status: AssetStatus.OPERATIONAL,
    locationDescription: 'Basement Boiler Room',
    flatId: null,
    manufacturer: 'Worcester Bosch',
    modelNumber: 'Greenstar 42CDi',
    serialNumber: 'WB-2018-001',
    installationDate: new Date('2018-03-15'),
    warrantyExpiryDate: new Date('2025-03-15'),
    lastMaintenanceDate: new Date('2024-01-15'),
    nextServiceDate: new Date('2024-07-15'),
    purchaseCost: 12000,
    currentValue: 9500,
    criticalityLevel: 'High' as const,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-03-10'),
    createdByUid: 'manager-1',
    isActive: true
  },
  {
    id: 'asset-1-2',
    name: 'Security Camera System',
    buildingId: 'building-1',
    category: AssetCategory.SECURITY,
    type: 'CCTV System',
    status: AssetStatus.OPERATIONAL,
    locationDescription: 'Building Perimeter',
    flatId: null,
    manufacturer: 'Hikvision',
    modelNumber: 'DS-2CD2385FWD-I',
    serialNumber: 'HK-2018-002',
    installationDate: new Date('2018-05-20'),
    warrantyExpiryDate: new Date('2023-05-20'),
    lastMaintenanceDate: new Date('2024-02-10'),
    nextServiceDate: new Date('2024-08-10'),
    purchaseCost: 8500,
    currentValue: 6000,
    criticalityLevel: 'Medium' as const,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-03-10'),
    createdByUid: 'manager-1',
    isActive: true
  },
  
  // Victoria Heights Assets
  {
    id: 'asset-2-1',
    name: 'Primary Elevator',
    buildingId: 'building-2',
    category: AssetCategory.ELEVATORS,
    type: 'Passenger Elevator',
    status: AssetStatus.NEEDS_MAINTENANCE,
    locationDescription: 'Main Lobby',
    flatId: null,
    manufacturer: 'Schindler',
    modelNumber: '3300 AP',
    serialNumber: 'SC-2020-001',
    installationDate: new Date('2020-05-12'),
    warrantyExpiryDate: new Date('2030-05-12'),
    lastMaintenanceDate: new Date('2024-01-20'),
    nextServiceDate: new Date('2024-04-20'),
    purchaseCost: 180000,
    currentValue: 160000,
    criticalityLevel: 'Critical' as const,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2024-03-08'),
    createdByUid: 'manager-2',
    isActive: true
  },
  
  // Canary Wharf Assets
  {
    id: 'asset-3-1',
    name: 'High-Speed Elevator A',
    buildingId: 'building-3',
    category: AssetCategory.ELEVATORS,
    type: 'High-Speed Elevator',
    status: AssetStatus.OPERATIONAL,
    locationDescription: 'Tower A Lobby',
    flatId: null,
    manufacturer: 'KONE',
    modelNumber: 'MonoSpace 700',
    serialNumber: 'KN-2019-001',
    installationDate: new Date('2019-04-08'),
    warrantyExpiryDate: new Date('2029-04-08'),
    lastMaintenanceDate: new Date('2024-01-08'),
    nextServiceDate: new Date('2024-04-08'),
    purchaseCost: 220000,
    currentValue: 200000,
    criticalityLevel: 'Critical' as const,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-03-12'),
    createdByUid: 'manager-3',
    isActive: true
  },
  {
    id: 'asset-3-2',
    name: 'Gym Equipment Suite',
    buildingId: 'building-3',
    category: AssetCategory.OTHER,
    type: 'Fitness Equipment',
    status: AssetStatus.OPERATIONAL,
    locationDescription: 'Building Gym',
    flatId: null,
    manufacturer: 'Life Fitness',
    modelNumber: 'Treadmill T5',
    serialNumber: 'LF-2019-002',
    installationDate: new Date('2019-08-15'),
    warrantyExpiryDate: new Date('2024-08-15'),
    lastMaintenanceDate: new Date('2024-03-06'),
    nextServiceDate: new Date('2024-09-06'),
    purchaseCost: 25000,
    currentValue: 18000,
    criticalityLevel: 'Low' as const,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-03-12'),
    createdByUid: 'manager-3',
    isActive: true
  }
]

// Mock Tickets with Complete Workflow
export const mockTickets: Ticket[] = [
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
    comments: [
      {
        id: 'comment-1-1',
        ticketId: 'ticket-1',
        authorId: 'resident-1',
        authorName: 'James Wilson',
        authorRole: 'resident',
        content: 'The heating has been completely off since yesterday morning. It\'s getting quite cold in the flat.',
        createdAt: new Date('2024-03-10T09:30:00Z')
      },
      {
        id: 'comment-1-2',
        ticketId: 'ticket-1',
        authorId: 'manager-1',
        authorName: 'Building Manager',
        authorRole: 'manager',
        content: 'I\'ve contacted our HVAC contractor and they will be on-site tomorrow morning at 10 AM to assess the issue.',
        createdAt: new Date('2024-03-10T15:30:00Z')
      }
    ],
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
    comments: [
      {
        id: 'comment-3-1',
        ticketId: 'ticket-3',
        authorId: 'resident-9',
        authorName: 'Lisa Thompson',
        authorRole: 'resident',
        content: 'The elevator has been making grinding noises for the past week. It\'s quite concerning.',
        createdAt: new Date('2024-03-07T11:30:00Z')
      },
      {
        id: 'comment-3-2',
        ticketId: 'ticket-3',
        authorId: 'manager-2',
        authorName: 'Victoria Manager',
        authorRole: 'manager',
        content: 'I\'ve scheduled our elevator maintenance contractor for tomorrow morning. They\'ll inspect and repair as needed.',
        createdAt: new Date('2024-03-08T09:00:00Z')
      }
    ],
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
    comments: [
      {
        id: 'comment-4-1',
        ticketId: 'ticket-4',
        authorId: 'resident-15',
        authorName: 'Robert Chen',
        authorRole: 'resident',
        content: 'Treadmill #2 stops working after 5 minutes of use. The belt seems to be slipping.',
        createdAt: new Date('2024-03-05T16:30:00Z')
      },
      {
        id: 'comment-4-2',
        ticketId: 'ticket-4',
        authorId: 'contractor-2',
        authorName: 'Fitness Equipment Services',
        authorRole: 'manager',
        content: 'Completed maintenance on treadmill #2. Replaced belt and calibrated motor. Equipment is now fully operational.',
        createdAt: new Date('2024-03-06T14:00:00Z')
      }
    ],
    completedDate: new Date('2024-03-06T14:00:00Z'),
    createdAt: new Date('2024-03-05T16:00:00Z'),
    updatedAt: new Date('2024-03-06T14:00:00Z')
  },
  {
    id: 'ticket-5',
    buildingId: 'building-1',
    title: 'Broken Window in Lobby',
    description: 'Large window in main lobby has a crack and needs replacement.',
    location: 'Main Lobby',
    urgency: 'medium' as UrgencyLevel,
    status: 'New Ticket' as TicketStatus,
    requestedBy: 'resident-2',
    attachments: [],
    activityLog: [{
      id: 'activity-7',
      action: 'Ticket Created',
      description: 'Window damage reported by resident',
      performedBy: 'resident-2',
      timestamp: new Date('2024-03-11T16:00:00Z'),
      metadata: {}
    }],
    quotes: [],
    comments: [
      {
        id: 'comment-5-1',
        ticketId: 'ticket-5',
        authorId: 'resident-2',
        authorName: 'David Kim',
        authorRole: 'resident',
        content: 'The window in the lobby is cracked and needs to be replaced.',
        createdAt: new Date('2024-03-11T16:00:00Z')
      }
    ],
    createdAt: new Date('2024-03-11T16:00:00Z'),
    updatedAt: new Date('2024-03-11T16:00:00Z')
  },
  {
    id: 'ticket-6',
    buildingId: 'building-2',
    title: 'Garden Maintenance Required',
    description: 'Garden area needs pruning and general maintenance.',
    location: 'Building Garden',
    urgency: 'low' as UrgencyLevel,
    status: 'New Ticket' as TicketStatus,
    requestedBy: 'resident-10',
    attachments: [],
    activityLog: [{
      id: 'activity-8',
      action: 'Ticket Created',
      description: 'Garden maintenance requested',
      performedBy: 'resident-10',
      timestamp: new Date('2024-03-11T14:00:00Z'),
      metadata: {}
    }],
    quotes: [],
    comments: [
      {
        id: 'comment-6-1',
        ticketId: 'ticket-6',
        authorId: 'resident-10',
        authorName: 'Emma Davis',
        authorRole: 'resident',
        content: 'The garden area needs pruning and general maintenance.',
        createdAt: new Date('2024-03-11T14:00:00Z')
      }
    ],
    createdAt: new Date('2024-03-11T14:00:00Z'),
    updatedAt: new Date('2024-03-11T14:00:00Z')
  }
]

// Mock Work Orders
export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    buildingId: 'building-2',
    title: 'Elevator Maintenance and Repair',
    description: 'Complete maintenance check and repair of main elevator grinding noise issue',
    priority: 'high' as WorkOrderPriority,
    status: WorkOrderStatus.TRIAGE,
    flatId: undefined,
    scheduledDate: new Date('2024-03-11T08:00:00Z'),
    assignedToUid: 'contractor-1',
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
    userFeedback: undefined
  },
  {
    id: 'wo-2',
    buildingId: 'building-1',
    title: 'Plumbing Repair - Kitchen Tap',
    description: 'Replace leaking kitchen tap in flat A201',
    priority: 'medium' as WorkOrderPriority,
    status: WorkOrderStatus.SCHEDULED,
    flatId: 'flat-3',
    scheduledDate: new Date('2024-03-13T09:00:00Z'),
    assignedToUid: 'contractor-3',
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
    userFeedback: undefined
  },
  {
    id: 'wo-3',
    buildingId: 'building-3',
    title: 'Gym Equipment Service Complete',
    description: 'Completed servicing and repair of treadmill #2',
    priority: 'low' as WorkOrderPriority,
    status: WorkOrderStatus.RESOLVED,
    flatId: undefined,
    scheduledDate: new Date('2024-03-06T10:00:00Z'),
    assignedToUid: 'contractor-2',
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

// Mock Budget Data
export const mockBudgets = [
  {
    id: 'budget-1',
    buildingId: 'building-1',
    year: 2024,
    financialYearStart: new Date('2024-04-01'),
    financialYearEnd: new Date('2025-03-31'),
    status: 'draft',
    isLocked: false,
    totalBudget: 85000,
    categories: [
      {
        id: 'cat-1',
        name: 'Service Charges',
        type: 'income',
        budgetAmount: 67200,
        actualAmount: 45600,
        description: 'Quarterly service charges from residents'
      },
      {
        id: 'cat-2', 
        name: 'Ground Rent',
        type: 'income',
        budgetAmount: 8400,
        actualAmount: 8400,
        description: 'Annual ground rent collection'
      },
      {
        id: 'cat-3',
        name: 'Planned Maintenance',
        type: 'expenditure',
        budgetAmount: 25000,
        actualAmount: 18500,
        description: 'Scheduled maintenance and repairs'
      },
      {
        id: 'cat-4',
        name: 'Insurance',
        type: 'expenditure',
        budgetAmount: 12000,
        actualAmount: 11800,
        description: 'Building insurance premiums'
      }
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
    createdBy: 'manager-1'
  },
  {
    id: 'budget-2',
    buildingId: 'building-2',
    year: 2024,
    financialYearStart: new Date('2024-04-01'),
    financialYearEnd: new Date('2025-03-31'),
    status: 'draft',
    isLocked: false,
    totalBudget: 72000,
    categories: [
      {
        id: 'cat-6',
        name: 'Service Charges',
        type: 'income',
        budgetAmount: 54000,
        actualAmount: 36000,
        description: 'Quarterly service charges'
      },
      {
        id: 'cat-7',
        name: 'Ground Rent', 
        type: 'income',
        budgetAmount: 7200,
        actualAmount: 7200,
        description: 'Annual ground rent'
      }
    ],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-08'),
    createdBy: 'manager-2'
  },
  {
    id: 'budget-3',
    buildingId: 'building-3',
    year: 2024,
    financialYearStart: new Date('2024-04-01'),
    financialYearEnd: new Date('2025-03-31'),
    status: 'draft',
    isLocked: false,
    totalBudget: 125000,
    categories: [
      {
        id: 'cat-10',
        name: 'Service Charges',
        type: 'income',
        budgetAmount: 91800,
        actualAmount: 68850,
        description: 'Quarterly service charges'
      },
      {
        id: 'cat-11',
        name: 'Ground Rent',
        type: 'income',
        budgetAmount: 15300,
        actualAmount: 15300,
        description: 'Annual ground rent'
      }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-12'),
    createdBy: 'manager-3'
  }
]

// Helper functions
export const getDataByBuilding = <T extends { buildingId: string }>(data: T[], buildingId: string): T[] => {
  return data.filter(item => item.buildingId === buildingId)
}

// Mock Invoices Data
export const mockInvoices = [
  {
    id: 'invoice-1',
    buildingId: 'building-1',
    invoiceNumber: 'INV-2024-001',
    supplier: 'Thames Water',
    amount: 1250,
    dueDate: new Date('2024-03-25'),
    status: 'pending',
    category: 'utilities',
    description: 'Water supply - Q1 2024',
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'invoice-2',
    buildingId: 'building-1',
    invoiceNumber: 'INV-2024-002',
    supplier: 'British Gas',
    amount: 2100,
    dueDate: new Date('2024-03-30'),
    status: 'paid',
    category: 'utilities',
    description: 'Gas supply - Q1 2024',
    createdAt: new Date('2024-03-05')
  },
  {
    id: 'invoice-3',
    buildingId: 'building-2',
    invoiceNumber: 'INV-2024-003',
    supplier: 'Severn Trent Water',
    amount: 1800,
    dueDate: new Date('2024-03-28'),
    status: 'pending',
    category: 'utilities',
    description: 'Water supply - Q1 2024',
    createdAt: new Date('2024-03-02')
  },
  {
    id: 'invoice-4',
    buildingId: 'building-3',
    invoiceNumber: 'INV-2024-004',
    supplier: 'EDF Energy',
    amount: 3200,
    dueDate: new Date('2024-04-05'),
    status: 'overdue',
    category: 'utilities',
    description: 'Electricity supply - Q1 2024',
    createdAt: new Date('2024-03-01')
  }
];

// Mock Service Charges Data
export const mockServiceCharges = [
  {
    id: 'sc-1',
    buildingId: 'building-1',
    period: 'Q1 2024',
    totalAmount: 9500,
    collectedAmount: 7200,
    outstandingAmount: 2300,
    dueDate: new Date('2024-03-31'),
    status: 'active',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'sc-2',
    buildingId: 'building-2',
    period: 'Q1 2024',
    totalAmount: 13500,
    collectedAmount: 11200,
    outstandingAmount: 2300,
    dueDate: new Date('2024-03-31'),
    status: 'active',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'sc-3',
    buildingId: 'building-3',
    period: 'Q1 2024',
    totalAmount: 18750,
    collectedAmount: 16200,
    outstandingAmount: 2550,
    dueDate: new Date('2024-03-31'),
    status: 'active',
    createdAt: new Date('2024-01-01')
  }
];

// Mock Events Data - Multi-building support
export const mockEvents = [
  // Riverside Gardens Events
  {
    id: 'event-1',
    title: 'HVAC System Maintenance',
    description: 'Quarterly HVAC system maintenance and filter replacement for all floors',
    location: 'Riverside Gardens - All Floors',
    buildingId: 'building-1',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Tomorrow + 4 hours
    ticketId: 'ticket-1',
    assignedTo: ['supplier-1'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'event-2',
    title: 'Fire Safety Inspection',
    description: 'Annual fire safety inspection and alarm system testing',
    location: 'Riverside Gardens - Fire Safety Equipment',
    buildingId: 'building-1',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 days + 3 hours
    ticketId: 'ticket-2',
    assignedTo: ['supplier-2'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  },
  {
    id: 'event-3',
    title: 'Lift Maintenance',
    description: 'Monthly lift maintenance and safety check',
    location: 'Riverside Gardens - Lift Shaft',
    buildingId: 'building-1',
    startDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    ticketId: 'ticket-3',
    assignedTo: ['supplier-1'],
    status: 'in-progress' as const,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  
  // Victoria Heights Events
  {
    id: 'event-4',
    title: 'Electrical System Inspection',
    description: 'Comprehensive electrical system inspection and PAT testing',
    location: 'Victoria Heights - Electrical Room',
    buildingId: 'building-2',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 2 days + 5 hours
    ticketId: 'ticket-4',
    assignedTo: ['supplier-3'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: 'event-5',
    title: 'Plumbing Emergency Repair',
    description: 'Emergency repair of burst pipe in basement',
    location: 'Victoria Heights - Basement',
    buildingId: 'building-2',
    startDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    endDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    ticketId: 'ticket-5',
    assignedTo: ['supplier-4'],
    status: 'completed' as const,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'event-6',
    title: 'Window Cleaning Service',
    description: 'Professional window cleaning for all external windows',
    location: 'Victoria Heights - External Windows',
    buildingId: 'building-2',
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 5 days + 6 hours
    assignedTo: ['supplier-5'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  
  // Canary Wharf Towers Events
  {
    id: 'event-7',
    title: 'Security System Upgrade',
    description: 'Installation of new CCTV cameras and access control system',
    location: 'Canary Wharf Towers - Main Entrance & Corridors',
    buildingId: 'building-3',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 7 days + 8 hours
    ticketId: 'ticket-6',
    assignedTo: ['supplier-6'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09')
  },
  {
    id: 'event-8',
    title: 'Roof Maintenance',
    description: 'Roof inspection and gutter cleaning',
    location: 'Canary Wharf Towers - Roof Area',
    buildingId: 'building-3',
    startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 4 days + 3 hours
    assignedTo: ['supplier-1'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11')
  },
  {
    id: 'event-9',
    title: 'Boiler Service',
    description: 'Annual boiler service and efficiency check',
    location: 'Canary Wharf Towers - Boiler Room',
    buildingId: 'building-3',
    startDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    endDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    ticketId: 'ticket-7',
    assignedTo: ['supplier-2'],
    status: 'completed' as const,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: 'event-10',
    title: 'Pest Control Treatment',
    description: 'Quarterly pest control treatment for common areas',
    location: 'Canary Wharf Towers - Common Areas',
    buildingId: 'building-3',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
    assignedTo: ['supplier-3'],
    status: 'scheduled' as const,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13')
  }
];

export const getAllMockData = () => ({
  buildings: mockBuildings,
  flats: mockFlats,
  residents: mockResidents,
  suppliers: mockSuppliers,
  assets: mockAssets,
  tickets: mockTickets,
  workOrders: mockWorkOrders,
  budgets: mockBudgets,
  invoices: mockInvoices,
  serviceCharges: mockServiceCharges,
  events: mockEvents
})
