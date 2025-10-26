import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  FlatLedgerTransaction,
  FlatLedgerTransactionType,
  FlatLedgerTransactionStatus,
  FlatLedgerSummary,
  FlatLedgerFilter,
  FlatLedgerReport,
  ServiceChargeDemand,
  AccountTransaction
} from '../types'
import { handleServiceError } from '../utils/errorHandling'
import { fromFirestoreTimestamp } from '../utils/firestore'

// ===== FLAT LEDGER MANAGEMENT =====

/**
 * Create a new ledger transaction
 */
export const createLedgerTransaction = async (
  transactionData: Omit<FlatLedgerTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FlatLedgerTransaction> => {
  try {
    const docRef = await addDoc(collection(db, 'flatLedgerTransactions'), {
      ...transactionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return {
      id: docRef.id,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    handleServiceError('Error creating ledger transaction:', error)
    throw error
  }
}

/**
 * Get all transactions for a specific flat
 */
export const getFlatLedgerTransactions = async (
  flatId: string,
  filter?: FlatLedgerFilter,
  pageSize: number = 50
): Promise<FlatLedgerTransaction[]> => {
  try {
    let q = query(
      collection(db, 'flatLedgerTransactions'),
      where('flatId', '==', flatId),
      orderBy('transactionDate', 'desc')
    )

    // Apply filters
    if (filter) {
      if (filter.dateFrom) {
        q = query(q, where('transactionDate', '>=', filter.dateFrom))
      }
      if (filter.dateTo) {
        q = query(q, where('transactionDate', '<=', filter.dateTo))
      }
      if (filter.transactionTypes && filter.transactionTypes.length > 0) {
        q = query(q, where('type', 'in', filter.transactionTypes))
      }
      if (filter.status && filter.status.length > 0) {
        q = query(q, where('status', 'in', filter.status))
      }
    }

    q = query(q, limit(pageSize))

    const snapshot = await getDocs(q)
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      transactionDate: doc.data().transactionDate?.toDate?.() || new Date(doc.data().transactionDate),
      dueDate: doc.data().dueDate?.toDate?.() || null,
      processedDate: doc.data().processedDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    })) as FlatLedgerTransaction[]

    // Apply client-side filters that can't be done in Firestore
    let filteredTransactions = transactions

    if (filter) {
      if (filter.minAmount !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => 
          (t.debitAmount + t.creditAmount) >= filter.minAmount!
        )
      }
      if (filter.maxAmount !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => 
          (t.debitAmount + t.creditAmount) <= filter.maxAmount!
        )
      }
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase()
        filteredTransactions = filteredTransactions.filter(t => 
          t.description.toLowerCase().includes(searchLower) ||
          t.reference.toLowerCase().includes(searchLower) ||
          t.notes?.toLowerCase().includes(searchLower)
        )
      }
      if (filter.quarters && filter.quarters.length > 0) {
        filteredTransactions = filteredTransactions.filter(t => 
          t.quarter && filter.quarters!.includes(t.quarter)
        )
      }
      if (!filter.includeReversed) {
        filteredTransactions = filteredTransactions.filter(t => 
          t.status !== FlatLedgerTransactionStatus.REVERSED
        )
      }
    }

    return filteredTransactions
  } catch (error) {
    handleServiceError('Error getting flat ledger transactions:', error)
    throw error
  }
}

/**
 * Generate flat ledger summary
 */
