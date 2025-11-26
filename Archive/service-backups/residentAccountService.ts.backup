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
  PaymentAllocation,
  EnhancedPaymentRecord
} from '../types'

// ===== RESIDENT ACCOUNT MANAGEMENT =====

/**
 * Get or create a resident account ledger for a flat
 */
export const getOrCreateResidentAccount = async (
  flatId: string,
  buildingId: string,
  flatNumber: string,
  residentName: string,
  residentUid?: string
): Promise<ResidentAccountLedger> => {
  try {
    // First try to find existing account
    const q = query(
      collection(db, 'residentAccountLedgers'),
      where('flatId', '==', flatId),
      where('buildingId', '==', buildingId),
      where('isActive', '==', true)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      // Return existing account
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps
        accountOpenedDate: doc.data().accountOpenedDate?.toDate?.() || new Date(doc.data().accountOpenedDate),
        accountClosedDate: doc.data().accountClosedDate?.toDate?.() || null,
        lastTransactionDate: doc.data().lastTransactionDate?.toDate?.() || null,
        lastStatementDate: doc.data().lastStatementDate?.toDate?.() || null,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      } as ResidentAccountLedger
    }
    
    // Create new account if none exists
    const newAccount: Omit<ResidentAccountLedger, 'id' | 'createdAt' | 'updatedAt'> = {
      buildingId,
      flatId,
      flatNumber,
      residentUid,
      residentName,
      
      // Initialize balances
      currentBalance: 0,
      totalChargedLifetime: 0,
      totalPaidLifetime: 0,
      
      // Initialize credit management
      availableCredit: 0,
      pendingCreditApplications: [],
      creditHistory: [],
      
      // Default auto-application settings
      autoApplyCreditToFutureCharges: true,
      creditApplicationPreference: 'full',
      minimumCreditThreshold: 5.00, // Don't apply credits under £5
      
      // Account settings
      isActive: true,
      accountOpenedDate: new Date()
    }
    
    const docRef = await addDoc(collection(db, 'residentAccountLedgers'), {
      ...newAccount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return {
      id: docRef.id,
      ...newAccount,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
  } catch (error) {
    console.error('Error getting/creating resident account:', error)
    throw error
  }
}

/**
 * Get resident account by flat ID
 */
export const getResidentAccountByFlatId = async (flatId: string): Promise<ResidentAccountLedger | null> => {
  try {
    const q = query(
      collection(db, 'residentAccountLedgers'),
      where('flatId', '==', flatId),
      where('isActive', '==', true)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps
      accountOpenedDate: doc.data().accountOpenedDate?.toDate?.() || new Date(doc.data().accountOpenedDate),
      accountClosedDate: doc.data().accountClosedDate?.toDate?.() || null,
      lastTransactionDate: doc.data().lastTransactionDate?.toDate?.() || null,
      lastStatementDate: doc.data().lastStatementDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    } as ResidentAccountLedger
    
  } catch (error) {
    console.error('Error getting resident account by flat ID:', error)
    throw error
  }
}

/**
 * Get all resident accounts for a building
 */
export const getResidentAccountsByBuilding = async (buildingId: string): Promise<ResidentAccountLedger[]> => {
  try {
    console.log('Fetching resident accounts for building:', buildingId)
    
    // First try with orderBy, if that fails, try without orderBy
    let querySnapshot
    try {
      const q = query(
        collection(db, 'residentAccountLedgers'),
        where('buildingId', '==', buildingId),
        where('isActive', '==', true),
        orderBy('flatNumber', 'asc')
      )
      querySnapshot = await getDocs(q)
    } catch (indexError) {
      console.warn('OrderBy query failed, trying without orderBy:', indexError)
      // Fallback query without orderBy if index doesn't exist
      const q = query(
        collection(db, 'residentAccountLedgers'),
        where('buildingId', '==', buildingId),
        where('isActive', '==', true)
      )
      querySnapshot = await getDocs(q)
    }
    
    console.log('Found', querySnapshot.docs.length, 'resident account documents')
    
    const accounts = querySnapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Processing account document:', doc.id, data)
      
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps safely
        accountOpenedDate: data.accountOpenedDate?.toDate?.() || new Date(data.accountOpenedDate || Date.now()),
        accountClosedDate: data.accountClosedDate?.toDate?.() || null,
        lastTransactionDate: data.lastTransactionDate?.toDate?.() || null,
        lastStatementDate: data.lastStatementDate?.toDate?.() || null,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
        
        // Ensure required fields have defaults
        currentBalance: data.currentBalance || 0,
        availableCredit: data.availableCredit || 0,
        totalChargedLifetime: data.totalChargedLifetime || 0,
        totalPaidLifetime: data.totalPaidLifetime || 0,
        flatNumber: data.flatNumber || '',
        residentName: data.residentName || 'Unknown Resident',
        buildingId: data.buildingId || buildingId,
        isActive: data.isActive !== false // Default to true if undefined
      }
    }) as ResidentAccountLedger[]
    
    // Sort on client side if we couldn't use orderBy
    accounts.sort((a, b) => {
      const flatA = a.flatNumber?.toLowerCase() || ''
      const flatB = b.flatNumber?.toLowerCase() || ''
      return flatA.localeCompare(flatB)
    })
    
    console.log('Processed', accounts.length, 'resident accounts')
    return accounts
    
  } catch (error) {
    console.error('Error getting resident accounts by building:', error)
    // Return empty array instead of throwing to prevent UI crash
    return []
  }
}

/**
 * Update resident account details
 */
export const updateResidentAccount = async (
  accountId: string, 
  updates: Partial<ResidentAccountLedger>
): Promise<void> => {
  try {
    const docRef = doc(db, 'residentAccountLedgers', accountId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating resident account:', error)
    throw error
  }
}

// ===== ACCOUNT TRANSACTION MANAGEMENT =====

/**
 * Add a transaction to an account and update running balance
 */
export const addAccountTransaction = async (
  transaction: Omit<AccountTransaction, 'id' | 'balanceAfter' | 'createdAt'>
): Promise<string> => {
  try {
    // Get current account to calculate new balance
    const accountDoc = await getDoc(doc(db, 'residentAccountLedgers', transaction.accountLedgerId))
    if (!accountDoc.exists()) {
      throw new Error('Account not found')
    }
    
    const account = accountDoc.data() as ResidentAccountLedger
    
    // Calculate new balance based on transaction type
    let balanceChange = 0
    switch (transaction.type) {
      case 'charge':
      case 'penalty':
        balanceChange = transaction.amount // Increases what resident owes
        break
      case 'payment':
      case 'credit':
      case 'refund':
        balanceChange = -transaction.amount // Decreases what resident owes
        break
      case 'adjustment':
        // Adjustments can be positive or negative based on description
        // For now, we'll assume positive adjustments increase the balance
        balanceChange = transaction.amount
        break
    }
    
    const newBalance = account.currentBalance + balanceChange
    
    // Create the transaction
    const transactionData = {
      ...transaction,
      balanceAfter: newBalance,
      processedAt: new Date(),
      isReversed: false,
      createdAt: serverTimestamp()
    }
    
    // Use batch to ensure atomicity
    const batch = writeBatch(db)
    
    // Add transaction
    const transactionRef = doc(collection(db, 'accountTransactions'))
    batch.set(transactionRef, transactionData)
    
    // Update account balance
    const accountRef = doc(db, 'residentAccountLedgers', transaction.accountLedgerId)
    batch.update(accountRef, {
      currentBalance: newBalance,
      lastTransactionId: transactionRef.id,
      lastTransactionDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    await batch.commit()
    
    return transactionRef.id
    
  } catch (error) {
    console.error('Error adding account transaction:', error)
    throw error
  }
}

/**
 * Get transaction history for an account
 */
export const getAccountTransactionHistory = async (
  accountLedgerId: string,
  limit: number = 50
): Promise<AccountTransaction[]> => {
  try {
    const q = query(
      collection(db, 'accountTransactions'),
      where('accountLedgerId', '==', accountLedgerId),
      orderBy('processedAt', 'desc'),
      // Note: Firebase queries with limit need to be handled on client side if limit is provided
    )
    
    const querySnapshot = await getDocs(q)
    let transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps
      processedAt: doc.data().processedAt?.toDate?.() || new Date(doc.data().processedAt),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    })) as AccountTransaction[]
    
    // Apply limit on client side
    if (limit > 0) {
      transactions = transactions.slice(0, limit)
    }
    
    return transactions
    
  } catch (error) {
    console.error('Error getting account transaction history:', error)
    throw error
  }
}

