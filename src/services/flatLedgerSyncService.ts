import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  writeBatch,
  doc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  FlatLedgerTransaction,
  FlatLedgerTransactionType,
  FlatLedgerTransactionStatus,
  ServiceChargeDemand,
  PaymentRecord
} from '../types'
import { flatLedgerService } from './flatLedgerService'

/**
 * Synchronize existing service charge demands and payments to flat ledger
 */
export const syncExistingDataToFlatLedger = async (buildingId: string, userId: string): Promise<void> => {
  console.log('Starting flat ledger data synchronization...')
  
  try {
    // Get all service charge demands for the building
    const demandsQuery = query(
      collection(db, 'serviceChargeDemands'),
      where('buildingId', '==', buildingId),
      orderBy('issuedDate', 'desc')
    )
    
    const demandsSnapshot = await getDocs(demandsQuery)
    const demands = demandsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceChargeDemand[]

    console.log(`Found ${demands.length} service charge demands to sync`)

    // Process each demand
    for (const demand of demands) {
      try {
        // Sync the service charge demand
        await flatLedgerService.syncServiceChargeDemandToLedger(demand, userId)
        
        // If there are payments, sync them too
        if (demand.paymentHistory && demand.paymentHistory.length > 0) {
          for (const payment of demand.paymentHistory) {
            // Create a mock AccountTransaction from PaymentRecord
            const accountTransaction = {
              id: payment.paymentId || `payment-${Date.now()}`,
              accountLedgerId: `ledger-${demand.flatId}`,
              buildingId: demand.buildingId,
              flatNumber: demand.flatNumber,
              residentName: demand.residentName || 'Unknown',
              type: 'payment' as const,
              amount: payment.amount,
              description: `Payment for ${demand.financialQuarterDisplayString}`,
              reference: payment.reference || `PAY-${payment.paymentId}`,
              balanceAfter: 0, // Will be calculated
              processedAt: payment.paymentDate,
              processedBy: userId,
              isReversed: false,
              createdAt: payment.paymentDate
            }
            
            await flatLedgerService.syncPaymentToLedger(accountTransaction, demand.flatId, userId)
          }
        }
        
        console.log(`Synced demand ${demand.id} for flat ${demand.flatNumber}`)
      } catch (error) {
        console.error(`Error syncing demand ${demand.id}:`, error)
      }
    }

    console.log('Flat ledger synchronization completed successfully')
  } catch (error) {
    console.error('Error during flat ledger synchronization:', error)
    throw error
  }
}

/**
 * Create sample transactions for testing (if no real data exists)
 */
export const createSampleLedgerData = async (buildingId: string, userId: string): Promise<void> => {
  console.log('Creating sample flat ledger data...')
  
  const batch = writeBatch(db)
  const currentDate = new Date()
  
  // Sample flats
  const sampleFlats = [
    { flatId: 'flat-1a', flatNumber: '1A', residentName: 'John Smith' },
    { flatId: 'flat-2a', flatNumber: '2A', residentName: 'Resident of 2A' },
    { flatId: 'flat-1b', flatNumber: '1B', residentName: 'Sarah Johnson' }
  ]

  for (const flat of sampleFlats) {
    // Create transactions for the past 6 months
    for (let i = 5; i >= 0; i--) {
      const transactionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 15)
      const quarter = `Q${Math.floor((transactionDate.getMonth()) / 3) + 1} ${transactionDate.getFullYear()}`
      
      // Service charge demand
      const demandId = `sample-demand-${flat.flatId}-${i}`
      const demandAmount = 450 + Math.random() * 100
      
      const demandTransaction: Omit<FlatLedgerTransaction, 'id'> = {
        flatId: flat.flatId,
        buildingId,
        flatNumber: flat.flatNumber,
        residentName: flat.residentName,
        type: FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND,
        status: FlatLedgerTransactionStatus.PROCESSED,
        description: `Service Charge Demand - ${quarter}`,
        reference: `SC-${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${flat.flatNumber}`,
        debitAmount: demandAmount,
        creditAmount: 0,
        runningBalance: 0, // Will be calculated
        transactionDate,
        dueDate: new Date(transactionDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        quarter,
        period: quarter,
        category: 'Service Charge',
        createdBy: userId,
        createdAt: transactionDate,
        updatedAt: transactionDate,
        serviceChargeDemandId: demandId
      }
      
      const demandDocRef = doc(collection(db, 'flatLedgerTransactions'))
      batch.set(demandDocRef, demandTransaction)
      
      // Payment (usually a few days after demand)
      if (Math.random() > 0.2) { // 80% chance of payment
        const paymentDelay = Math.floor(Math.random() * 15) + 5 // 5-20 days
        const paymentDate = new Date(transactionDate.getTime() + paymentDelay * 24 * 60 * 60 * 1000)
        const paymentAmount = Math.random() > 0.1 ? demandAmount : demandAmount * 0.7 // 90% full payment
        
        if (paymentDate <= currentDate) {
          const paymentTransaction: Omit<FlatLedgerTransaction, 'id'> = {
            flatId: flat.flatId,
            buildingId,
            flatNumber: flat.flatNumber,
            residentName: flat.residentName,
            type: FlatLedgerTransactionType.PAYMENT,
            status: FlatLedgerTransactionStatus.PROCESSED,
            description: `Payment - ${quarter}`,
            reference: `PAY-${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${flat.flatNumber}`,
            debitAmount: 0,
            creditAmount: paymentAmount,
            runningBalance: 0, // Will be calculated
            transactionDate: paymentDate,
            processedDate: paymentDate,
            quarter,
            period: quarter,
            category: 'Payment',
            createdBy: userId,
            createdAt: paymentDate,
            updatedAt: paymentDate,
            paymentId: `sample-payment-${flat.flatId}-${i}`
          }
          
          const paymentDocRef = doc(collection(db, 'flatLedgerTransactions'))
          batch.set(paymentDocRef, paymentTransaction)
        }
      }
    }
  }
  
  await batch.commit()
  
  // Calculate running balances for each flat
  for (const flat of sampleFlats) {
    await flatLedgerService.recalculateRunningBalances(flat.flatId)
  }
  
  console.log('Sample flat ledger data created successfully')
}

/**
 * Initialize flat ledger data for a building
 */
export const initializeFlatLedgerData = async (buildingId: string, userId: string): Promise<void> => {
  try {
    // First try to sync existing data
    await syncExistingDataToFlatLedger(buildingId, userId)
    
    // Check if we have any transactions
    const transactionsQuery = query(
      collection(db, 'flatLedgerTransactions'),
      where('buildingId', '==', buildingId)
    )
    
    const transactionsSnapshot = await getDocs(transactionsQuery)
    
    // If no transactions exist, create sample data
    if (transactionsSnapshot.empty) {
      console.log('No existing transactions found, creating sample data...')
      await createSampleLedgerData(buildingId, userId)
    }
    
    console.log('Flat ledger initialization completed')
  } catch (error) {
    console.error('Error initializing flat ledger data:', error)
    throw error
  }
}
