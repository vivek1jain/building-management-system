import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  writeBatch,
  doc,
  updateDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  FlatLedgerTransaction,
  FlatLedgerTransactionType,
  FlatLedgerTransactionStatus,
  ServiceChargeDemand,
  PaymentRecord
} from '../types'
import { handleServiceError } from '../utils/errorHandling'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { flatLedgerService } from './flatLedgerService'

/**
 * Orchestration service for flat ledger syncing
 * Provides high-level, safe coordination of ledger writes with proper linking and recalculation
 * 
 * Design principles:
 * - No mock data fallbacks - strict Firestore sources only
 * - Comprehensive logging with [LedgerSync] prefix
 * - Atomic operations with proper error handling
 * - Links payments to demands via serviceChargeDemandId
 */

/**
 * Sync a service charge demand to the flat ledger
 * Creates a debit transaction for the demand and recalculates running balances
 */
export const syncDemandFromServiceCharge = async (
  demand: ServiceChargeDemand,
  createdBy: string
): Promise<void> => {
  try {
    await flatLedgerService.syncServiceChargeDemandToLedger(demand, createdBy)
    await flatLedgerService.recalculateRunningBalances(demand.flatId)
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to sync demand', {
      demandId: demand.id,
      flatId: demand.flatId,
      error
    })
    throw error
  }
}

/**
 * Record a payment for a specific service charge demand
 * Creates a credit transaction linked to the demand via serviceChargeDemandId
 */
export const recordPaymentForDemand = async (params: {
  demand: ServiceChargeDemand
  amount: number
  processedAt: Date
  method: string
  reference?: string
  notes?: string
  createdBy: string
}): Promise<void> => {
  const { demand, amount, processedAt, method, reference, notes, createdBy } = params
  
  try {
    // Create payment transaction with serviceChargeDemandId link
    const paymentReference = reference || `PAY-${demand.flatNumber}-${Date.now()}`
    const paymentNotes = notes || `Payment via ${method}`
    
    await flatLedgerService.createLedgerTransaction({
      flatId: demand.flatId,
      buildingId: demand.buildingId,
      flatNumber: demand.flatNumber,
      residentName: demand.residentName || `Resident of ${demand.flatNumber}`,
      type: FlatLedgerTransactionType.PAYMENT,
      status: FlatLedgerTransactionStatus.PROCESSED,
      description: `Payment - ${demand.financialQuarterDisplayString}`,
      reference: paymentReference,
      debitAmount: 0,
      creditAmount: amount,
      runningBalance: 0, // Will be calculated
      transactionDate: processedAt,
      processedDate: processedAt,
      quarter: demand.financialQuarterDisplayString,
      period: demand.financialQuarterDisplayString,
      category: 'Payment',
      notes: paymentNotes,
      createdBy,
      serviceChargeDemandId: demand.id // Critical link for matching in summaries
    })
    
    // Recalculate running balances
    await flatLedgerService.recalculateRunningBalances(demand.flatId)
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to record payment', {
      demandId: demand.id,
      flatId: demand.flatId,
      amount,
      error
    })
    throw error
  }
}

/**
 * Reverse a service charge demand in the ledger
 * Used when demands are cancelled or need to be reissued
 */
export const reverseServiceChargeDemand = async (
  demand: ServiceChargeDemand,
  reversedBy: string,
  reason?: string
): Promise<void> => {
  try {
    // Find all ledger transactions for this demand
    const q = query(
      collection(db, 'flatLedgerTransactions'),
      where('serviceChargeDemandId', '==', demand.id),
      where('type', '==', FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.warn('[LedgerSync] ⚠️ No ledger transactions found for demand', {
        demandId: demand.id
      })
      return
    }
    
    // Update status to REVERSED
    const updatePromises = snapshot.docs.map(docSnapshot => {
      const notes = reason 
        ? `Reversed: ${reason}` 
        : `Reversed by ${reversedBy}`
      
      return updateDoc(doc(db, 'flatLedgerTransactions', docSnapshot.id), {
        status: FlatLedgerTransactionStatus.REVERSED,
        notes,
        updatedAt: new Date()
      })
    })
    
    await Promise.all(updatePromises)
    
    // Recalculate running balances
    await flatLedgerService.recalculateRunningBalances(demand.flatId)
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to reverse demand', {
      demandId: demand.id,
      flatId: demand.flatId,
      error
    })
    throw error
  }
}

/**
 * Apply a credit to a flat's ledger
 * Used for manual credit adjustments, refunds, etc.
 */
export const applyCreditToFlat = async (params: {
  flatId: string
  buildingId: string
  flatNumber: string
  residentName: string
  amount: number
  description: string
  createdBy: string
}): Promise<void> => {
  const { flatId, buildingId, flatNumber, residentName, amount, description, createdBy } = params
  
  try {
    await flatLedgerService.createLedgerTransaction({
      flatId,
      buildingId,
      flatNumber,
      residentName,
      type: FlatLedgerTransactionType.CREDIT_APPLICATION,
      status: FlatLedgerTransactionStatus.PROCESSED,
      description,
      reference: `CREDIT-${flatNumber}-${Date.now()}`,
      debitAmount: 0,
      creditAmount: amount,
      runningBalance: 0, // Will be calculated
      transactionDate: new Date(),
      processedDate: new Date(),
      category: 'Credit',
      createdBy
    })
    
    // Recalculate running balances
    await flatLedgerService.recalculateRunningBalances(flatId)
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to apply credit', {
      flatId,
      flatNumber,
      amount,
      error
    })
    throw error
  }
}

