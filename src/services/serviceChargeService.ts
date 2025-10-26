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
  writeBatch,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  ServiceChargeDemand, 
  ServiceChargeDemandStatus,
  Income,
  Expenditure,
  Flat,
  ResidentAccountLedger
} from '../types'
import { handleServiceError } from '../utils/errorHandling'
import { fromFirestoreTimestamp, toFirestoreTimestamp } from '../utils/firestore'

// Service Charge Demands
export const getServiceChargeDemands = async (buildingId: string): Promise<ServiceChargeDemand[]> => {
  try {
    const q = query(
      collection(db, 'serviceChargeDemands'),
      where('buildingId', '==', buildingId),
      orderBy('issuedDate', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const demands = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: fromFirestoreTimestamp(doc.data().dueDate),
      issuedDate: fromFirestoreTimestamp(doc.data().issuedDate),
      createdAt: fromFirestoreTimestamp(doc.data().createdAt),
      updatedAt: fromFirestoreTimestamp(doc.data().updatedAt),
      penaltyAppliedAt: doc.data().penaltyAppliedAt ? fromFirestoreTimestamp(doc.data().penaltyAppliedAt) : null,
      paymentHistory: (doc.data().paymentHistory || []).map((payment: any) => ({
        ...payment,
        paymentDate: fromFirestoreTimestamp(payment.paymentDate),
        recordedAt: fromFirestoreTimestamp(payment.recordedAt)
      }))
    })) as ServiceChargeDemand[]
    
    return demands
  } catch (error) {
    handleServiceError('Error fetching service charge demands', error, {
      service: 'serviceChargeService',
      operation: 'getServiceChargeDemands',
      metadata: { buildingId }
    })
    throw error
  }
}

// Service Charge Statistics
export const getServiceChargeStats = async (buildingId: string): Promise<any> => {
  try {
    const q = query(
      collection(db, 'serviceChargeDemands'),
      where('buildingId', '==', buildingId),
      orderBy('issuedDate', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const demands = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceChargeDemand[]

    const totalDemands = demands.length
    const totalAmountDue = demands.reduce((sum, demand) => sum + demand.totalAmountDue, 0)
    const totalAmountPaid = demands.reduce((sum, demand) => sum + demand.amountPaid, 0)
    const totalOutstanding = demands.reduce((sum, demand) => sum + demand.outstandingAmount, 0)
    
    // Group by status
    const byStatus = demands.reduce((acc, demand) => {
      const status = demand.status || ServiceChargeDemandStatus.ISSUED
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<ServiceChargeDemandStatus, number>)

    // Calculate overdue demands
    const currentDate = new Date()
    const overdueDemands = demands.filter(demand => {
      const dueDate = demand.dueDate instanceof Timestamp ? demand.dueDate.toDate() : new Date(demand.dueDate)
      return dueDate < currentDate && demand.status !== ServiceChargeDemandStatus.PAID
    })
    
    const overdueAmount = overdueDemands.reduce((sum, demand) => sum + demand.outstandingAmount, 0)

    return {
      totalDemands,
      totalAmountDue,
      totalAmountPaid,
      totalOutstanding,
      byStatus,
      overdueDemands: overdueDemands.length,
      overdueAmount
    }
  } catch (error) {
    handleServiceError('Error fetching service charge stats', error, {
      service: 'serviceChargeService',
      operation: 'getServiceChargeStats',
      metadata: { buildingId }
    })
    throw error
  }
}

export const getServiceChargeDemand = async (id: string): Promise<ServiceChargeDemand | null> => {
  try {
    const docRef = doc(db, 'serviceChargeDemands', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ServiceChargeDemand
    }
    return null
  } catch (error) {
    handleServiceError('Error fetching service charge demand', error, {
      service: 'serviceChargeService',
      operation: 'getServiceChargeDemand',
      metadata: { demandId: id }
    })
    throw error
  }
}

export const createServiceChargeDemand = async (demand: Omit<ServiceChargeDemand, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'serviceChargeDemands'), {
      ...demand,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    handleServiceError('Error creating service charge demand', error, {
      service: 'serviceChargeService',
      operation: 'createServiceChargeDemand'
    })
    throw error
  }
}

export const updateServiceChargeDemand = async (id: string, updates: Partial<ServiceChargeDemand>): Promise<void> => {
  try {
    const docRef = doc(db, 'serviceChargeDemands', id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    handleServiceError('Error updating service charge demand', error, {
      service: 'serviceChargeService',
      operation: 'updateServiceChargeDemand',
      metadata: { demandId: id }
    })
    throw error
  }
}

export const deleteServiceChargeDemand = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'serviceChargeDemands', id)
    await deleteDoc(docRef)
  } catch (error) {
    handleServiceError('Error deleting service charge demand', error, {
      service: 'serviceChargeService',
      operation: 'deleteServiceChargeDemand',
      metadata: { demandId: id }
    })
    throw error
  }
}