// ===== CREDIT MANAGEMENT =====

/**
 * Process a payment and handle overpayments as credits
 */
export const processPaymentWithCredits = async (
  accountLedgerId: string,
  paymentAmount: number,
  paymentMethod: string,
  paymentReference: string,
  demandAllocations: PaymentAllocation[],
  recordedBy: string
): Promise<{
  paymentId: string
  transactionId: string
  overpaymentAmount: number
  allocations: PaymentAllocation[]
}> => {
  try {
    const account = await getDoc(doc(db, 'residentAccountLedgers', accountLedgerId))
    if (!account.exists()) {
      throw new Error('Account not found')
    }
    
    const accountData = account.data() as ResidentAccountLedger
    
    // Calculate total allocated amount
    const totalAllocated = demandAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0)
    const overpaymentAmount = Math.max(0, paymentAmount - totalAllocated)
    
    // Use batch for atomicity
    const batch = writeBatch(db)
    
    // Create payment record
    const paymentRef = doc(collection(db, 'payments'))
    const paymentData = {
      accountLedgerId,
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentReference,
      allocations: demandAllocations,
      overpaymentAmount,
      isOverpayment: overpaymentAmount > 0,
      refundableAmount: overpaymentAmount,
      refundRequested: false,
      refundProcessed: false,
      recordedBy,
      recordedAt: serverTimestamp()
    }
    batch.set(paymentRef, paymentData)
    
    // Add payment transaction
    const paymentTransactionRef = doc(collection(db, 'accountTransactions'))
    const paymentTransactionData = {
      accountLedgerId,
      buildingId: accountData.buildingId,
      flatNumber: accountData.flatNumber,
      residentName: accountData.residentName,
      type: 'payment' as const,
      amount: paymentAmount,
      description: `Payment received - ${paymentMethod}`,
      reference: paymentReference,
      relatedPaymentId: paymentRef.id,
      processedAt: new Date(),
      processedBy: recordedBy,
      isReversed: false,
      balanceAfter: 0, // Will be calculated in addAccountTransaction
      createdAt: serverTimestamp()
    }
    batch.set(paymentTransactionRef, paymentTransactionData)
    
    // If there's an overpayment, update account credit
    if (overpaymentAmount > 0) {
      // Update account credit
      batch.update(doc(db, 'residentAccountLedgers', accountLedgerId), {
        availableCredit: accountData.availableCredit + overpaymentAmount,
        updatedAt: serverTimestamp()
      })
      
      // Add credit history entry
      const creditHistoryRef = doc(collection(db, 'creditHistory'))
      batch.set(creditHistoryRef, {
        accountLedgerId,
        action: 'credit_created',
        amount: overpaymentAmount,
        relatedPeriod: 'Current Payment',
        relatedTransactionId: paymentTransactionRef.id,
        description: `Credit created from overpayment of £${overpaymentAmount.toFixed(2)}`,
        processedAt: serverTimestamp(),
        processedBy: recordedBy
      })
    }
    
    await batch.commit()
    
    return {
      paymentId: paymentRef.id,
      transactionId: paymentTransactionRef.id,
      overpaymentAmount,
      allocations: demandAllocations
    }
    
  } catch (error) {
    console.error('Error processing payment with credits:', error)
    throw error
  }
}

/**
 * Update account credit balance
 */
