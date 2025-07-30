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
  limit, 
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
  Building
} from '../types'

// Service Charge Demands
export const getServiceChargeDemands = async (buildingId: string): Promise<ServiceChargeDemand[]> => {
  try {
    const q = query(
      collection(db, 'serviceChargeDemands'),
      where('buildingId', '==', buildingId),
      orderBy('issuedDate', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceChargeDemand[]
  } catch (error) {
    console.error('Error fetching service charge demands:', error)
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
    console.error('Error fetching service charge demand:', error)
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
    console.error('Error creating service charge demand:', error)
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
    console.error('Error updating service charge demand:', error)
    throw error
  }
}

export const deleteServiceChargeDemand = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'serviceChargeDemands', id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting service charge demand:', error)
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
    console.error('Error fetching income stats:', error)
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
    console.error('Error fetching income:', error)
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
    console.error('Error creating income:', error)
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
    console.error('Error fetching expenditure stats:', error)
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
    console.error('Error fetching expenditure:', error)
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
    console.error('Error creating expenditure:', error)
    throw error
  }
}

// Financial Summary
export const getBuildingFinancialSummary = async (buildingId: string, quarter: string): Promise<any> => {
  try {
    // Get building info
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
  } catch (error) {
    console.error('Error fetching financial summary:', error)
    throw error
  }
}

// Helper functions for quarter calculations
function getQuarterStartDate(quarter: string): Date {
  const [q, year] = quarter.split(' ')
  const quarterNum = parseInt(q.substring(1))
  const yearNum = parseInt(year)
  const month = (quarterNum - 1) * 3
  return new Date(yearNum, month, 1)
}

function getQuarterEndDate(quarter: string): Date {
  const [q, year] = quarter.split(' ')
  const quarterNum = parseInt(q.substring(1))
  const yearNum = parseInt(year)
  const month = (quarterNum * 3) - 1
  return new Date(yearNum, month + 1, 0)
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
    console.error('Error bulk updating service charge demands:', error)
    throw error
  }
}

export const generateServiceChargeDemands = async (
  buildingId: string, 
  quarter: string, 
  rate: number,
  flats: any[]
): Promise<string[]> => {
  try {
    const batch = writeBatch(db)
    const demandIds: string[] = []
    
    for (const flat of flats) {
      const demandRef = doc(collection(db, 'serviceChargeDemands'))
      const baseAmount = flat.areaSqFt * rate
      const groundRentAmount = flat.groundRent || 0
      const totalAmountDue = baseAmount + groundRentAmount
      
      const demand: Omit<ServiceChargeDemand, 'id' | 'createdAt' | 'updatedAt'> = {
        buildingId,
        flatId: flat.id,
        flatNumber: flat.flatNumber,
        residentUid: flat.residentUid || '',
        residentName: flat.residentName || '',
        financialQuarterDisplayString: quarter,
        areaSqFt: flat.areaSqFt,
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
        notes: '',
        issuedByUid: 'system',
        penaltyAppliedAt: null,
        invoiceGrouping: 'per_unit',
        showBreakdown: false,
        chargeBreakdown: [],
        penaltyConfig: {
          type: 'flat',
          flatAmount: 50,
          gracePeriodDays: 7
        },
        remindersConfig: {
          reminderDays: [7, 3, 1],
          maxReminders: 3
        },
        remindersSent: 0
      }
      
      batch.set(demandRef, {
        ...demand,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      demandIds.push(demandRef.id)
    }
    
    await batch.commit()
    return demandIds
  } catch (error) {
    console.error('Error generating service charge demands:', error)
    throw error
  }
} 