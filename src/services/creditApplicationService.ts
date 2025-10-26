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
  ResidentAccountLedger,
  AccountTransaction,
  CreditApplication,
  CreditHistoryEntry,
  ServiceChargeDemand,
  ServiceChargeDemandStatus
} from '../types'
import { handleServiceError } from '../utils/errorHandling'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { 
  getResidentAccountByFlatId, 
  addAccountTransaction, 
  updateAccountCreditBalance,
  addCreditHistoryEntry
} from './residentAccountService'

// Helper function to generate a unique ID
const generateId = () => {
  return `cred-${  Date.now()  }-${  Math.floor(Math.random() * 1000000)}`
}

/**
 * Calculate how much credit to apply based on account preferences
 */
export const calculateCreditApplication = (
  availableCredit: number,
  demandAmount: number,
  preference: 'full' | 'partial' | 'manual',
  minimumThreshold: number
): number => {
  if (availableCredit < minimumThreshold) {
    return 0 // Don't apply if below threshold
  }
  
  switch (preference) {
    case 'full':
      // Apply all available credit (up to the demand amount)
      return Math.min(availableCredit, demandAmount)
      
    case 'partial':
      // Apply only enough to cover half the demand (or all credit if less)
      const partialTarget = demandAmount * 0.5
      return Math.min(availableCredit, partialTarget)
      
    case 'manual':
      // Don't auto-apply, wait for manual action
      return 0
      
    default:
      return Math.min(availableCredit, demandAmount)
  }
}

/**
 * Find source period for credit (for history tracking)
 */
export const findCreditSourcePeriod = (account: ResidentAccountLedger): string => {
  // If there's a credit history, use the latest one
  if (account.creditHistory && account.creditHistory.length > 0) {
    const sortedHistory = [...account.creditHistory].sort((a, b) => {
      const dateA = a.processedAt instanceof Date ? a.processedAt : new Date(a.processedAt)
      const dateB = b.processedAt instanceof Date ? b.processedAt : new Date(b.processedAt)
      return dateB.getTime() - dateA.getTime()
    })
    
    return sortedHistory[0].relatedPeriod || 'Previous Period'
  }
  
  return 'Previous Period'
}

/**
 * Find source payment for credit (for history tracking)
 */
export const findCreditSourcePayment = (account: ResidentAccountLedger): string => {
  // If there's a credit history, use the latest one
  if (account.creditHistory && account.creditHistory.length > 0) {
    const sortedHistory = [...account.creditHistory].sort((a, b) => {
      const dateA = a.processedAt instanceof Date ? a.processedAt : new Date(a.processedAt)
      const dateB = b.processedAt instanceof Date ? b.processedAt : new Date(b.processedAt)
      return dateB.getTime() - dateA.getTime()
    })
    
    return sortedHistory[0].relatedTransactionId || 'unknown'
  }
  
  return 'unknown'
}

/**
 * Apply credit to a demand from an account
 * 
 * @param account The resident account with available credit
 * @param demand The service charge demand to apply credit to
 * @param targetPeriod The period string for the demand (e.g., "Q2 2024")
 * @returns The updated demand with credit applied
 */