// Income Management
export const getIncomeStats = async (buildingId: string): Promise<any> => {
  try {
    const q = query(
      collection(db, 'income'),
      where('buildingId', '==', buildingId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const incomeData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[]

    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0)
    const monthlyIncome = incomeData
      .filter(item => {
        const itemDate = new Date(item.date)
        const currentDate = new Date()
        return itemDate.getMonth() === currentDate.getMonth() && 
               itemDate.getFullYear() === currentDate.getFullYear()
      })
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      totalIncome,
      monthlyIncome,
      incomeCount: incomeData.length,
      recentIncome: incomeData.slice(0, 5)
    }
  } catch (error) {
    handleServiceError('Error fetching income stats', error, {
      service: 'serviceChargeService',
      operation: 'getIncomeStats',
      metadata: { buildingId }
    })
    throw error
  }
}

export const getIncome = async (buildingId: string): Promise<Income[]> => {
  try {
    const q = query(
      collection(db, 'income'),
      where('buildingId', '==', buildingId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[]
  } catch (error) {
    handleServiceError('Error fetching income', error, {
      service: 'serviceChargeService',
      operation: 'getIncome',
      metadata: { buildingId }
    })
    throw error
  }
}

export const createIncome = async (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'income'), {
      ...income,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    handleServiceError('Error creating income', error, {
      service: 'serviceChargeService',
      operation: 'createIncome'
    })
    throw error
  }
}

// Expenditure Management
export const getExpenditureStats = async (buildingId: string): Promise<any> => {
  try {
    const q = query(
      collection(db, 'expenditure'),
      where('buildingId', '==', buildingId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const expenditureData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expenditure[]

    const totalExpenditure = expenditureData.reduce((sum, item) => sum + item.amount, 0)
    const monthlyExpenditure = expenditureData
      .filter(item => {
        const itemDate = new Date(item.date)
        const currentDate = new Date()
        return itemDate.getMonth() === currentDate.getMonth() && 
               itemDate.getFullYear() === currentDate.getFullYear()
      })
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      totalExpenditure,
      monthlyExpenditure,
      expenditureCount: expenditureData.length,
      recentExpenditure: expenditureData.slice(0, 5)
    }
  } catch (error) {
    handleServiceError('Error fetching expenditure stats', error, {
      service: 'serviceChargeService',
      operation: 'getExpenditureStats',
      metadata: { buildingId }
    })
    throw error
  }
}

export const getExpenditure = async (buildingId: string): Promise<Expenditure[]> => {
  try {
    const q = query(
      collection(db, 'expenditure'),
      where('buildingId', '==', buildingId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expenditure[]
  } catch (error) {
    handleServiceError('Error fetching expenditure', error, {
      service: 'serviceChargeService',
      operation: 'getExpenditure',
      metadata: { buildingId }
    })
    throw error
  }
}

export const createExpenditure = async (expenditure: Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'expenditure'), {
      ...expenditure,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    handleServiceError('Error creating expenditure', error, {
      service: 'serviceChargeService',
      operation: 'createExpenditure'
    })
    throw error
  }
}

// Financial Summary
export const getBuildingFinancialSummary = async (buildingId: string, quarter: string): Promise<any> => {
  try {
    // Verify building exists in Firebase
    try {
      const buildingRef = doc(db, 'buildings', buildingId)
      const buildingSnap = await getDoc(buildingRef)
      if (!buildingSnap.exists()) {
        throw new Error(`Building ${buildingId} not found`)
      }
    } catch (buildingError) {
      console.error('Building fetch failed:', buildingError)
      throw buildingError
    }

    // Get service charge demands using single-field query (no composite index needed)
    let demands: ServiceChargeDemand[] = []
    try {
      const demandsQuery = query(
        collection(db, 'serviceChargeDemands'),
        where('buildingId', '==', buildingId)
      )
      const demandsSnapshot = await getDocs(demandsQuery)
      const allDemands = demandsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceChargeDemand[]
      
      // Filter by quarter on client side to avoid composite index
      demands = allDemands.filter(demand => 
        demand.financialQuarterDisplayString === quarter
      )
    } catch (demandsError) {
      console.warn('Demands fetch failed, using empty array:', demandsError)
    }

    // Calculate demand totals
    const totalDemanded = demands.reduce((sum, demand) => sum + (demand.totalAmountDue || 0), 0)
    const totalPaid = demands.reduce((sum, demand) => sum + (demand.amountPaid || 0), 0)
    const totalOutstanding = demands.reduce((sum, demand) => sum + (demand.outstandingAmount || 0), 0)

    // Get income and expenditure using single-field queries
    let totalIncome = 0
    let totalExpenditure = 0
    const incomeBreakdown = { serviceCharges: 0, groundRent: 0 }
    const expenditureBreakdown = { maintenance: 0, insurance: 0, management: 0 }

    try {
      // Get all income for building, filter by date range on client side
      const incomeQuery = query(
        collection(db, 'income'),
        where('buildingId', '==', buildingId)
      )
      const incomeSnapshot = await getDocs(incomeQuery)
      const allIncome = incomeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Income[]
      
      // Filter by quarter dates on client side
      const quarterStart = getQuarterStartDate(quarter)
      const quarterEnd = getQuarterEndDate(quarter)
      
      const quarterIncome = allIncome.filter(item => {
        const itemDate = fromFirestoreTimestamp(item.date)
        return itemDate >= quarterStart && itemDate <= quarterEnd
      })
      
      totalIncome = quarterIncome.reduce((sum, item) => sum + (item.amount || 0), 0)
      
      // Breakdown by source (Income uses 'source' not 'category')
      quarterIncome.forEach(item => {
        if (item.source === 'building_charges') {
          incomeBreakdown.serviceCharges += item.amount || 0
        } else if (item.source === 'miscellaneous') {
          incomeBreakdown.groundRent += item.amount || 0
        }
      })
    } catch (incomeError) {
      console.warn('Income fetch failed, using defaults:', incomeError)
    }

    try {
      // Get all expenditure for building, filter by date range on client side
      const expenditureQuery = query(
        collection(db, 'expenditure'),
        where('buildingId', '==', buildingId)
      )
      const expenditureSnapshot = await getDocs(expenditureQuery)
      const allExpenditure = expenditureSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expenditure[]
      
      // Filter by quarter dates on client side
      const quarterStart = getQuarterStartDate(quarter)
      const quarterEnd = getQuarterEndDate(quarter)
      
      const quarterExpenditure = allExpenditure.filter(item => {
        const itemDate = fromFirestoreTimestamp(item.date)
        return itemDate >= quarterStart && itemDate <= quarterEnd
      })
      
      totalExpenditure = quarterExpenditure.reduce((sum, item) => sum + (item.amount || 0), 0)
      
      // Breakdown by category (using correct Expenditure enum values)
      quarterExpenditure.forEach(item => {
        if (item.category === 'proactive_maintenance' || item.category === 'reactive_maintenance') {
          expenditureBreakdown.maintenance += item.amount || 0
        } else if (item.category === 'insurance') {
          expenditureBreakdown.insurance += item.amount || 0
        } else if (item.category === 'salary') {
          expenditureBreakdown.management += item.amount || 0
        }
      })
    } catch (expenditureError) {
      console.warn('Expenditure fetch failed, using defaults:', expenditureError)
    }

    // Calculate net position
    const netCashFlow = totalIncome - totalExpenditure
    const netPosition = netCashFlow


    // Return real data
    return {
      buildingId,
      period: quarter,
      totalIncome,
      totalExpenditure,
      netCashFlow,
      netPosition,
      outstandingAmount: totalOutstanding,
      incomeBreakdown,
      expenditureBreakdown,
      maintenanceBreakdown: {
        proactive: expenditureBreakdown.maintenance * 0.7, // Estimate
        reactive: expenditureBreakdown.maintenance * 0.3
      },
      demands: {
        total: demands.length,
        totalDemanded,
        totalPaid,
        totalOutstanding
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Original implementation (commented out due to Firebase index issues)
    /*
    const buildingRef = doc(db, 'buildings', buildingId)
    const buildingSnap = await getDoc(buildingRef)
    
    if (!buildingSnap.exists()) {
      throw new Error('Building not found')
    }
    
    const building = { id: buildingSnap.id, ...buildingSnap.data() } as Building

    // Get service charge demands for the quarter
    const demandsQuery = query(
      collection(db, 'serviceChargeDemands'),
      where('buildingId', '==', buildingId),
      where('financialQuarterDisplayString', '==', quarter)
    )
    const demandsSnapshot = await getDocs(demandsQuery)
    const demands = demandsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceChargeDemand[]

    // Calculate totals
    const totalDemanded = demands.reduce((sum, demand) => sum + demand.totalAmountDue, 0)
    const totalPaid = demands.reduce((sum, demand) => sum + demand.amountPaid, 0)
    const totalOutstanding = demands.reduce((sum, demand) => sum + demand.outstandingAmount, 0)
    const totalPenalties = demands.reduce((sum, demand) => sum + demand.penaltyAmountApplied, 0)

    // Get income and expenditure for the quarter
    const quarterStart = getQuarterStartDate(quarter)
    const quarterEnd = getQuarterEndDate(quarter)

    const incomeQuery = query(
      collection(db, 'income'),
      where('buildingId', '==', buildingId),
      where('date', '>=', quarterStart),
      where('date', '<=', quarterEnd)
    )
    const incomeSnapshot = await getDocs(incomeQuery)
    const income = incomeSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[]

    const expenditureQuery = query(
      collection(db, 'expenditure'),
      where('buildingId', '==', buildingId),
      where('date', '>=', quarterStart),
      where('date', '<=', quarterEnd)
    )
    const expenditureSnapshot = await getDocs(expenditureQuery)
    const expenditure = expenditureSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expenditure[]

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenditure = expenditure.reduce((sum, item) => sum + item.amount, 0)
    const netIncome = totalIncome - totalExpenditure

    return {
      quarter,
      building: {
        id: building.id,
        name: building.name,
        serviceChargeRate: building.financialInfo?.serviceChargeRate || 0
      },
      demands: {
        total: demands.length,
        totalDemanded,
        totalPaid,
        totalOutstanding,
        totalPenalties,
        paidCount: demands.filter(d => d.status === ServiceChargeDemandStatus.PAID).length,
        overdueCount: demands.filter(d => d.status === ServiceChargeDemandStatus.OVERDUE).length,
        partiallyPaidCount: demands.filter(d => d.status === ServiceChargeDemandStatus.PARTIALLY_PAID).length
      },
      income: {
        total: totalIncome,
        count: income.length,
        breakdown: income
      },
      expenditure: {
        total: totalExpenditure,
        count: expenditure.length,
        breakdown: expenditure
      },
      summary: {
        netIncome,
        collectionRate: totalDemanded > 0 ? (totalPaid / totalDemanded) * 100 : 0,
        outstandingRate: totalDemanded > 0 ? (totalOutstanding / totalDemanded) * 100 : 0
      }
    }
    */
  } catch (error) {
    handleServiceError('Error fetching financial summary', error, {
      service: 'serviceChargeService',
      operation: 'getBuildingFinancialSummary',
      metadata: { buildingId, quarter }
    })
    throw error
  }
}

// Helper functions for quarter calculations
function getQuarterStartDate(quarter: string): Date {
  try {
    let quarterNum: number
    let yearNum: number
    
    // Handle both formats: "Q1 2024" and "2024-Q1"
    if (quarter.includes(' ')) {
      // Format: "Q1 2024"
      const [q, year] = quarter.split(' ')
      if (!q || !year) {
        console.warn('Invalid quarter format (space-separated), using default start date:', quarter)
        return new Date(2024, 0, 1)
      }
      quarterNum = parseInt(q.substring(1))
      yearNum = parseInt(year)
    } else if (quarter.includes('-Q')) {
      // Format: "2024-Q1"
      const [year, q] = quarter.split('-Q')
      if (!q || !year) {
        console.warn('Invalid quarter format (dash-separated), using default start date:', quarter)
        return new Date(2024, 0, 1)
      }
      quarterNum = parseInt(q)
      yearNum = parseInt(year)
    } else {
      console.warn('Unrecognized quarter format, using default start date:', quarter)
      return new Date(2024, 0, 1)
    }
    
    if (isNaN(quarterNum) || isNaN(yearNum) || quarterNum < 1 || quarterNum > 4) {
      console.warn('Invalid quarter number or year, using default start date:', { quarterNum, yearNum, originalQuarter: quarter })
      return new Date(2024, 0, 1)
    }
    
    const month = (quarterNum - 1) * 3
    const startDate = new Date(yearNum, month, 1)
    
    return startDate
  } catch (error) {
    console.error('Error parsing quarter start date:', error, 'Quarter:', quarter)
    return new Date(2024, 0, 1) // Safe fallback
  }
}

function getQuarterEndDate(quarter: string): Date {
  try {
    
    let quarterNum: number
    let yearNum: number
    
    // Handle both formats: "Q1 2024" and "2024-Q1"
    if (quarter.includes(' ')) {
      // Format: "Q1 2024"
      const [q, year] = quarter.split(' ')
      if (!q || !year) {
        console.warn('Invalid quarter format (space-separated), using default date:', quarter)
        return new Date(2024, 11, 31)
      }
      quarterNum = parseInt(q.substring(1))
      yearNum = parseInt(year)
    } else if (quarter.includes('-Q')) {
      // Format: "2024-Q1"
      const [year, q] = quarter.split('-Q')
      if (!q || !year) {
        console.warn('Invalid quarter format (dash-separated), using default date:', quarter)
        return new Date(2024, 11, 31)
      }
      quarterNum = parseInt(q)
      yearNum = parseInt(year)
    } else {
      console.warn('Unrecognized quarter format, using default date:', quarter)
      return new Date(2024, 11, 31)
    }
    
    if (isNaN(quarterNum) || isNaN(yearNum) || quarterNum < 1 || quarterNum > 4) {
      console.warn('Invalid quarter number or year, using default:', { quarterNum, yearNum, originalQuarter: quarter })
      return new Date(2024, 11, 31) // Default to end of 2024
    }
    
    const month = (quarterNum * 3) - 1
    const endDate = new Date(yearNum, month + 1, 0)
    
    if (isNaN(endDate.getTime())) {
      console.warn('Generated invalid date, using default')
      return new Date(2024, 11, 31)
    }
    
    return endDate
  } catch (error) {
    console.error('Error parsing quarter date:', error, 'Quarter:', quarter)
    return new Date(2024, 11, 31) // Safe fallback
  }
}

// Bulk operations
export const bulkUpdateServiceChargeDemands = async (updates: Array<{ id: string; updates: Partial<ServiceChargeDemand> }>): Promise<void> => {
  try {
    const batch = writeBatch(db)
    
    updates.forEach(({ id, updates }) => {
      const docRef = doc(db, 'serviceChargeDemands', id)
      batch.update(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    handleServiceError('Error bulk updating service charge demands', error, {
      service: 'serviceChargeService',
      operation: 'bulkUpdateServiceChargeDemands',
      metadata: { updateCount: updates.length }
    })
    throw error
  }
}

/**
 * Generate basic service charge demands (without credit application)
 * This is the core demand generation logic
 */
export const generateBasicServiceChargeDemands = async (
  buildingId: string, 
  quarter: string, 
  rate: number,
  flats: Flat[],
  issuedByUid: string = 'system'
): Promise<ServiceChargeDemand[]> => {
  try {
    const demands: ServiceChargeDemand[] = []
    
    for (const flat of flats) {
      const baseAmount = (flat.areaSqFt || 0) * rate
      const groundRentAmount = flat.groundRent || 0
      const totalAmountDue = baseAmount + groundRentAmount
      
      // Create demand object with temporary ID
      const demand: ServiceChargeDemand = {
        id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID, will be replaced when saved
        buildingId,
        flatId: flat.id,
        flatNumber: flat.flatNumber,
        residentUid: null,
        residentName: `Resident of ${flat.flatNumber}`,
        financialQuarterDisplayString: quarter,
        areaSqFt: flat.areaSqFt || 0,
        rateApplied: rate,
        baseAmount,
        groundRentAmount,
        penaltyAmountApplied: 0,
        totalAmountDue,
        amountPaid: 0,
        outstandingAmount: totalAmountDue,
        dueDate: getQuarterEndDate(quarter),
        issuedDate: new Date(),
        status: ServiceChargeDemandStatus.ISSUED,
        paymentHistory: [],
        notes: `Service charge for ${quarter} - ${flat.flatNumber}`,
        issuedByUid,
        penaltyAppliedAt: null,
        invoiceGrouping: 'per_unit',
        showBreakdown: true,
        chargeBreakdown: [
          {
            id: `maintenance-${flat.flatNumber}`,
            description: 'Maintenance Charge',
            amount: baseAmount,
            category: 'maintenance'
          },
          ...(groundRentAmount > 0 ? [{
            id: `ground-rent-${flat.flatNumber}`,
            description: 'Ground Rent (Quarterly)',
            amount: groundRentAmount,
            category: 'ground_rent'
          }] : [])
        ],
        penaltyConfig: {
          type: 'flat' as const,
          flatAmount: 50,
          gracePeriodDays: 7
        },
        remindersConfig: {
          reminderDays: [7, 3, 1],
          maxReminders: 3
        },
        remindersSent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Initialize credit-related fields
        hasCreditApplied: false,
        creditAppliedAmount: 0,
        creditApplications: [],
        paymentAllocations: [],
        unallocatedPayments: 0
      }
      
      demands.push(demand)
    }
    
    return demands
    
  } catch (error) {
    handleServiceError('Error generating basic service charge demands', error, {
      service: 'serviceChargeService',
      operation: 'generateBasicServiceChargeDemands',
      metadata: { buildingId, quarter, flatCount: flats.length }
    })
    throw error
  }
}

/**
 * Enhanced service charge generation with credit application integration
 */
export const generateServiceChargeDemands = async (
  buildingId: string, 
  quarter: string, 
  rate: number,
  flats: Flat[],
  issuedByUid: string = 'system'
): Promise<ServiceChargeDemand[]> => {
  try {
    // Step 1: Generate basic demands
    const basicDemands = await generateBasicServiceChargeDemands(
      buildingId, 
      quarter, 
      rate, 
      flats,
      issuedByUid
    )
    
    // Step 2: Apply available credits to the demands
    let finalDemands = basicDemands
    
    try {
      // Import credit application service
      const { applyCreditsToNewDemands } = await import('./creditApplicationService')
      
      finalDemands = await applyCreditsToNewDemands(
        buildingId,
        quarter,
        basicDemands,
        issuedByUid
      )
      
      const demandsWithCredits = finalDemands.filter(d => d.hasCreditApplied)
    } catch (creditError) {
      console.error('Error applying credits, proceeding with basic demands:', creditError)
      // Continue with basic demands if credit application fails
    }
    
    // Step 3: Save demands to Firestore
    const batch = writeBatch(db)
    const savedDemands: ServiceChargeDemand[] = []
    
    for (const demand of finalDemands) {
      const demandRef = doc(collection(db, 'serviceChargeDemands'))
      
      // Remove temporary ID and prepare for Firestore
      const { id, ...demandData } = demand
      
      batch.set(demandRef, {
        ...demandData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Add the real ID to our response
      savedDemands.push({
        ...demand,
        id: demandRef.id
      })
    }
    
    await batch.commit()
    
    // Step 4: Sync demands to flat ledger
    try {
      const { syncDemandFromServiceCharge } = await import('./flatLedgerSyncService')
      
      let syncedCount = 0
      let syncErrors = 0
      
      for (const demand of savedDemands) {
        try {
          // Convert Firestore timestamps to Date objects for the sync
          const demandWithDates: ServiceChargeDemand = {
            ...demand,
            issuedDate: demand.issuedDate instanceof Date ? demand.issuedDate : new Date(demand.issuedDate),
            dueDate: demand.dueDate instanceof Date ? demand.dueDate : new Date(demand.dueDate),
            createdAt: demand.createdAt instanceof Date ? demand.createdAt : new Date(demand.createdAt),
            updatedAt: demand.updatedAt instanceof Date ? demand.updatedAt : new Date(demand.updatedAt)
          }
          
          await syncDemandFromServiceCharge(demandWithDates, issuedByUid)
          syncedCount++
        } catch (syncError) {
          console.error('[LedgerSync] Failed to sync individual demand', {
            demandId: demand.id,
            flatId: demand.flatId,
            error: syncError
          })
          syncErrors++
          // Continue with other demands even if one fails
        }
      }
    } catch (syncServiceError) {
      console.error('[LedgerSync] ❌ Ledger sync service error:', syncServiceError)
      // Don't throw - demands are saved, ledger sync is secondary
    }
    
    // Step 5: Create account ledgers for any flats that don't have them
    try {
      const { getOrCreateResidentAccount } = await import('./residentAccountService')
      
      for (const demand of savedDemands) {
        await getOrCreateResidentAccount(
          demand.flatId,
          demand.buildingId,
          demand.flatNumber,
          demand.residentName || `Resident of ${demand.flatNumber}`,
          demand.residentUid
        )
      }
      
    } catch (accountError) {
      console.warn('Error creating account ledgers:', accountError)
      // This is not critical, continue
    }
    
    return savedDemands
    
  } catch (error) {
    handleServiceError('Error in enhanced service charge generation', error, {
      service: 'serviceChargeService',
      operation: 'generateServiceChargeDemands',
      metadata: { buildingId, quarter }
    })
    throw error
  }
}

/**
 * Legacy function for backward compatibility
 * Returns just the IDs as the original function did
 */
export const generateServiceChargeDemandsLegacy = async (
  buildingId: string, 
  quarter: string, 
  rate: number,
  flats: any[]
): Promise<string[]> => {
  try {
    const demands = await generateServiceChargeDemands(buildingId, quarter, rate, flats)
    return demands.map(d => d.id)
  } catch (error) {
    handleServiceError('Error in legacy service charge generation', error, {
      service: 'serviceChargeService',
      operation: 'generateServiceChargeDemandsLegacy',
      metadata: { buildingId, quarter }
    })
    throw error
  }
}

// Global Financial Settings
export const getGlobalFinancialSettings = async (buildingId: string): Promise<any> => {
  try {
    const docRef = doc(db, 'buildings', buildingId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const building = docSnap.data()
      return {
        serviceChargeRatePerSqFt: building.financialInfo?.serviceChargeRate || 0,
        paymentDueLeadDays: building.financialInfo?.paymentDueLeadDays || 30,
        financialYearStartDate: building.financialInfo?.financialYearStartDate || new Date().toISOString().split('T')[0]
      }
    }
    return {
      serviceChargeRatePerSqFt: 0,
      paymentDueLeadDays: 30,
      financialYearStartDate: new Date().toISOString().split('T')[0]
    }
  } catch (error) {
    handleServiceError('Error fetching global financial settings', error, {
      service: 'serviceChargeService',
      operation: 'getGlobalFinancialSettings',
      metadata: { buildingId }
    })
    throw error
  }
}

export const updateGlobalFinancialSettings = async (buildingId: string, settings: any): Promise<void> => {
  try {
    const docRef = doc(db, 'buildings', buildingId)
    await updateDoc(docRef, {
      'financialInfo.serviceChargeRate': settings.serviceChargeRatePerSqFt,
      'financialInfo.paymentDueLeadDays': settings.paymentDueLeadDays,
      'financialInfo.financialYearStartDate': settings.financialYearStartDate,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    handleServiceError('Error updating global financial settings', error, {
      service: 'serviceChargeService',
      operation: 'updateGlobalFinancialSettings',
      metadata: { buildingId }
    })
    throw error
  }
}

// Reminder and Penalty Functions
export const sendReminder = async (demandId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'serviceChargeDemands', demandId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const demand = docSnap.data() as ServiceChargeDemand
      const currentReminders = demand.remindersSent || 0
      const maxReminders = demand.remindersConfig?.maxReminders || 3
      
      if (currentReminders < maxReminders) {
        await updateDoc(docRef, {
          remindersSent: currentReminders + 1,
          updatedAt: serverTimestamp()
        })
      }
    }
  } catch (error) {
    handleServiceError('Error sending reminder', error, {
      service: 'serviceChargeService',
      operation: 'sendReminder',
      metadata: { demandId }
    })
    throw error
  }
}

export const checkAndApplyPenalties = async (buildingId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'serviceChargeDemands'),
      where('buildingId', '==', buildingId),
      where('status', 'in', [ServiceChargeDemandStatus.ISSUED, ServiceChargeDemandStatus.PARTIALLY_PAID])
    )
    const querySnapshot = await getDocs(q)
    const demands = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceChargeDemand[]
    
    const batch = writeBatch(db)
    let penaltiesApplied = 0
    const currentDate = new Date()
    
    for (const demand of demands) {
      const dueDate = fromFirestoreTimestamp(demand.dueDate)
      const gracePeriod = demand.penaltyConfig?.gracePeriodDays || 7
      const graceDate = new Date(dueDate.getTime() + (gracePeriod * 24 * 60 * 60 * 1000))
      
      if (currentDate > graceDate && !demand.penaltyAppliedAt) {
        const penaltyAmount = demand.penaltyConfig?.flatAmount || 50
        const newTotalAmount = demand.totalAmountDue + penaltyAmount
        const newOutstandingAmount = demand.outstandingAmount + penaltyAmount
        
        batch.update(doc(db, 'serviceChargeDemands', demand.id), {
          penaltyAmountApplied: penaltyAmount,
          totalAmountDue: newTotalAmount,
          outstandingAmount: newOutstandingAmount,
          penaltyAppliedAt: serverTimestamp(),
          status: ServiceChargeDemandStatus.OVERDUE,
          updatedAt: serverTimestamp()
        })
        
        penaltiesApplied++
      }
    }
    
    if (penaltiesApplied > 0) {
      await batch.commit()
    }
    
    return penaltiesApplied
  } catch (error) {
    handleServiceError('Error checking and applying penalties', error, {
      service: 'serviceChargeService',
      operation: 'checkAndApplyPenalties',
      metadata: { buildingId }
    })
    throw error
  }
}

// Income and Expenditure Functions
export const recordIncome = async (buildingId: string, income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  return createIncome(income)
}

export const recordExpenditure = async (buildingId: string, expenditure: Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  return createExpenditure(expenditure)
}

export const getIncomeEntries = async (buildingId: string): Promise<Income[]> => {
  return getIncome(buildingId)
}

export const getExpenditureEntries = async (buildingId: string): Promise<Expenditure[]> => {
  return getExpenditure(buildingId)
} 