/**
 * Recalculate running balances for a flat
 * Can be called independently or as part of other operations
 */
export const recalcAndSnapshotFlat = async (flatId: string): Promise<void> => {
  try {
    await flatLedgerService.recalculateRunningBalances(flatId)
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to recalculate balances', {
      flatId,
      error
    })
    throw error
  }
}

/**
 * Get statement data for a flat using flat ledger as source of truth
 * Returns comprehensive summary and transaction history for reporting
 */
export const getStatementDataForFlat = async (
  flatId: string,
  buildingId: string,
  flatNumber: string,
  residentName: string,
  dateFrom: Date,
  dateTo: Date
): Promise<{
  summary: any
  transactions: any[]
}> => {
  try {
    // Get transactions within date range
    const transactions = await flatLedgerService.getFlatLedgerTransactions(
      flatId,
      {
        dateFrom,
        dateTo,
        includeReversed: false
      },
      1000
    )
    
    // Get comprehensive summary
    const summary = await flatLedgerService.generateFlatLedgerSummary(
      flatId,
      buildingId,
      flatNumber,
      residentName
    )
    
    return {
      summary,
      transactions
    }
  } catch (error) {
    handleServiceError('[LedgerStatement] ❌ Failed to fetch statement data', {
      flatId,
      flatNumber,
      error
    })
    throw error
  }
}

/**
 * Get current balances for all flats in a building from FlatLedger
 * Returns a map of flatId -> currentBalance
 */
export const getFlatBalancesForBuilding = async (
  buildingId: string
): Promise<Map<string, number>> => {
  try {
    const balances = new Map<string, number>()
    
    // Query all transactions for this building (simplified query to avoid index requirements)
    const q = query(
      collection(db, 'flatLedgerTransactions'),
      where('buildingId', '==', buildingId),
      orderBy('transactionDate', 'desc')
    )
    
    const snapshot = await getDocs(q)
    
    // Get the most recent non-reversed transaction for each flat to get current balance
    const flatLatestTx = new Map<string, { date: Date, balance: number }>()
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const flatId = data.flatId
      
      // Skip reversed transactions
      if (data.status === FlatLedgerTransactionStatus.REVERSED) {
        return
      }
      
      const txDate = data.transactionDate?.toDate?.() || new Date(data.transactionDate)
      const currentEntry = flatLatestTx.get(flatId)
      
      // Keep the most recent transaction per flat
      if (!currentEntry || txDate > currentEntry.date) {
        flatLatestTx.set(flatId, {
          date: txDate,
          balance: data.runningBalance || 0
        })
      }
    })
    
    // Build the final balance map
    flatLatestTx.forEach((entry, flatId) => {
      balances.set(flatId, entry.balance)
    })
    
    return balances
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to fetch flat balances', { buildingId, error })
    throw error
  }
}

/**
 * Clear all flat ledger transactions for a building
 * Use this before re-running backfill to avoid duplicates
 */
export const clearFlatLedgerForBuilding = async (
  buildingId: string
): Promise<void> => {
  try {
    const q = query(
      collection(db, 'flatLedgerTransactions'),
      where('buildingId', '==', buildingId)
    )
    
    const snapshot = await getDocs(q)
    
    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500
    let deletedCount = 0
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchDocs = snapshot.docs.slice(i, i + batchSize)
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      deletedCount += batchDocs.length
    }
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Failed to clear ledger', { buildingId, error })
    throw error
  }
}

/**
 * Backfill ledger entries for existing service charge demands
 * Use this once to sync historical data
 */
export const backfillDemandsToLedger = async (
  buildingId: string,
  createdBy: string
): Promise<void> => {
  try {
    // Import here to avoid circular dependency
    const { getServiceChargeDemands } = await import('./serviceChargeService')
    
    // Get all demands for the building
    const demands = await getServiceChargeDemands(buildingId)
    
    let syncedDemands = 0;
    let syncedPayments = 0
    let errors = 0
    
    for (const demand of demands) {
      try {
        // Sync the demand itself
        await syncDemandFromServiceCharge(demand, createdBy)
        syncedDemands++
        
        // Sync any payments for this demand
        if (demand.paymentHistory && demand.paymentHistory.length > 0) {
          for (const payment of demand.paymentHistory) {
            try {
              await recordPaymentForDemand({
                demand,
                amount: payment.amount,
                processedAt: payment.paymentDate,
                method: payment.method,
                reference: payment.reference,
                notes: payment.notes,
                createdBy: payment.recordedByUid || createdBy
              })
              syncedPayments++
            } catch (paymentError) {
              handleServiceError('[LedgerSync] Failed to backfill payment', {
                demandId: demand.id,
                paymentId: payment.paymentId,
                error: paymentError
              })
              errors++
            }
          }
        }
      } catch (error) {
        handleServiceError('[LedgerSync] Failed to backfill demand', {
          demandId: demand.id,
          error
        })
        errors++
      }
    }
  } catch (error) {
    handleServiceError('[LedgerSync] ❌ Backfill failed', {
      buildingId,
      error
    })
    throw error
  }
}


// Export service object for consistent import pattern
export const flatLedgerSyncService = {
  syncDemandFromServiceCharge,
  recordPaymentForDemand,
  reverseServiceChargeDemand,
  applyCreditToFlat,
  recalcAndSnapshotFlat,
  getStatementDataForFlat,
  getFlatBalancesForBuilding,
  clearFlatLedgerForBuilding,
  backfillDemandsToLedger
}
