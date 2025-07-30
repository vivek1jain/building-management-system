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
  ServiceChargeDemand, 
  ServiceChargeDemandStatus, 
  PaymentRecord, 
  PaymentMethod,
  Flat,
  Person,
  GlobalFinancialSettings,
  ChargeBreakdownItem,
  PenaltyConfig,
  ReminderConfig,
  Income,
  Expenditure,
  BuildingFinancialSummary
} from '../types'
import { getFlatsByBuilding } from './flatService'
import { getPeopleByBuilding } from './peopleService'

// Get service charge demands for a building
export const getServiceChargeDemands = async (buildingId: string): Promise<ServiceChargeDemand[]> => {
  try {
    const demandsRef = collection(db, 'serviceChargeDemands')
    const q = query(
      demandsRef,
      where('buildingId', '==', buildingId)
    )
    
    const querySnapshot = await getDocs(q)
    const demands: ServiceChargeDemand[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      demands.push({
        id: doc.id,
        flatId: data.flatId,
        buildingId: data.buildingId,
        flatNumber: data.flatNumber,
        residentUid: data.residentUid,
        residentName: data.residentName,
        financialQuarterDisplayString: data.financialQuarterDisplayString,
        areaSqFt: data.areaSqFt,
        rateApplied: data.rateApplied,
        baseAmount: data.baseAmount,
        groundRentAmount: data.groundRentAmount,
        penaltyAmountApplied: data.penaltyAmountApplied,
        totalAmountDue: data.totalAmountDue,
        amountPaid: data.amountPaid,
        outstandingAmount: data.outstandingAmount,
        dueDate: data.dueDate?.toDate(),
        issuedDate: data.issuedDate?.toDate(),
        status: data.status,
        paymentHistory: data.paymentHistory?.map((payment: any) => ({
          ...payment,
          paymentDate: payment.paymentDate?.toDate(),
          recordedAt: payment.recordedAt?.toDate()
        })),
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        issuedByUid: data.issuedByUid,
        penaltyAppliedAt: data.penaltyAppliedAt?.toDate(),
        invoiceGrouping: data.invoiceGrouping || 'per_unit',
        showBreakdown: data.showBreakdown || false,
        chargeBreakdown: data.chargeBreakdown || [],
        penaltyConfig: data.penaltyConfig || {
          type: 'flat',
          flatAmount: 0,
          gracePeriodDays: 0
        },
        remindersConfig: data.remindersConfig || {
          reminderDays: [7, 3, 1],
          maxReminders: 3
        },
        remindersSent: data.remindersSent || 0,
        lastReminderSent: data.lastReminderSent?.toDate()
      })
    })
    
    // Sort in memory by due date descending
    return demands.sort((a, b) => {
      const dateA = a.dueDate || new Date(0)
      const dateB = b.dueDate || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error('Error getting service charge demands:', error)
    throw error
  }
}

// Get service charge demand by ID
export const getServiceChargeDemandById = async (demandId: string): Promise<ServiceChargeDemand | null> => {
  try {
    const demandRef = doc(db, 'serviceChargeDemands', demandId)
    const demandSnap = await getDoc(demandRef)
    
    if (demandSnap.exists()) {
      const data = demandSnap.data()
      return {
        id: demandSnap.id,
        flatId: data.flatId,
        buildingId: data.buildingId,
        flatNumber: data.flatNumber,
        residentUid: data.residentUid,
        residentName: data.residentName,
        financialQuarterDisplayString: data.financialQuarterDisplayString,
        areaSqFt: data.areaSqFt,
        rateApplied: data.rateApplied,
        baseAmount: data.baseAmount,
        groundRentAmount: data.groundRentAmount,
        penaltyAmountApplied: data.penaltyAmountApplied,
        totalAmountDue: data.totalAmountDue,
        amountPaid: data.amountPaid,
        outstandingAmount: data.outstandingAmount,
        dueDate: data.dueDate?.toDate(),
        issuedDate: data.issuedDate?.toDate(),
        status: data.status,
        paymentHistory: data.paymentHistory?.map((payment: any) => ({
          ...payment,
          paymentDate: payment.paymentDate?.toDate(),
          recordedAt: payment.recordedAt?.toDate()
        })),
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        issuedByUid: data.issuedByUid,
        penaltyAppliedAt: data.penaltyAppliedAt?.toDate(),
        invoiceGrouping: data.invoiceGrouping || 'per_unit',
        showBreakdown: data.showBreakdown || false,
        chargeBreakdown: data.chargeBreakdown || [],
        penaltyConfig: data.penaltyConfig || {
          type: 'flat',
          flatAmount: 0,
          gracePeriodDays: 0
        },
        remindersConfig: data.remindersConfig || {
          reminderDays: [7, 3, 1],
          maxReminders: 3
        },
        remindersSent: data.remindersSent || 0,
        lastReminderSent: data.lastReminderSent?.toDate()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting service charge demand by ID:', error)
    throw error
  }
}

// Create new service charge demand
export const createServiceChargeDemand = async (demandData: Omit<ServiceChargeDemand, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceChargeDemand> => {
  try {
    const demandsRef = collection(db, 'serviceChargeDemands')
    const newDemand = {
      ...demandData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(demandsRef, newDemand)
    
    return {
      id: docRef.id,
      ...demandData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating service charge demand:', error)
    throw error
  }
}

// Update service charge demand
export const updateServiceChargeDemand = async (demandId: string, demandData: Partial<Omit<ServiceChargeDemand, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const demandRef = doc(db, 'serviceChargeDemands', demandId)
    await updateDoc(demandRef, {
      ...demandData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating service charge demand:', error)
    throw error
  }
}

// Record payment for service charge demand
export const recordPayment = async (
  demandId: string, 
  paymentData: Omit<PaymentRecord, 'paymentId' | 'recordedAt'>
): Promise<void> => {
  try {
    const demandRef = doc(db, 'serviceChargeDemands', demandId)
    const demandSnap = await getDoc(demandRef)
    
    if (!demandSnap.exists()) {
      throw new Error('Service charge demand not found')
    }
    
    const demandData = demandSnap.data()
    const currentAmountPaid = demandData.amountPaid || 0
    const newAmountPaid = currentAmountPaid + paymentData.amount
    const totalAmountDue = demandData.totalAmountDue || 0
    
    let newStatus = demandData.status
    if (newAmountPaid >= totalAmountDue) {
      newStatus = ServiceChargeDemandStatus.PAID
    } else if (newAmountPaid > 0) {
      newStatus = ServiceChargeDemandStatus.PARTIALLY_PAID
    }
    
    const paymentRecord: PaymentRecord = {
      paymentId: `payment_${Date.now()}`,
      ...paymentData,
      recordedAt: new Date()
    }
    
    const paymentHistory = demandData.paymentHistory || []
    paymentHistory.push(paymentRecord)
    
    await updateDoc(demandRef, {
      amountPaid: newAmountPaid,
      outstandingAmount: totalAmountDue - newAmountPaid,
      status: newStatus,
      paymentHistory,
      updatedAt: serverTimestamp()
    })
    
    // Automatically record income from payment
    await recordIncome({
      buildingId: demandData.buildingId,
      date: paymentData.paymentDate,
      amount: paymentData.amount,
      source: 'building_charges',
      description: `Payment for ${demandData.flatNumber} - ${demandData.financialQuarterDisplayString}`,
      relatedInvoiceId: demandId,
      recordedByUid: paymentData.recordedByUid
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    throw error
  }
}

// Generate service charge demands for all units in a building
export const generateServiceChargeDemands = async (
  buildingId: string,
  quarter: string,
  ratePerSqFt: number,
  dueDate: Date,
  issuedByUid: string,
  options: {
    includeGroundRent?: boolean;
    invoiceGrouping?: 'per_unit' | 'per_resident';
    showBreakdown?: boolean;
    penaltyConfig?: PenaltyConfig;
    remindersConfig?: ReminderConfig;
    chargeBreakdown?: ChargeBreakdownItem[];
  } = {}
): Promise<{ success: boolean; message: string; demandsGenerated: number }> => {
  try {
    const flats = await getFlatsByBuilding(buildingId)
    const people = await getPeopleByBuilding(buildingId)
    
    if (flats.length === 0) {
      return {
        success: false,
        message: 'No flats found for this building',
        demandsGenerated: 0
      }
    }
    
    const batch = writeBatch(db)
    const demandsRef = collection(db, 'serviceChargeDemands')
    let demandsGenerated = 0
    
    // Group by resident if requested
    if (options.invoiceGrouping === 'per_resident') {
      const residentGroups = new Map<string, { flats: Flat[]; person: Person }>()
      
      flats.forEach(flat => {
        const person = people.find(p => p.flatId === flat.id)
        if (person) {
          const existing = residentGroups.get(person.id)
          if (existing) {
            existing.flats.push(flat)
          } else {
            residentGroups.set(person.id, { flats: [flat], person })
          }
        }
      })
      
      // Create demands per resident
      for (const [residentId, { flats, person }] of residentGroups) {
        const totalArea = flats.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0)
        const baseAmount = totalArea * ratePerSqFt
        const groundRentAmount = options.includeGroundRent 
          ? flats.reduce((sum, flat) => sum + (flat.groundRent || 0), 0)
          : 0
        const totalAmountDue = baseAmount + groundRentAmount
        
        const demandData = {
          buildingId,
          flatId: flats[0].id, // Use first flat as primary
          flatNumber: flats.map(f => f.flatNumber).join(', '),
          residentUid: person.uid,
          residentName: person.name,
          financialQuarterDisplayString: quarter,
          areaSqFt: totalArea,
          rateApplied: ratePerSqFt,
          baseAmount,
          groundRentAmount,
          penaltyAmountApplied: 0,
          totalAmountDue,
          amountPaid: 0,
          outstandingAmount: totalAmountDue,
          dueDate,
          issuedDate: new Date(),
          status: ServiceChargeDemandStatus.ISSUED,
          paymentHistory: [],
          notes: `Combined demand for ${flats.length} unit(s)`,
          issuedByUid,
          invoiceGrouping: options.invoiceGrouping || 'per_unit',
          showBreakdown: options.showBreakdown || false,
          chargeBreakdown: options.chargeBreakdown || [],
          penaltyConfig: options.penaltyConfig || {
            type: 'flat',
            flatAmount: 0,
            gracePeriodDays: 0
          },
          remindersConfig: options.remindersConfig || {
            reminderDays: [7, 3, 1],
            maxReminders: 3
          },
          remindersSent: 0
        }
        
        const demandRef = doc(demandsRef)
        batch.set(demandRef, {
          ...demandData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        demandsGenerated++
      }
    } else {
      // Create demands per unit
      for (const flat of flats) {
        const person = people.find(p => p.flatId === flat.id)
        const areaSqFt = flat.areaSqFt || 0
        const baseAmount = areaSqFt * ratePerSqFt
        const groundRentAmount = options.includeGroundRent ? (flat.groundRent || 0) : 0
        const totalAmountDue = baseAmount + groundRentAmount
        
        const demandData = {
          buildingId,
          flatId: flat.id,
          flatNumber: flat.flatNumber,
          residentUid: person?.uid,
          residentName: person?.name,
          financialQuarterDisplayString: quarter,
          areaSqFt,
          rateApplied: ratePerSqFt,
          baseAmount,
          groundRentAmount,
          penaltyAmountApplied: 0,
          totalAmountDue,
          amountPaid: 0,
          outstandingAmount: totalAmountDue,
          dueDate,
          issuedDate: new Date(),
          status: ServiceChargeDemandStatus.ISSUED,
          paymentHistory: [],
          notes: '',
          issuedByUid,
          invoiceGrouping: options.invoiceGrouping || 'per_unit',
          showBreakdown: options.showBreakdown || false,
          chargeBreakdown: options.chargeBreakdown || [],
          penaltyConfig: options.penaltyConfig || {
            type: 'flat',
            flatAmount: 0,
            gracePeriodDays: 0
          },
          remindersConfig: options.remindersConfig || {
            reminderDays: [7, 3, 1],
            maxReminders: 3
          },
          remindersSent: 0
        }
        
        const demandRef = doc(demandsRef)
        batch.set(demandRef, {
          ...demandData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        demandsGenerated++
      }
    }
    
    await batch.commit()
    
    return {
      success: true,
      message: `Successfully generated ${demandsGenerated} service charge demands`,
      demandsGenerated
    }
  } catch (error) {
    console.error('Error generating service charge demands:', error)
    throw error
  }
}

// Get service charge statistics for a building
export const getServiceChargeStats = async (buildingId: string) => {
  try {
    const demands = await getServiceChargeDemands(buildingId)
    
    const stats = {
      totalDemands: demands.length,
      totalAmount: demands.reduce((sum, demand) => sum + demand.totalAmountDue, 0),
      totalCollected: demands.reduce((sum, demand) => sum + demand.amountPaid, 0),
      outstandingAmount: demands.reduce((sum, demand) => sum + demand.outstandingAmount, 0),
      overdueAmount: demands
        .filter(demand => demand.status === ServiceChargeDemandStatus.OVERDUE)
        .reduce((sum, demand) => sum + demand.outstandingAmount, 0),
      byStatus: {} as Record<ServiceChargeDemandStatus, number>,
      recentDemands: demands.slice(0, 5)
    }
    
    // Count by status
    demands.forEach(demand => {
      stats.byStatus[demand.status] = (stats.byStatus[demand.status] || 0) + 1
    })
    
    return stats
  } catch (error) {
    console.error('Error getting service charge stats:', error)
    throw error
  }
}

// Get overdue service charges
export const getOverdueServiceCharges = async (buildingId: string): Promise<ServiceChargeDemand[]> => {
  try {
    const demands = await getServiceChargeDemands(buildingId)
    const today = new Date()
    
    return demands.filter(demand => 
      demand.status !== ServiceChargeDemandStatus.PAID && 
      demand.dueDate < today
    )
  } catch (error) {
    console.error('Error getting overdue service charges:', error)
    throw error
  }
}

// Apply late payment penalty
export const applyLatePaymentPenalty = async (demandId: string, penaltyAmount: number): Promise<void> => {
  try {
    const demandRef = doc(db, 'serviceChargeDemands', demandId)
    const demandSnap = await getDoc(demandRef)
    
    if (!demandSnap.exists()) {
      throw new Error('Service charge demand not found')
    }
    
    const demandData = demandSnap.data()
    const currentPenalty = demandData.penaltyAmountApplied || 0
    const newTotalAmount = demandData.totalAmountDue + penaltyAmount
    const newOutstandingAmount = demandData.outstandingAmount + penaltyAmount
    
    await updateDoc(demandRef, {
      penaltyAmountApplied: currentPenalty + penaltyAmount,
      totalAmountDue: newTotalAmount,
      outstandingAmount: newOutstandingAmount,
      penaltyAppliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    // Automatically record income from penalty
    await recordIncome({
      buildingId: demandData.buildingId,
      date: new Date(),
      amount: penaltyAmount,
      source: 'penalty',
      description: `Late payment penalty for ${demandData.flatNumber} - ${demandData.financialQuarterDisplayString}`,
      relatedInvoiceId: demandId,
      recordedByUid: demandData.issuedByUid
    })
  } catch (error) {
    console.error('Error applying late payment penalty:', error)
    throw error
  }
}

// Send reminder for service charge demand
export const sendReminder = async (demandId: string): Promise<void> => {
  try {
    const demandRef = doc(db, 'serviceChargeDemands', demandId)
    const demandSnap = await getDoc(demandRef)
    
    if (!demandSnap.exists()) {
      throw new Error('Service charge demand not found')
    }
    
    const demandData = demandSnap.data()
    const remindersSent = demandData.remindersSent || 0
    const maxReminders = demandData.remindersConfig?.maxReminders || 3
    
    if (remindersSent >= maxReminders) {
      throw new Error('Maximum reminders already sent')
    }
    
    // TODO: Implement actual email sending logic
    console.log(`Sending reminder for demand ${demandId} to resident ${demandData.residentName}`)
    
    await updateDoc(demandRef, {
      remindersSent: remindersSent + 1,
      lastReminderSent: serverTimestamp(),
      status: ServiceChargeDemandStatus.REMINDER_SENT,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error sending reminder:', error)
    throw error
  }
}

// Get global financial settings
export const getGlobalFinancialSettings = async (buildingId: string): Promise<GlobalFinancialSettings | null> => {
  try {
    const settingsRef = doc(db, 'globalFinancialSettings', buildingId)
    const settingsSnap = await getDoc(settingsRef)
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data()
      return {
        serviceChargeRatePerSqFt: data.serviceChargeRatePerSqFt,
        paymentDueLeadDays: data.paymentDueLeadDays,
        financialYearStartDate: data.financialYearStartDate?.toDate(),
        reserveFundContributionPercentage: data.reserveFundContributionPercentage,
        isBudgetLocked: data.isBudgetLocked,
        reminderPrioritySettings: data.reminderPrioritySettings
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting global financial settings:', error)
    throw error
  }
}

// Update global financial settings
export const updateGlobalFinancialSettings = async (
  buildingId: string, 
  settings: Partial<GlobalFinancialSettings>
): Promise<void> => {
  try {
    const settingsRef = doc(db, 'globalFinancialSettings', buildingId)
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating global financial settings:', error)
    throw error
  }
}

// Search service charge demands
export const searchServiceChargeDemands = async (
  buildingId: string, 
  searchTerm: string
): Promise<ServiceChargeDemand[]> => {
  try {
    const demands = await getServiceChargeDemands(buildingId)
    
    return demands.filter(demand => 
      demand.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demand.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demand.financialQuarterDisplayString?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching service charge demands:', error)
    throw error
  }
}

// Calculate penalty for overdue demand
export const calculatePenalty = (demand: ServiceChargeDemand, overdueDays: number): number => {
  const config = demand.penaltyConfig
  if (!config || overdueDays <= config.gracePeriodDays) {
    return 0
  }
  
  let penalty = 0
  
  if (config.type === 'flat' && config.flatAmount) {
    penalty = config.flatAmount
  } else if (config.type === 'percentage' && config.percentage) {
    penalty = (demand.outstandingAmount * config.percentage) / 100
  } else if (config.type === 'both') {
    const flatPenalty = config.flatAmount || 0
    const percentagePenalty = config.percentage ? (demand.outstandingAmount * config.percentage) / 100 : 0
    penalty = flatPenalty + percentagePenalty
  }
  
  if (config.maxPenaltyAmount && penalty > config.maxPenaltyAmount) {
    penalty = config.maxPenaltyAmount
  }
  
  return penalty
}

// Check and apply penalties for overdue demands
export const checkAndApplyPenalties = async (buildingId: string): Promise<void> => {
  try {
    const overdueDemands = await getOverdueServiceCharges(buildingId)
    const today = new Date()
    
    for (const demand of overdueDemands) {
      const overdueDays = Math.floor((today.getTime() - demand.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const penaltyAmount = calculatePenalty(demand, overdueDays)
      
      if (penaltyAmount > 0) {
        await applyLatePaymentPenalty(demand.id, penaltyAmount)
      }
    }
  } catch (error) {
    console.error('Error checking and applying penalties:', error)
    throw error
  }
}

// Enhanced Income Tracking Functions

// Record income entry
export const recordIncome = async (incomeData: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<Income> => {
  try {
    const incomeRef = collection(db, 'income')
    const newIncome = {
      ...incomeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(incomeRef, newIncome)
    
    return {
      id: docRef.id,
      ...incomeData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error recording income:', error)
    throw error
  }
}

// Get income entries for a building
export const getIncomeEntries = async (buildingId: string, startDate?: Date, endDate?: Date): Promise<Income[]> => {
  try {
    const incomeRef = collection(db, 'income')
    let q = query(
      incomeRef,
      where('buildingId', '==', buildingId)
    )
    
    if (startDate && endDate) {
      q = query(
        incomeRef,
        where('buildingId', '==', buildingId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
    }
    
    const querySnapshot = await getDocs(q)
    const incomeEntries: Income[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      incomeEntries.push({
        id: doc.id,
        buildingId: data.buildingId,
        date: data.date?.toDate(),
        amount: data.amount,
        source: data.source,
        description: data.description,
        relatedInvoiceId: data.relatedInvoiceId,
        recordedByUid: data.recordedByUid,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort in memory by date descending
    return incomeEntries.sort((a, b) => {
      const dateA = a.date || new Date(0)
      const dateB = b.date || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error('Error getting income entries:', error)
    throw error
  }
}

// Get income statistics for a building
export const getIncomeStats = async (buildingId: string, period?: string): Promise<any> => {
  try {
    const incomeEntries = await getIncomeEntries(buildingId)
    
    const stats = {
      totalIncome: incomeEntries.reduce((sum, entry) => sum + entry.amount, 0),
      bySource: {} as Record<string, number>,
      recentEntries: incomeEntries.slice(0, 10)
    }
    
    // Group by source
    incomeEntries.forEach(entry => {
      stats.bySource[entry.source] = (stats.bySource[entry.source] || 0) + entry.amount
    })
    
    return stats
  } catch (error) {
    console.error('Error getting income stats:', error)
    throw error
  }
}

// Enhanced Expenditure Tracking Functions

// Record expenditure entry
export const recordExpenditure = async (expenditureData: Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expenditure> => {
  try {
    const expenditureRef = collection(db, 'expenditure')
    const newExpenditure = {
      ...expenditureData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(expenditureRef, newExpenditure)
    
    return {
      id: docRef.id,
      ...expenditureData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error recording expenditure:', error)
    throw error
  }
}

// Get expenditure entries for a building
export const getExpenditureEntries = async (buildingId: string, startDate?: Date, endDate?: Date): Promise<Expenditure[]> => {
  try {
    const expenditureRef = collection(db, 'expenditure')
    let q = query(
      expenditureRef,
      where('buildingId', '==', buildingId)
    )
    
    if (startDate && endDate) {
      q = query(
        expenditureRef,
        where('buildingId', '==', buildingId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
    }
    
    const querySnapshot = await getDocs(q)
    const expenditureEntries: Expenditure[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      expenditureEntries.push({
        id: doc.id,
        buildingId: data.buildingId,
        date: data.date?.toDate(),
        amount: data.amount,
        category: data.category,
        description: data.description,
        tag: data.tag,
        supportingDocumentUrl: data.supportingDocumentUrl,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        recordedByUid: data.recordedByUid,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort in memory by date descending
    return expenditureEntries.sort((a, b) => {
      const dateA = a.date || new Date(0)
      const dateB = b.date || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error('Error getting expenditure entries:', error)
    throw error
  }
}

// Get expenditure statistics for a building
export const getExpenditureStats = async (buildingId: string, period?: string): Promise<any> => {
  try {
    const expenditureEntries = await getExpenditureEntries(buildingId)
    
    const stats = {
      totalExpenditure: expenditureEntries.reduce((sum, entry) => sum + entry.amount, 0),
      byCategory: {} as Record<string, number>,
      maintenanceBreakdown: {
        proactive: 0,
        reactive: 0
      },
      recentEntries: expenditureEntries.slice(0, 10)
    }
    
    // Group by category
    expenditureEntries.forEach(entry => {
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + entry.amount
      
      // Track maintenance breakdown
      if (entry.category.includes('maintenance') && entry.tag) {
        stats.maintenanceBreakdown[entry.tag] += entry.amount
      }
    })
    
    return stats
  } catch (error) {
    console.error('Error getting expenditure stats:', error)
    throw error
  }
}

// Get building financial summary
export const getBuildingFinancialSummary = async (buildingId: string, period: string): Promise<BuildingFinancialSummary> => {
  try {
    const [incomeStats, expenditureStats] = await Promise.all([
      getIncomeStats(buildingId, period),
      getExpenditureStats(buildingId, period)
    ])
    
    const summary: BuildingFinancialSummary = {
      buildingId,
      period,
      totalIncome: incomeStats.totalIncome,
      totalExpenditure: expenditureStats.totalExpenditure,
      netCashFlow: incomeStats.totalIncome - expenditureStats.totalExpenditure,
      incomeBreakdown: incomeStats.bySource,
      expenditureBreakdown: expenditureStats.byCategory,
      maintenanceBreakdown: expenditureStats.maintenanceBreakdown,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return summary
  } catch (error) {
    console.error('Error getting building financial summary:', error)
    throw error
  }
} 