export const applyCreditToDemand = async (
  account: ResidentAccountLedger,
  demand: ServiceChargeDemand,
  targetPeriod: string,
  userId: string
): Promise<ServiceChargeDemand> => {
  try {
    // Calculate how much credit to apply
    const creditToApply = calculateCreditApplication(
      account.availableCredit,
      demand.totalAmountDue,
      account.creditApplicationPreference,
      account.minimumCreditThreshold
    )
    
    if (creditToApply <= 0) {
      return demand // No credit to apply
    }
    
    // Create credit application record
    const creditApplication: CreditApplication = {
      id: generateId(),
      accountLedgerId: account.id,
      sourcePeriod: findCreditSourcePeriod(account),
      sourcePaymentId: findCreditSourcePayment(account),
      originalCreditAmount: creditToApply,
      targetDemandId: demand.id,
      targetPeriod,
      appliedAmount: creditToApply,
      applicationMethod: 'automatic',
      appliedAt: new Date(),
      appliedBy: userId,
      status: 'applied',
      createdAt: new Date()
    }
    
    // Prepare the updated demand with credit applied
    const updatedDemand: ServiceChargeDemand = {
      ...demand,
      
      // Store original amount for reference
      originalAmountBeforeCredit: demand.totalAmountDue,
      
      // Adjust financial amounts
      amountPaid: (demand.amountPaid || 0) + creditToApply,
      outstandingAmount: Math.max(0, demand.totalAmountDue - creditToApply),
      
      // Add credit application info
      hasCreditApplied: true,
      creditAppliedAmount: creditToApply,
      creditApplications: [...(demand.creditApplications || []), creditApplication],
      
      // Update notes
      notes: `${demand.notes || ''}\n🎯 Credit Applied: £${creditToApply.toFixed(2)} from previous overpayment`.trim(),
      
      // Update status if applicable
      status: demand.totalAmountDue <= creditToApply 
        ? ServiceChargeDemandStatus.PAID 
        : ServiceChargeDemandStatus.PARTIALLY_PAID,
        
      // Set references to account
      accountLedgerId: account.id
    }
    
    // Use batch write for atomicity
    const batch = writeBatch(db)
    
    // Update the demand in Firestore
    const demandRef = doc(db, 'serviceChargeDemands', demand.id)
    batch.update(demandRef, {
      originalAmountBeforeCredit: updatedDemand.originalAmountBeforeCredit,
      amountPaid: updatedDemand.amountPaid,
      outstandingAmount: updatedDemand.outstandingAmount,
      hasCreditApplied: true,
      creditAppliedAmount: creditToApply,
      creditApplications: [...(demand.creditApplications || []), creditApplication],
      notes: updatedDemand.notes,
      status: updatedDemand.status,
      accountLedgerId: account.id,
      updatedAt: serverTimestamp()
    })
    
    // Update account credit balance
    const accountRef = doc(db, 'residentAccountLedgers', account.id)
    batch.update(accountRef, {
      availableCredit: Math.max(0, account.availableCredit - creditToApply),
      updatedAt: serverTimestamp()
    })
    
    // Record the credit application in credit history
    const creditHistoryRef = doc(collection(db, 'creditHistory'))
    const creditHistoryEntry: Omit<CreditHistoryEntry, 'id'> = {
      accountLedgerId: account.id,
      action: 'credit_applied',
      amount: creditToApply,
      relatedPeriod: targetPeriod,
      relatedTransactionId: creditApplication.id,
      description: `Applied £${creditToApply.toFixed(2)} credit to ${targetPeriod} service charge`,
      processedAt: new Date(),
      processedBy: userId
    }
    batch.set(creditHistoryRef, {
      ...creditHistoryEntry,
      processedAt: serverTimestamp()
    })
    
    // Add transaction records to account ledger
    const creditTransactionRef = doc(collection(db, 'accountTransactions'))
    const creditTransactionData = {
      accountLedgerId: account.id,
      buildingId: account.buildingId,
      flatNumber: account.flatNumber,
      residentName: account.residentName,
      type: 'credit' as const,
      amount: creditToApply,
      description: `Credit applied to ${targetPeriod} service charge demand`,
      reference: `Credit-${creditApplication.id}`,
      relatedDemandId: demand.id,
      processedAt: new Date(),
      processedBy: userId,
      isReversed: false,
      balanceAfter: 0, // Will be calculated later
      createdAt: serverTimestamp()
    }
    batch.set(creditTransactionRef, creditTransactionData)
    
    // Execute all operations atomically
    await batch.commit()
    
    // Return the updated demand
    return updatedDemand
    
  } catch (error) {
    handleServiceError('Error applying credit to demand:', error)
    throw error
  }
}

/**
 * Apply available credits to a list of service charge demands
 * 
 * @param buildingId The building ID
 * @param period The period string for the demands (e.g., "Q2 2024")
 * @param demands List of service charge demands
 * @param userId The user ID applying the credits
 * @returns Updated list of demands with credits applied
 */
export const applyCreditsToNewDemands = async (
  buildingId: string,
  period: string,
  demands: ServiceChargeDemand[],
  userId: string
): Promise<ServiceChargeDemand[]> => {
  try {
    const updatedDemands: ServiceChargeDemand[] = []
    
    // Process each demand sequentially to ensure credit balances are accurate
    for (const demand of demands) {
      // Get resident account for this flat
      const account = await getResidentAccountByFlatId(demand.flatId)
      
      // If account exists and has available credit, apply it
      if (account && account.availableCredit > 0 && account.autoApplyCreditToFutureCharges) {
        const updatedDemand = await applyCreditToDemand(account, demand, period, userId)
        updatedDemands.push(updatedDemand)
      } else {
        // No account or no credit available, keep demand as is
        updatedDemands.push(demand)
      }
    }
    
    return updatedDemands
    
  } catch (error) {
    handleServiceError('Error applying credits to demands:', error)
    throw error
  }
}

