import { CreditCard, FileText, AlertCircle, CheckCircle, Clock, History, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useBuilding } from '../contexts/BuildingContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getResidentAccountByFlatId } from '../services/residentAccountService'
import { getPeopleByBuilding } from '../services/peopleService'
import { ResidentAccountLedger, ServiceChargeDemand } from '../types'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const ResidentPayments: React.FC = () => {
  const { currentUser } = useAuth()
  const { selectedBuilding } = useBuilding()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<ResidentAccountLedger | null>(null)
  const [flatNumber, setFlatNumber] = useState<string>('')
  const [primaryResidentName, setPrimaryResidentName] = useState<string>('')
  const [overdueDemands, setOverdueDemands] = useState<ServiceChargeDemand[]>([])
  const [upcomingDemands, setUpcomingDemands] = useState<ServiceChargeDemand[]>([])

  useEffect(() => {
    loadResidentPaymentData()
  }, [currentUser, selectedBuilding])

  const loadResidentPaymentData = async () => {
    if (!currentUser || !selectedBuilding) return

    try {
      setLoading(true)

      // TODO: Add authorization check for financial data access
      // Currently any resident linked to a flat can see all payment data.
      // Future implementation should:
      // 1. Add `canViewFinancials` boolean field to Person type
      // 2. Check if personRecord.canViewFinancials === true before loading data
      // 3. Default to true for isPrimaryContact, false for others
      // 4. Allow admins to grant/revoke this permission per person
      // This ensures only authorized residents (owners, primary contacts) can view financial data

      // Get resident's person record to find their flat
      const people = await getPeopleByBuilding(selectedBuilding.id)
      const personRecord = people.find(p => p.uid === currentUser.id)

      if (!personRecord || !personRecord.flatId) {
        addNotification({
          title: 'No Flat Assignment',
          message: 'Your account is not associated with a flat. Please contact management.',
          type: 'warning',
          userId: currentUser.id
        })
        setLoading(false)
        return
      }

      setFlatNumber(personRecord.flatNumber || '')
      
      // Use the current logged-in user's name
      setPrimaryResidentName(personRecord.name)

      // Get resident account ledger for their flat
      const ledger = await getResidentAccountByFlatId(personRecord.flatId)
      setAccount(ledger)

      // Get service charge demands for this flat to check overdue status
      const demandsRef = collection(db, 'serviceChargeDemands')
      
      // Try with both where clauses first, if index doesn't exist, fall back to single where
      let demandsSnapshot
      try {
        const demandsQuery = query(
          demandsRef,
          where('flatId', '==', personRecord.flatId),
          where('buildingId', '==', selectedBuilding.id)
        )
        demandsSnapshot = await getDocs(demandsQuery)
      } catch (indexError: any) {
        // Fallback: query by flatId only if composite index doesn't exist
        const fallbackQuery = query(
          demandsRef,
          where('flatId', '==', personRecord.flatId)
        )
        demandsSnapshot = await getDocs(fallbackQuery)
      }
      
      const now = new Date()
      const overdue: ServiceChargeDemand[] = []
      const upcoming: ServiceChargeDemand[] = []
      
      demandsSnapshot.forEach(doc => {
        const demand = { id: doc.id, ...doc.data() } as any
        const dueDate = demand.dueDate?.toDate?.() || new Date(demand.dueDate)
        const outstanding = demand.outstandingAmount || 0
        
        const demandObj = {
          ...demand,
          dueDate,
          issuedDate: demand.issuedDate?.toDate?.() || new Date(demand.issuedDate),
          createdAt: demand.createdAt?.toDate?.() || new Date(demand.createdAt),
          updatedAt: demand.updatedAt?.toDate?.() || new Date(demand.updatedAt)
        }
        
        // Categorize demands by due date
        if (outstanding > 0) {
          if (dueDate < now) {
            overdue.push(demandObj)
          } else {
            upcoming.push(demandObj)
          }
        }
      })
      
      setOverdueDemands(overdue)
      setUpcomingDemands(upcoming)

    } catch (error) {
      console.error('Error loading resident payment data:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load payment information',
        type: 'error',
        userId: currentUser?.id
      })
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Payment Information Available</h2>
            <p className="text-neutral-600">
              Your payment account has not been set up yet. Please contact building management.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isOverdue = overdueDemands.length > 0
  const hasUpcoming = upcomingDemands.length > 0
  const hasCredit = account.availableCredit > 0
  const hasTransactions = account.transactions && account.transactions.length > 0
  const totalOverdueAmount = overdueDemands.reduce((sum, d) => sum + d.outstandingAmount, 0)
  const totalUpcomingAmount = upcomingDemands.reduce((sum, d) => sum + d.outstandingAmount, 0)
  const nextDueDate = upcomingDemands.length > 0 
    ? upcomingDemands.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0].dueDate
    : null

  // Sort transactions by date (most recent first)
  const sortedTransactions = hasTransactions 
    ? [...account.transactions].sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())
    : []

  // Helper to get transaction icon and color
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'payment':
      case 'credit':
        return { icon: ArrowDownCircle, color: 'text-success-600', bgColor: 'bg-success-50', label: 'Credit' }
      case 'charge':
      case 'penalty':
        return { icon: ArrowUpCircle, color: 'text-danger-600', bgColor: 'bg-danger-50', label: 'Debit' }
      case 'refund':
        return { icon: DollarSign, color: 'text-primary-600', bgColor: 'bg-primary-50', label: 'Refund' }
      case 'adjustment':
        return { icon: FileText, color: 'text-neutral-600', bgColor: 'bg-neutral-50', label: 'Adjustment' }
      default:
        return { icon: FileText, color: 'text-neutral-600', bgColor: 'bg-neutral-50', label: type }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Payments</h1>
          <p className="text-neutral-600">Flat {flatNumber}</p>
        </div>

        {/* Upcoming Payment Notice */}
        {!isOverdue && hasUpcoming && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary-900">Upcoming Payment{upcomingDemands.length !== 1 ? 's' : ''}</h3>
                <p className="text-sm text-primary-700 mt-1">
                  You have {upcomingDemands.length} upcoming payment{upcomingDemands.length !== 1 ? 's' : ''} totaling £{totalUpcomingAmount.toFixed(2)}.
                </p>
                <div className="mt-3 space-y-2">
                  {upcomingDemands.map(demand => (
                    <div key={demand.id} className="flex justify-between text-xs text-primary-600">
                      <span>{demand.financialQuarterDisplayString}</span>
                      <span className="font-medium">£{demand.outstandingAmount.toFixed(2)} - Due {demand.dueDate.toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Overdue Notice */}
        {isOverdue && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-danger-900">Payment Overdue</h3>
                <p className="text-sm text-danger-700 mt-1">
                  You have {overdueDemands.length} overdue payment{overdueDemands.length !== 1 ? 's' : ''} totaling £{totalOverdueAmount.toFixed(2)}. 
                  Please make a payment as soon as possible to avoid any late fees.
                </p>
                <div className="mt-3 space-y-2">
                  {overdueDemands.map(demand => (
                    <div key={demand.id} className="flex justify-between text-xs text-danger-600">
                      <span>{demand.financialQuarterDisplayString}</span>
                      <span className="font-medium">£{demand.outstandingAmount.toFixed(2)} - Due {demand.dueDate.toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Account Information</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-sm text-neutral-600">Flat Number</span>
              <span className="text-sm font-medium text-neutral-900">{account.flatNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-sm text-neutral-600">Primary Resident</span>
              <span className="text-sm font-medium text-neutral-900">{primaryResidentName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-sm text-neutral-600">Payment Reference</span>
              <span className="text-sm font-mono font-medium text-primary-600">Flat {account.flatNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-sm text-neutral-600">Account Opened</span>
              <span className="text-sm font-medium text-neutral-900">
                {account.accountOpenedDate?.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-neutral-600">Account Status</span>
              <span className={`text-sm font-medium ${account.isActive ? 'text-success-600' : 'text-neutral-400'}`}>
                {account.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        {hasTransactions && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <History className="h-5 w-5 text-neutral-600" />
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Transaction History</h2>
                <p className="text-sm text-neutral-600">Complete payment history for this flat</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {sortedTransactions.map((transaction) => {
                const style = getTransactionStyle(transaction.type)
                const Icon = style.icon
                const isDebit = transaction.type === 'charge' || transaction.type === 'penalty'
                
                return (
                  <div 
                    key={transaction.id} 
                    className="flex items-start justify-between p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${style.bgColor} p-2 rounded-lg mt-1`}>
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-neutral-900">
                            {transaction.description}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${style.bgColor} ${style.color} font-medium`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mb-1">
                          {transaction.reference}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span>{transaction.processedAt.toLocaleDateString()}</span>
                          {transaction.isReversed && (
                            <span className="text-danger-600 font-medium">(Reversed)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className={`text-lg font-bold ${
                        isDebit ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {isDebit ? '+' : '-'}£{transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Balance: £{transaction.balanceAfter.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {sortedTransactions.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        )}


        {/* Credit Information */}
        {hasCredit && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Credit Settings</h2>
            <p className="text-neutral-600 text-sm mb-4">
              You have £{account.availableCredit.toFixed(2)} in credit on your account.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span className="text-sm text-neutral-700">
                  Credit will be {account.autoApplyCreditToFutureCharges ? 'automatically' : 'manually'} applied to future charges
                </span>
              </div>
              {account.minimumCreditThreshold && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-700">
                    Credits under £{account.minimumCreditThreshold.toFixed(2)} will not be auto-applied
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResidentPayments
