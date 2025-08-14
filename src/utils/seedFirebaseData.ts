/**
 * Firebase Data Seeding Script
 * Creates comprehensive mock data for testing all Building Management System functionality
 */

import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  Building, 
  Flat, 
  Person, 
  Supplier, 
  Asset, 
  Ticket, 
  WorkOrder, 
  Event,
  ServiceChargeDemand,
  Budget,
  Invoice,
  PersonStatus,
  TicketStatus,
  WorkOrderStatus,
  AssetStatus,
  AssetCategory,
  WorkOrderPriority,
  UrgencyLevel,
  ServiceChargeDemandStatus,
  PaymentFrequency
} from '../types'

// Helper function to create Firestore timestamp
const createTimestamp = (daysAgo: number = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return Timestamp.fromDate(date)
}

// Mock Buildings Data
const mockBuildings: Omit<Building, 'id'>[] = [
  {
    name: "Riverside Gardens",
    address: "123 Thames View, London SW1A 1AA",
    postcode: "SW1A 1AA",
    totalFlats: 24,
    yearBuilt: 2018,
    propertyType: "Residential",
    managementCompany: "Thames Property Management Ltd",
    contactEmail: "manager@riversidegardens.co.uk",
    contactPhone: "+44 20 7123 4567",
    createdAt: createTimestamp(365),
    updatedAt: createTimestamp(1)
  },
  {
    name: "Victoria Heights",
    address: "456 Victoria Street, London SW1E 6QP",
    postcode: "SW1E 6QP", 
    totalFlats: 18,
    yearBuilt: 2020,
    propertyType: "Residential",
    managementCompany: "Central London Properties",
    contactEmail: "admin@victoriaheights.co.uk",
    contactPhone: "+44 20 7234 5678",
    createdAt: createTimestamp(300),
    updatedAt: createTimestamp(2)
  },
  {
    name: "Canary Wharf Towers",
    address: "789 Canary Wharf, London E14 5AB",
    postcode: "E14 5AB",
    totalFlats: 36,
    yearBuilt: 2019,
    propertyType: "Residential",
    managementCompany: "Docklands Management Co",
    contactEmail: "info@canarywharf-towers.co.uk",
    contactPhone: "+44 20 7345 6789",
    createdAt: createTimestamp(200),
    updatedAt: createTimestamp(3)
  }
]

// Mock Flats Data
const createMockFlats = (buildingId: string, buildingName: string): Omit<Flat, 'id'>[] => {
  const flats: Omit<Flat, 'id'>[] = []
  const flatCounts = buildingName === "Riverside Gardens" ? 24 : buildingName === "Victoria Heights" ? 18 : 36
  
  for (let i = 1; i <= flatCounts; i++) {
    const flatNumber = `${Math.floor((i-1)/6) + 1}${String.fromCharCode(65 + ((i-1) % 6))}`
    const area = 650 + Math.floor(Math.random() * 400) // 650-1050 sq ft
    
    flats.push({
      buildingId,
      flatNumber,
      floor: Math.floor((i-1)/6) + 1,
      bedrooms: Math.floor(Math.random() * 3) + 1, // 1-3 bedrooms
      bathrooms: Math.floor(Math.random() * 2) + 1, // 1-2 bathrooms
      area,
      groundRent: 250 + Math.floor(Math.random() * 100), // £250-350
      serviceChargeRate: 2.50 + (Math.random() * 1), // £2.50-3.50 per sq ft
      leaseStartDate: createTimestamp(Math.floor(Math.random() * 1000)),
      leaseEndDate: createTimestamp(-Math.floor(Math.random() * 3650)), // Future dates
      isOccupied: Math.random() > 0.15, // 85% occupancy
      createdAt: createTimestamp(Math.floor(Math.random() * 100)),
      updatedAt: createTimestamp(Math.floor(Math.random() * 10))
    })
  }
  
  return flats
}

// Mock People Data
const createMockPeople = (buildingId: string, flats: { id: string, flatNumber: string }[]): Omit<Person, 'id'>[] => {
  const firstNames = ["James", "Sarah", "Michael", "Emma", "David", "Sophie", "Robert", "Charlotte", "William", "Olivia", "Thomas", "Amelia", "Daniel", "Isabella", "Matthew", "Ava"]
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"]
  
  const people: Omit<Person, 'id'>[] = []
  
  // Create residents for occupied flats
  const occupiedFlats = flats.filter(() => Math.random() > 0.15) // 85% occupancy
  
  occupiedFlats.forEach((flat, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    
    people.push({
      buildingId,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `+44 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 900000) + 100000}`,
      flatId: flat.id,
      flatNumber: flat.flatNumber,
      role: index === 0 ? "Building Manager" : "Resident",
      status: PersonStatus.ACTIVE,
      isPrimaryContact: Math.random() > 0.7,
      emergencyContact: {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        phone: `+44 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 900000) + 100000}`,
        relationship: ["Spouse", "Parent", "Sibling", "Friend"][Math.floor(Math.random() * 4)]
      },
      createdAt: createTimestamp(Math.floor(Math.random() * 200)),
      updatedAt: createTimestamp(Math.floor(Math.random() * 30))
    })
  })
  
  return people
}

// Mock Suppliers Data
const createMockSuppliers = (buildingId: string): Omit<Supplier, 'id'>[] => {
  return [
    {
      buildingId,
      name: "Thames Maintenance Services",
      contactPerson: "John Smith",
      email: "john@thamesmaintenance.co.uk",
      phone: "+44 20 7111 2222",
      address: "45 Maintenance Road, London SW1A 2BB",
      services: ["Plumbing", "Electrical", "General Maintenance"],
      rating: 4.8,
      isPreferred: true,
      notes: "Reliable 24/7 emergency service provider",
      createdAt: createTimestamp(180),
      updatedAt: createTimestamp(5)
    },
    {
      buildingId,
      name: "London Cleaning Solutions",
      contactPerson: "Sarah Johnson",
      email: "sarah@londonclean.co.uk", 
      phone: "+44 20 7222 3333",
      address: "78 Clean Street, London W1B 3CC",
      services: ["Cleaning", "Window Cleaning", "Carpet Cleaning"],
      rating: 4.5,
      isPreferred: true,
      notes: "Weekly common area cleaning service",
      createdAt: createTimestamp(150),
      updatedAt: createTimestamp(10)
    },
    {
      buildingId,
      name: "Capital Security Systems",
      contactPerson: "Mike Wilson",
      email: "mike@capitalsecurity.co.uk",
      phone: "+44 20 7333 4444",
      address: "12 Security Lane, London EC1A 4DD",
      services: ["Security Systems", "CCTV", "Access Control"],
      rating: 4.9,
      isPreferred: false,
      notes: "Specialist in building security upgrades",
      createdAt: createTimestamp(120),
      updatedAt: createTimestamp(15)
    }
  ]
}

// Mock Assets Data
const createMockAssets = (buildingId: string): Omit<Asset, 'id'>[] => {
  return [
    {
      buildingId,
      name: "Main Elevator",
      category: AssetCategory.HVAC_MECHANICAL,
      description: "Otis passenger elevator serving floors 1-6",
      location: "Main Lobby",
      purchaseDate: createTimestamp(1200),
      purchasePrice: 45000,
      currentValue: 35000,
      warrantyExpiry: createTimestamp(-180),
      status: AssetStatus.OPERATIONAL,
      maintenanceSchedule: "Monthly inspection, annual service",
      lastMaintenanceDate: createTimestamp(30),
      nextMaintenanceDate: createTimestamp(-30),
      createdAt: createTimestamp(100),
      updatedAt: createTimestamp(30)
    },
    {
      buildingId,
      name: "CCTV System",
      category: AssetCategory.SECURITY,
      description: "16-camera digital surveillance system",
      location: "Various locations",
      purchaseDate: createTimestamp(800),
      purchasePrice: 12000,
      currentValue: 8000,
      warrantyExpiry: createTimestamp(-100),
      status: AssetStatus.OPERATIONAL,
      maintenanceSchedule: "Quarterly system check",
      lastMaintenanceDate: createTimestamp(90),
      nextMaintenanceDate: createTimestamp(-90),
      createdAt: createTimestamp(90),
      updatedAt: createTimestamp(20)
    },
    {
      buildingId,
      name: "Boiler System",
      category: AssetCategory.HVAC_MECHANICAL,
      description: "Gas boiler for central heating and hot water",
      location: "Basement Plant Room",
      purchaseDate: createTimestamp(1500),
      purchasePrice: 25000,
      currentValue: 15000,
      warrantyExpiry: createTimestamp(200),
      status: AssetStatus.NEEDS_MAINTENANCE,
      maintenanceSchedule: "Annual service and safety check",
      lastMaintenanceDate: createTimestamp(365),
      nextMaintenanceDate: createTimestamp(-30),
      createdAt: createTimestamp(80),
      updatedAt: createTimestamp(5)
    }
  ]
}