export const updateAccountCreditBalance = async (
  accountLedgerId: string,
  creditChange: number
): Promise<void> => {
  try {
    const accountDoc = await getDoc(doc(db, 'residentAccountLedgers', accountLedgerId))
    if (!accountDoc.exists()) {
      throw new Error('Account not found')
    }
    
    const account = accountDoc.data() as ResidentAccountLedger
    const newCreditBalance = Math.max(0, account.availableCredit + creditChange)
    
    await updateDoc(doc(db, 'residentAccountLedgers', accountLedgerId), {
      availableCredit: newCreditBalance,
      updatedAt: serverTimestamp()
    })
    
  } catch (error) {
    console.error('Error updating account credit balance:', error)
    throw error
  }
}

/**
 * Add credit history entry
 */
export const addCreditHistoryEntry = async (
  entry: Omit<CreditHistoryEntry, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'creditHistory'), {
      ...entry,
      processedAt: serverTimestamp()
    })
    
    return docRef.id
    
  } catch (error) {
    console.error('Error adding credit history entry:', error)
    throw error
  }
}

/**
 * Get accounts with available credits for a building
 */
export const getAccountsWithCredits = async (buildingId: string): Promise<ResidentAccountLedger[]> => {
  try {
    const q = query(
      collection(db, 'residentAccountLedgers'),
      where('buildingId', '==', buildingId),
      where('isActive', '==', true),
      where('availableCredit', '>', 0)
    )
    
    const querySnapshot = await getDocs(q)
    const accounts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps
      accountOpenedDate: doc.data().accountOpenedDate?.toDate?.() || new Date(doc.data().accountOpenedDate),
      accountClosedDate: doc.data().accountClosedDate?.toDate?.() || null,
      lastTransactionDate: doc.data().lastTransactionDate?.toDate?.() || null,
      lastStatementDate: doc.data().lastStatementDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    })) as ResidentAccountLedger[]
    
    return accounts
    
  } catch (error) {
    console.error('Error getting accounts with credits:', error)
    throw error
  }
}

/**
 * Generate account summary statistics for a building
 */
export const generateAccountSummaryStats = async (buildingId: string) => {
  try {
    const accounts = await getResidentAccountsByBuilding(buildingId)
    
    const totalAccounts = accounts.length
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const totalCredits = accounts.reduce((sum, acc) => sum + acc.availableCredit, 0)
    const accountsWithCredits = accounts.filter(acc => acc.availableCredit > 0).length
    const accountsWithDebit = accounts.filter(acc => acc.currentBalance > 0).length
    
    const avgBalance = totalAccounts > 0 ? totalBalance / totalAccounts : 0
    const avgCredit = totalAccounts > 0 ? totalCredits / totalAccounts : 0
    
    return {
      totalAccounts,
      totalBalance,
      totalCredits,
      accountsWithCredits,
      accountsWithDebit,
      avgBalance,
      avgCredit,
      accounts: accounts.map(acc => ({
        id: acc.id,
        flatNumber: acc.flatNumber,
        residentName: acc.residentName,
        currentBalance: acc.currentBalance,
        availableCredit: acc.availableCredit,
        autoApplyCreditToFutureCharges: acc.autoApplyCreditToFutureCharges
      }))
    }
    
  } catch (error) {
    console.error('Error generating account summary stats:', error)
    throw error
  }
}

// Export service object for consistent import pattern
export const residentAccountService = {
  // Account management
  getOrCreateResidentAccount,
  getResidentAccountByFlatId,
  getResidentAccountsByBuilding: getResidentAccountsByBuilding,
  getResidentLedgersByBuilding: getResidentAccountsByBuilding, // Alias for UI consistency
  updateResidentAccount,
  
  // Transaction management
  addAccountTransaction,
  getAccountTransactionHistory,
  
  // Credit management
  processPaymentWithCredits,
  updateAccountCreditBalance,
  addCreditHistoryEntry,
  getAccountsWithCredits,
  
  // Statistics
  generateAccountSummaryStats
}