/**
 * Manually apply credit to a demand
 */
export const manuallyApplyCreditToDemand = async (
  accountId: string,
  demandId: string,
  amountToApply: number,
  userId: string
): Promise<ServiceChargeDemand> => {
  try {
    // Get account and demand
    const [accountDoc, demandDoc] = await Promise.all([
      getDoc(doc(db, 'residentAccountLedgers', accountId)),
      getDoc(doc(db, 'serviceChargeDemands', demandId))
    ])
    
    if (!accountDoc.exists()) {
      throw new Error('Account not found')
    }
    
    if (!demandDoc.exists()) {
      throw new Error('Demand not found')
    }
    
    const account = {
      id: accountDoc.id,
      ...accountDoc.data(),
      // Convert Firestore timestamps
      accountOpenedDate: accountDoc.data().accountOpenedDate?.toDate?.() || new Date(accountDoc.data().accountOpenedDate),
      accountClosedDate: accountDoc.data().accountClosedDate?.toDate?.() || null,
      lastTransactionDate: accountDoc.data().lastTransactionDate?.toDate?.() || null,
      lastStatementDate: accountDoc.data().lastStatementDate?.toDate?.() || null,
      createdAt: accountDoc.data().createdAt?.toDate?.() || new Date(accountDoc.data().createdAt),
      updatedAt: accountDoc.data().updatedAt?.toDate?.() || new Date(accountDoc.data().updatedAt)
    } as ResidentAccountLedger
    
    const demand = {
      id: demandDoc.id,
      ...demandDoc.data(),
      // Convert Firestore timestamps
      dueDate: demandDoc.data().dueDate?.toDate?.() || new Date(demandDoc.data().dueDate),
      issuedDate: demandDoc.data().issuedDate?.toDate?.() || new Date(demandDoc.data().issuedDate),
      createdAt: demandDoc.data().createdAt?.toDate?.() || new Date(demandDoc.data().createdAt),
      updatedAt: demandDoc.data().updatedAt?.toDate?.() || new Date(demandDoc.data().updatedAt)
    } as ServiceChargeDemand
    
    // Validate credit amount
    if (amountToApply <= 0) {
      throw new Error('Credit amount must be greater than zero')
    }
    
    if (amountToApply > account.availableCredit) {
      throw new Error('Not enough available credit')
    }
    
    // Apply credit with manual method
    const creditApplication: CreditApplication = {
      id: generateId(),
      accountLedgerId: account.id,
      sourcePeriod: findCreditSourcePeriod(account),
      sourcePaymentId: findCreditSourcePayment(account),
      originalCreditAmount: amountToApply,
      targetDemandId: demand.id,
      targetPeriod: demand.financialQuarterDisplayString,
      appliedAmount: amountToApply,
      applicationMethod: 'manual',
      appliedAt: new Date(),
      appliedBy: userId,
      status: 'applied',
      createdAt: new Date()
    }
    
    // Prepare updated demand
    const updatedDemand: ServiceChargeDemand = {
      ...demand,
      
      // Store original amount for reference
      originalAmountBeforeCredit: demand.totalAmountDue,
      
      // Adjust financial amounts
      amountPaid: (demand.amountPaid || 0) + amountToApply,
      outstandingAmount: Math.max(0, demand.totalAmountDue - (demand.amountPaid || 0) - amountToApply),
      
      // Add credit application info
      hasCreditApplied: true,
      creditAppliedAmount: (demand.creditAppliedAmount || 0) + amountToApply,
      creditApplications: [...(demand.creditApplications || []), creditApplication],
      
      // Update notes
      notes: `${demand.notes || ''}\n💰 Credit Manually Applied: £${amountToApply.toFixed(2)} on ${new Date().toLocaleDateString()}`.trim(),
      
      // Update status if applicable
      status: demand.totalAmountDue <= ((demand.amountPaid || 0) + amountToApply)
        ? ServiceChargeDemandStatus.PAID 
        : ServiceChargeDemandStatus.PARTIALLY_PAID,
        
      // Set references to account
      accountLedgerId: account.id
    }
    
    // Use batch write for atomicity
    const batch = writeBatch(db)
    
    // Update the demand in Firestore
    const demandRef = doc(db, 'serviceChargeDemands', demand.id)
    batch.update(demandRef, {
      originalAmountBeforeCredit: updatedDemand.originalAmountBeforeCredit,
      amountPaid: updatedDemand.amountPaid,
      outstandingAmount: updatedDemand.outstandingAmount,
      hasCreditApplied: true,
      creditAppliedAmount: updatedDemand.creditAppliedAmount,
      creditApplications: updatedDemand.creditApplications,
      notes: updatedDemand.notes,
      status: updatedDemand.status,
      accountLedgerId: account.id,
      updatedAt: serverTimestamp()
    })
    
    // Update account credit balance
    const accountRef = doc(db, 'residentAccountLedgers', account.id)
    batch.update(accountRef, {
      availableCredit: Math.max(0, account.availableCredit - amountToApply),
      updatedAt: serverTimestamp()
    })
    
    // Record the credit application in credit history
    const creditHistoryRef = doc(collection(db, 'creditHistory'))
    const creditHistoryEntry: Omit<CreditHistoryEntry, 'id'> = {
      accountLedgerId: account.id,
      action: 'credit_applied',
      amount: amountToApply,
      relatedPeriod: demand.financialQuarterDisplayString,
      relatedTransactionId: creditApplication.id,
      description: `Manually applied £${amountToApply.toFixed(2)} credit to ${demand.financialQuarterDisplayString} service charge`,
      processedAt: new Date(),
      processedBy: userId
    }
    batch.set(creditHistoryRef, {
      ...creditHistoryEntry,
      processedAt: serverTimestamp()
    })
    
    // Add transaction records to account ledger
    const creditTransactionRef = doc(collection(db, 'accountTransactions'))
    const creditTransactionData = {
      accountLedgerId: account.id,
      buildingId: account.buildingId,
      flatNumber: account.flatNumber,
      residentName: account.residentName,
      type: 'credit' as const,
      amount: amountToApply,
      description: `Credit manually applied to ${demand.financialQuarterDisplayString} service charge demand`,
      reference: `Credit-${creditApplication.id}`,
      relatedDemandId: demand.id,
      processedAt: new Date(),
      processedBy: userId,
      isReversed: false,
      balanceAfter: 0, // Will be calculated later
      createdAt: serverTimestamp()
    }
    batch.set(creditTransactionRef, creditTransactionData)
    
    // Execute all operations atomically
    await batch.commit()
    
    // Return the updated demand
    return updatedDemand
    
  } catch (error) {
    handleServiceError('Error manually applying credit to demand:', error)
    throw error
  }
}