// Mock Tickets Data
const createMockTickets = (buildingId: string, people: { id: string, firstName: string, lastName: string }[]): Omit<Ticket, 'id'>[] => {
  const issues = [
    "Heating not working in flat",
    "Water leak in bathroom ceiling", 
    "Lift making unusual noises",
    "Common area lighting failure",
    "Intercom system not responding",
    "Parking gate malfunction",
    "Noise complaint from upstairs neighbor",
    "Window lock broken",
    "Radiator not heating properly",
    "Fire alarm beeping intermittently"
  ]
  
  const tickets: Omit<Ticket, 'id'>[] = []
  
  for (let i = 0; i < 8; i++) {
    const reporter = people[Math.floor(Math.random() * people.length)]
    const issue = issues[Math.floor(Math.random() * issues.length)]
    const daysAgo = Math.floor(Math.random() * 60)
    
    tickets.push({
      buildingId,
      title: issue,
      description: `Detailed description of ${issue.toLowerCase()}. This issue was reported by the resident and requires attention from maintenance team.`,
      status: [TicketStatus.NEW, TicketStatus.MANAGER_REVIEW, TicketStatus.QUOTE_MANAGEMENT, TicketStatus.WORK_ORDER, TicketStatus.COMPLETE][Math.floor(Math.random() * 5)],
      urgency: [UrgencyLevel.LOW, UrgencyLevel.MEDIUM, UrgencyLevel.HIGH, UrgencyLevel.URGENT][Math.floor(Math.random() * 4)],
      reportedByUid: reporter.id,
      reportedByUserEmail: `${reporter.firstName.toLowerCase()}.${reporter.lastName.toLowerCase()}@email.com`,
      assignedToUid: people[0].id, // Assign to first person (manager)
      assignedToUserEmail: `${people[0].firstName.toLowerCase()}.${people[0].lastName.toLowerCase()}@email.com`,
      createdAt: createTimestamp(daysAgo),
      updatedAt: createTimestamp(Math.floor(daysAgo / 2)),
      resolutionNotes: [],
      attachments: [],
      comments: [
        {
          id: `comment-${i}-1`,
          userId: reporter.id,
          userEmail: `${reporter.firstName.toLowerCase()}.${reporter.lastName.toLowerCase()}@email.com`,
          content: "This issue is affecting daily life, please prioritize.",
          timestamp: createTimestamp(daysAgo - 1),
          isInternal: false
        }
      ]
    })
  }
  
  return tickets
}

// Mock Work Orders Data
const createMockWorkOrders = (buildingId: string, suppliers: { id: string, name: string }[]): Omit<WorkOrder, 'id'>[] => {
  const workTitles = [
    "Annual HVAC System Maintenance",
    "Elevator Safety Inspection", 
    "Fire Safety Equipment Check",
    "Common Area Deep Cleaning",
    "Security System Upgrade",
    "Roof Inspection and Repairs"
  ]
  
  const workOrders: Omit<WorkOrder, 'id'>[] = []
  
  for (let i = 0; i < 6; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const title = workTitles[i]
    const daysAgo = Math.floor(Math.random() * 90)
    
    workOrders.push({
      buildingId,
      title,
      description: `Comprehensive ${title.toLowerCase()} as part of regular building maintenance schedule.`,
      status: [WorkOrderStatus.TRIAGE, WorkOrderStatus.SCHEDULED, WorkOrderStatus.RESOLVED][Math.floor(Math.random() * 3)],
      priority: [WorkOrderPriority.LOW, WorkOrderPriority.MEDIUM, WorkOrderPriority.HIGH][Math.floor(Math.random() * 3)],
      createdByUid: "manager-id",
      createdByUserEmail: "manager@building.com",
      assignedToUid: supplier.id,
      assignedToUserEmail: `contact@${supplier.name.toLowerCase().replace(/\s+/g, '')}.co.uk`,
      scheduledDate: createTimestamp(-Math.floor(Math.random() * 30)),
      completedDate: Math.random() > 0.5 ? createTimestamp(-Math.floor(Math.random() * 10)) : undefined,
      createdAt: createTimestamp(daysAgo),
      updatedAt: createTimestamp(Math.floor(daysAgo / 2)),
      resolutionNotes: [],
      quoteRequests: [],
      managerCommunication: []
    })
  }
  
  return workOrders
}

// Mock Events Data
const createMockEvents = (buildingId: string): Omit<Event, 'id'>[] => {
  return [
    {
      buildingId,
      title: "Annual General Meeting",
      description: "Yearly meeting to discuss building matters, budget, and upcoming projects",
      startDate: createTimestamp(-30),
      endDate: createTimestamp(-30),
      location: "Community Room",
      type: "Meeting",
      isRecurring: true,
      recurringPattern: "yearly",
      attendees: [],
      createdAt: createTimestamp(60),
      updatedAt: createTimestamp(35)
    },
    {
      buildingId,
      title: "Fire Safety Drill",
      description: "Mandatory fire safety drill for all residents",
      startDate: createTimestamp(-7),
      endDate: createTimestamp(-7),
      location: "Building Wide",
      type: "Safety",
      isRecurring: true,
      recurringPattern: "quarterly",
      attendees: [],
      createdAt: createTimestamp(30),
      updatedAt: createTimestamp(10)
    },
    {
      buildingId,
      title: "Elevator Maintenance",
      description: "Scheduled elevator maintenance - service will be unavailable",
      startDate: createTimestamp(-14),
      endDate: createTimestamp(-14),
      location: "Main Elevator",
      type: "Maintenance",
      isRecurring: false,
      attendees: [],
      createdAt: createTimestamp(20),
      updatedAt: createTimestamp(15)
    }
  ]
}