export const generateFlatLedgerSummary = async (
  flatId: string,
  buildingId: string,
  flatNumber: string,
  residentName: string
): Promise<FlatLedgerSummary> => {
  try {
    const transactions = await getFlatLedgerTransactions(flatId, {
      includeReversed: false
    }, 1000) // Get more transactions for accurate summary

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
    
    // Calculate totals
    const totalDemands = transactions
      .filter(t => t.type === FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND || 
                   t.type === FlatLedgerTransactionType.GROUND_RENT_DEMAND ||
                   t.type === FlatLedgerTransactionType.PENALTY)
      .reduce((sum, t) => sum + t.debitAmount, 0)

    const totalPayments = transactions
      .filter(t => t.type === FlatLedgerTransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.creditAmount, 0)

    const totalCredits = transactions
      .filter(t => t.type === FlatLedgerTransactionType.CREDIT_APPLICATION)
      .reduce((sum, t) => sum + t.creditAmount, 0)

    const totalPenalties = transactions
      .filter(t => t.type === FlatLedgerTransactionType.PENALTY)
      .reduce((sum, t) => sum + t.debitAmount, 0)

    const currentBalance = transactions.length > 0 ? transactions[0].runningBalance : 0

    // Transaction counts
    const demandsCount = transactions.filter(t => 
      t.type === FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND || 
      t.type === FlatLedgerTransactionType.GROUND_RENT_DEMAND
    ).length

    const paymentsCount = transactions.filter(t => 
      t.type === FlatLedgerTransactionType.PAYMENT
    ).length

    const creditsCount = transactions.filter(t => 
      t.type === FlatLedgerTransactionType.CREDIT_APPLICATION
    ).length

    // Date analysis
    const paymentTransactions = transactions.filter(t => 
      t.type === FlatLedgerTransactionType.PAYMENT
    )
    const demandTransactions = transactions.filter(t => 
      t.type === FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND || 
      t.type === FlatLedgerTransactionType.GROUND_RENT_DEMAND
    )

    const lastPaymentDate = paymentTransactions.length > 0 
      ? paymentTransactions[0].transactionDate 
      : undefined

    const lastDemandDate = demandTransactions.length > 0 
      ? demandTransactions[0].transactionDate 
      : undefined

    // Quarter analysis
    const currentQuarterTransactions = transactions.filter(t => {
      const transactionYear = t.transactionDate.getFullYear()
      const transactionQuarter = Math.ceil((t.transactionDate.getMonth() + 1) / 3)
      return transactionYear === currentYear && transactionQuarter === currentQuarter
    })

    const previousQuarterTransactions = transactions.filter(t => {
      const transactionYear = t.transactionDate.getFullYear()
      const transactionQuarter = Math.ceil((t.transactionDate.getMonth() + 1) / 3)
      const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1
      const prevYear = currentQuarter === 1 ? currentYear - 1 : currentYear
      return transactionYear === prevYear && transactionQuarter === prevQuarter
    })

    const yearToDateTransactions = transactions.filter(t => 
      t.transactionDate.getFullYear() === currentYear
    )

    // Overdue analysis
    const overdueTransactions = transactions.filter(t => 
      t.dueDate && t.dueDate < now && t.debitAmount > 0 && 
      t.status === FlatLedgerTransactionStatus.PENDING
    )

    const overdueAmount = overdueTransactions.reduce((sum, t) => sum + t.debitAmount, 0)
    const oldestOverdue = overdueTransactions.reduce((oldest, t) => 
      !oldest || t.dueDate! < oldest.dueDate! ? t : oldest, 
      null as FlatLedgerTransaction | null
    )

    const daysOverdue = oldestOverdue 
      ? Math.floor((now.getTime() - oldestOverdue.dueDate!.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Payment reliability analysis
    const paidDemands = demandTransactions.filter(t => {
      const relatedPayment = paymentTransactions.find(p => 
        p.serviceChargeDemandId === t.serviceChargeDemandId
      )
      return relatedPayment !== undefined
    })

    const paymentTimes = paidDemands.map(demand => {
      const relatedPayment = paymentTransactions.find(p => 
        p.serviceChargeDemandId === demand.serviceChargeDemandId
      )
      if (relatedPayment && demand.dueDate) {
        return Math.floor((relatedPayment.transactionDate.getTime() - demand.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      }
      return 0
    }).filter(days => days !== 0)

    const averagePaymentTime = paymentTimes.length > 0 
      ? paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length
      : 0

    // Payment reliability score (0-100)
    const onTimePayments = paymentTimes.filter(days => days <= 0).length
    const paymentReliabilityScore = paymentTimes.length > 0 
      ? Math.round((onTimePayments / paymentTimes.length) * 100)
      : 100

    return {
      flatId,
      buildingId,
      flatNumber,
      residentName,
      currentBalance,
      totalDemands,
      totalPayments,
      totalCredits,
      totalPenalties,
      transactionCount: transactions.length,
      demandsCount,
      paymentsCount,
      creditsCount,
      lastTransactionDate: transactions.length > 0 ? transactions[0].transactionDate : now,
      lastPaymentDate,
      lastDemandDate,
      currentQuarterBalance: currentQuarterTransactions.reduce((sum, t) => 
        sum + t.creditAmount - t.debitAmount, 0
      ),
      previousQuarterBalance: previousQuarterTransactions.reduce((sum, t) => 
        sum + t.creditAmount - t.debitAmount, 0
      ),
      yearToDateBalance: yearToDateTransactions.reduce((sum, t) => 
        sum + t.creditAmount - t.debitAmount, 0
      ),
      overdueAmount,
      overdueCount: overdueTransactions.length,
      daysOverdue,
      averagePaymentTime,
      paymentReliabilityScore,
      generatedAt: now,
      lastUpdated: now
    }
  } catch (error) {
    handleServiceError('Error generating flat ledger summary:', error)
    throw error
  }
}

/**
 * Sync service charge demand to ledger
 */
export const syncServiceChargeDemandToLedger = async (
  demand: ServiceChargeDemand,
  createdBy: string
): Promise<void> => {
  try {
    // Check if transaction already exists
    const existingQuery = query(
      collection(db, 'flatLedgerTransactions'),
      where('serviceChargeDemandId', '==', demand.id),
      where('type', '==', FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND)
    )
    
    const existingSnapshot = await getDocs(existingQuery)
    
    if (!existingSnapshot.empty) {
      // Update existing transaction
      const existingDoc = existingSnapshot.docs[0]
      await updateDoc(existingDoc.ref, {
        debitAmount: demand.totalAmountDue,
        description: `Service Charge Demand - ${demand.financialQuarterDisplayString}`,
        dueDate: demand.dueDate,
        status: demand.outstandingAmount > 0 
          ? FlatLedgerTransactionStatus.PENDING 
          : FlatLedgerTransactionStatus.PROCESSED,
        updatedAt: serverTimestamp()
      })
    } else {
      // Create new transaction
      await createLedgerTransaction({
        flatId: demand.flatId,
        buildingId: demand.buildingId,
        flatNumber: demand.flatNumber,
        residentName: demand.residentName,
        type: FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND,
        status: FlatLedgerTransactionStatus.PENDING,
        description: `Service Charge Demand - ${demand.financialQuarterDisplayString}`,
        reference: demand.id,
        debitAmount: demand.totalAmountDue,
        creditAmount: 0,
        runningBalance: 0, // Will be calculated
        transactionDate: demand.issuedDate,
        dueDate: demand.dueDate,
        quarter: demand.financialQuarterDisplayString,
        period: demand.financialQuarterDisplayString,
        category: 'Service Charge',
        createdBy,
        serviceChargeDemandId: demand.id
      })
    }
  } catch (error) {
    handleServiceError('Error syncing service charge demand to ledger:', error)
    throw error
  }
}

/**
 * Sync payment to ledger
 */
export const syncPaymentToLedger = async (
  payment: AccountTransaction,
  flatId: string, // Pass flatId separately since AccountTransaction doesn't have it
  createdBy: string
): Promise<void> => {
  try {
    await createLedgerTransaction({
      flatId,
      buildingId: payment.buildingId,
      flatNumber: payment.flatNumber || 'Unknown',
      residentName: payment.residentName || 'Unknown',
      type: FlatLedgerTransactionType.PAYMENT,
      status: FlatLedgerTransactionStatus.PROCESSED,
      description: `Payment - ${payment.description || 'Payment received'}`,
      reference: payment.id,
      debitAmount: 0,
      creditAmount: payment.amount,
      runningBalance: 0, // Will be calculated
      transactionDate: payment.processedAt,
      processedDate: payment.processedAt,
      category: 'Payment',
      notes: payment.description, // Using description as notes
      createdBy,
      paymentId: payment.id
    })
  } catch (error) {
    handleServiceError('Error syncing payment to ledger:', error)
    throw error
  }
}

/**
 * Recalculate running balances for a flat
 */
export const recalculateRunningBalances = async (flatId: string): Promise<void> => {
  try {
    const transactions = await getFlatLedgerTransactions(flatId, {
      includeReversed: false
    }, 1000)

    // Sort by transaction date (oldest first)
    transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime())

    let runningBalance = 0
    const batch = writeBatch(db)

    for (const transaction of transactions) {
      runningBalance += transaction.creditAmount - transaction.debitAmount
      
      const transactionRef = doc(db, 'flatLedgerTransactions', transaction.id)
      batch.update(transactionRef, {
        runningBalance,
        updatedAt: serverTimestamp()
      })
    }

    await batch.commit()
  } catch (error) {
    handleServiceError('Error recalculating running balances:', error)
    throw error
  }
}

/**
 * Generate comprehensive flat ledger report
 */
export const generateFlatLedgerReport = async (
  flatId: string,
  buildingId: string,
  flatNumber: string,
  residentName: string,
  dateFrom: Date,
  dateTo: Date,
  generatedBy: string
): Promise<FlatLedgerReport> => {
  try {
    const filter: FlatLedgerFilter = {
      dateFrom,
      dateTo,
      includeReversed: false
    }

    const transactions = await getFlatLedgerTransactions(flatId, filter, 1000)
    const summary = await generateFlatLedgerSummary(flatId, buildingId, flatNumber, residentName)

    // Monthly breakdown
    const monthlyBreakdown = []
    const monthlyData: Record<string, { demands: number; payments: number; balance: number }> = {}

    transactions.forEach(t => {
      const monthKey = `${t.transactionDate.getFullYear()}-${String(t.transactionDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { demands: 0, payments: 0, balance: 0 }
      }

      if (t.type === FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND || 
          t.type === FlatLedgerTransactionType.GROUND_RENT_DEMAND) {
        monthlyData[monthKey].demands += t.debitAmount
      } else if (t.type === FlatLedgerTransactionType.PAYMENT) {
        monthlyData[monthKey].payments += t.creditAmount
      }
      
      monthlyData[monthKey].balance = t.runningBalance
    })

    Object.entries(monthlyData).forEach(([month, data]) => {
      monthlyBreakdown.push({
        month,
        demands: data.demands,
        payments: data.payments,
        balance: data.balance
      })
    })

    // Quarterly breakdown
    const quarterlyBreakdown = []
    const quarterlyData: Record<string, { demands: number; payments: number; balance: number }> = {}

    transactions.forEach(t => {
      const quarter = `Q${Math.ceil((t.transactionDate.getMonth() + 1) / 3)} ${t.transactionDate.getFullYear()}`
      
      if (!quarterlyData[quarter]) {
        quarterlyData[quarter] = { demands: 0, payments: 0, balance: 0 }
      }

      if (t.type === FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND || 
          t.type === FlatLedgerTransactionType.GROUND_RENT_DEMAND) {
        quarterlyData[quarter].demands += t.debitAmount
      } else if (t.type === FlatLedgerTransactionType.PAYMENT) {
        quarterlyData[quarter].payments += t.creditAmount
      }
      
      quarterlyData[quarter].balance = t.runningBalance
    })

    Object.entries(quarterlyData).forEach(([quarter, data]) => {
      quarterlyBreakdown.push({
        quarter,
        demands: data.demands,
        payments: data.payments,
        balance: data.balance
      })
    })

    // Generate insights
    const paymentPattern = summary.paymentReliabilityScore >= 90 ? 'excellent' :
                          summary.paymentReliabilityScore >= 75 ? 'good' :
                          summary.paymentReliabilityScore >= 50 ? 'fair' : 'poor'

    const paymentTransactions = transactions.filter(t => t.type === FlatLedgerTransactionType.PAYMENT)
    // AccountTransaction uses flatNumber instead of flatId for identification
    // We'll need to match by flatNumber and buildingId

    const largestTransaction = transactions.reduce((largest, t) => 
      (t.debitAmount + t.creditAmount) > (largest.debitAmount + largest.creditAmount) ? t : largest,
      transactions[0]
    )

    const mostCommonPaymentMethod = 'Bank Transfer' // This would need to be determined from payment data

    const recommendations = []
    if (summary.overdueAmount > 0) {
      recommendations.push(`Outstanding balance of £${summary.overdueAmount.toFixed(2)} needs attention`)
    }
    if (summary.averagePaymentTime > 7) {
      recommendations.push('Consider setting up automatic payments to improve payment timing')
    }
    if (summary.paymentReliabilityScore < 75) {
      recommendations.push('Payment history shows room for improvement')
    }

    return {
      flatId,
      buildingId,
      flatNumber,
      residentName,
      reportPeriod: {
        from: dateFrom,
        to: dateTo,
        description: `${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`
      },
      summary,
      transactions,
      monthlyBreakdown,
      quarterlyBreakdown,
      insights: {
        paymentPattern,
        averageDaysToPayment: Math.round(summary.averagePaymentTime),
        mostCommonPaymentMethod,
        largestTransaction,
        recommendations
      },
      generatedAt: new Date(),
      generatedBy,
      reportId: `${flatId}-${Date.now()}`
    }
  } catch (error) {
    handleServiceError('Error generating flat ledger report:', error)
    throw error
  }
}

// Export service object
export const flatLedgerService = {
  createLedgerTransaction,
  getFlatLedgerTransactions,
  generateFlatLedgerSummary,
  syncServiceChargeDemandToLedger,
  syncPaymentToLedger,
  recalculateRunningBalances,
  generateFlatLedgerReport
}