/**
 * Get credit application history for a building
 */
export const getCreditApplicationHistory = async (buildingId: string): Promise<CreditApplication[]> => {
  try {
    // First get all resident accounts for this building
    const accountsQuery = query(
      collection(db, 'residentAccountLedgers'),
      where('buildingId', '==', buildingId)
    )
    
    const accountsSnapshot = await getDocs(accountsQuery)
    const accountIds = accountsSnapshot.docs.map(doc => doc.id)
    
    // Firestore doesn't support array-contains-any across different fields
    // So we'll need to do multiple queries and combine results
    const creditApplications: CreditApplication[] = []
    
    // Query credit history collection for all accounts
    const creditHistoryQuery = query(
      collection(db, 'creditHistory'),
      where('accountLedgerId', 'in', accountIds),
      orderBy('processedAt', 'desc')
    )
    
    const creditHistorySnapshot = await getDocs(creditHistoryQuery)
    
    // Create application objects from history entries
    creditHistorySnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.action === 'credit_applied') {
        creditApplications.push({
          id: data.relatedTransactionId,
          accountLedgerId: data.accountLedgerId,
          sourcePeriod: data.sourcePeriod || 'Unknown Source',
          sourcePaymentId: data.relatedTransactionId,
          originalCreditAmount: data.amount,
          targetDemandId: data.relatedDemandId || 'Unknown Demand',
          targetPeriod: data.relatedPeriod,
          appliedAmount: data.amount,
          applicationMethod: 'manual', // Default to manual for historical entries
          appliedAt: data.processedAt?.toDate?.() || new Date(data.processedAt),
          appliedBy: data.processedBy,
          status: 'applied',
          notes: data.description,
          createdAt: data.processedAt?.toDate?.() || new Date(data.processedAt)
        })
      }
    })
    
    return creditApplications
    
  } catch (error) {
    handleServiceError('Error getting credit application history:', error)
    throw error
  }
}