// Main seeding function
export const seedFirebaseData = async () => {
  console.log('🌱 Starting Firebase data seeding...')
  
  try {
    const batch = writeBatch(db)
    
    // Create buildings and get their IDs
    console.log('📍 Creating buildings...')
    const buildingIds: string[] = []
    
    for (const building of mockBuildings) {
      const buildingRef = doc(collection(db, 'buildings'))
      batch.set(buildingRef, building)
      buildingIds.push(buildingRef.id)
      console.log(`   ✅ Building: ${building.name}`)
    }
    
    // Commit buildings first
    await batch.commit()
    console.log('✅ Buildings created successfully')
    
    // Create data for each building
    for (let i = 0; i < buildingIds.length; i++) {
      const buildingId = buildingIds[i]
      const buildingName = mockBuildings[i].name
      
      console.log(`\n🏢 Creating data for ${buildingName}...`)
      
      // Create flats
      console.log('🏠 Creating flats...')
      const flats = createMockFlats(buildingId, buildingName)
      const flatIds: { id: string, flatNumber: string }[] = []
      
      for (const flat of flats) {
        const flatRef = await addDoc(collection(db, 'flats'), flat)
        flatIds.push({ id: flatRef.id, flatNumber: flat.flatNumber })
      }
      console.log(`   ✅ Created ${flats.length} flats`)
      
      // Create people
      console.log('👥 Creating people...')
      const people = createMockPeople(buildingId, flatIds)
      const peopleIds: { id: string, firstName: string, lastName: string }[] = []
      
      for (const person of people) {
        const personRef = await addDoc(collection(db, 'people'), person)
        peopleIds.push({ 
          id: personRef.id, 
          firstName: person.firstName, 
          lastName: person.lastName 
        })
      }
      console.log(`   ✅ Created ${people.length} people`)
      
      // Create suppliers
      console.log('🔧 Creating suppliers...')
      const suppliers = createMockSuppliers(buildingId)
      const supplierIds: { id: string, name: string }[] = []
      
      for (const supplier of suppliers) {
        const supplierRef = await addDoc(collection(db, 'suppliers'), supplier)
        supplierIds.push({ id: supplierRef.id, name: supplier.name })
      }
      console.log(`   ✅ Created ${suppliers.length} suppliers`)
      
      // Create assets
      console.log('🏗️ Creating assets...')
      const assets = createMockAssets(buildingId)
      
      for (const asset of assets) {
        await addDoc(collection(db, 'assets'), asset)
      }
      console.log(`   ✅ Created ${assets.length} assets`)
      
      // Create tickets
      console.log('🎫 Creating tickets...')
      const tickets = createMockTickets(buildingId, peopleIds)
      
      for (const ticket of tickets) {
        await addDoc(collection(db, 'tickets'), ticket)
      }
      console.log(`   ✅ Created ${tickets.length} tickets`)
      
      // Create work orders
      console.log('🔨 Creating work orders...')
      const workOrders = createMockWorkOrders(buildingId, supplierIds)
      
      for (const workOrder of workOrders) {
        await addDoc(collection(db, 'workOrders'), workOrder)
      }
      console.log(`   ✅ Created ${workOrders.length} work orders`)
      
      // Create events
      console.log('📅 Creating events...')
      const events = createMockEvents(buildingId)
      
      for (const event of events) {
        await addDoc(collection(db, 'events'), event)
      }
      console.log(`   ✅ Created ${events.length} events`)
    }
    
    console.log('\n🎉 Firebase data seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   • ${mockBuildings.length} buildings`)
    console.log(`   • ${mockBuildings.reduce((sum, b) => sum + (b.name === "Riverside Gardens" ? 24 : b.name === "Victoria Heights" ? 18 : 36), 0)} flats`)
    console.log(`   • ~${mockBuildings.length * 20} people`)
    console.log(`   • ${mockBuildings.length * 3} suppliers`)
    console.log(`   • ${mockBuildings.length * 3} assets`)
    console.log(`   • ${mockBuildings.length * 8} tickets`)
    console.log(`   • ${mockBuildings.length * 6} work orders`)
    console.log(`   • ${mockBuildings.length * 3} events`)
    
    return true
    
  } catch (error) {
    console.error('❌ Error seeding Firebase data:', error)
    throw error
  }
}

// Export for use in components
export default seedFirebaseData
