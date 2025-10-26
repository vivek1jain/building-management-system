import { 
  FileText, 
  Download, 
  Search, 
  Users,
  Eye,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, Button, Input, Modal, ModalFooter, PageLoading, Dropdown, DropdownOption } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { useBuilding } from '../contexts/BuildingContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getFlatsByBuilding } from '../services/flatService';
import { 
  Flat
} from '../types';

type BalanceFilter = 'all' | 'positive' | 'negative' | 'zero';
type DateRange = '30d' | '90d' | '6m' | '1y' | 'custom';

interface StatementFilters {
  residents: string[];
  balanceType: BalanceFilter;
  dateRange: DateRange;
  customStartDate?: Date;
  customEndDate?: Date;
  includeTransactions: boolean;
}

const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { selectedBuildingId, selectedBuilding } = useBuilding();
  const location = useLocation();

  // Core state
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatBalances, setFlatBalances] = useState<Map<string, number>>(new Map());
  const [flatTransactions, setFlatTransactions] = useState<Map<string, any[]>>(new Map());
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StatementFilters>({
    residents: [],
    balanceType: 'all',
    dateRange: '1y',
    customStartDate: undefined,
    customEndDate: undefined,
    includeTransactions: true
  });
  
  // UI state
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [expandedLedgers, setExpandedLedgers] = useState<Set<string>>(new Set());

  // Dropdown options for balance filter
  const balanceFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Balances', description: 'Show all balance types' },
    { value: 'positive', label: 'Credit Balance (Positive)', description: 'Show positive balances only' },
    { value: 'negative', label: 'Debit Balance (Negative)', description: 'Show negative balances only' },
    { value: 'zero', label: 'Zero Balance', description: 'Show zero balances only' }
  ];

  // Dropdown options for date range
  const dateRangeOptions: DropdownOption[] = [
    { value: '30d', label: 'Last 30 Days', description: 'Past month' },
    { value: '90d', label: 'Last 90 Days', description: 'Past 3 months' },
    { value: '6m', label: 'Last 6 Months', description: 'Past 6 months' },
    { value: '1y', label: 'Last 12 Months', description: 'Past year' },
    { value: 'custom', label: 'Custom Range', description: 'Select custom date range' }
  ];

  // Load data when building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadReportsData();
    }
  }, [selectedBuildingId]);

  // Handle navigation from People page
  useEffect(() => {
    const navigationState = location.state as any;
    if (navigationState) {
      // Set search query if specified
      if (navigationState.searchQuery) {
        setSearchQuery(navigationState.searchQuery);
      }
      
      // Show notification about the resident account access
      if (navigationState.residentInfo) {
        const { name, flatId } = navigationState.residentInfo;
        addNotification({
          userId: currentUser?.id || '',
          title: 'Quick Account Access',
          message: `Showing account information for ${name} (${flatId}). Use the search and filters below to find their statement.`,
          type: 'info'
        });
      }
    }
  }, [location.state, addNotification, currentUser?.id]);

  const loadReportsData = async () => {
    if (!selectedBuildingId) return;
    
    try {
      setLoading(true);
      
      const [flatsResult, flatBalancesResult] = await Promise.allSettled([
        getFlatsByBuilding(selectedBuildingId),
        // Fetch current balances from FlatLedger
        (async () => {
          const { getFlatBalancesForBuilding } = await import('../services/flatLedgerSyncService')
          return getFlatBalancesForBuilding(selectedBuildingId!)
        })()
      ]);
      
      // Get flat balances map
      const flatBalancesMap = flatBalancesResult.status === 'fulfilled' 
        ? flatBalancesResult.value 
        : new Map<string, number>()
      
      if (flatBalancesResult.status === 'rejected') {
        console.error('Failed to fetch flat balances:', flatBalancesResult.reason)
      }
      
      setFlatBalances(flatBalancesMap);
      
      // Fetch recent transactions for each flat from FlatLedger
      if (flatsResult.status === 'fulfilled') {
        const transactionsMap = new Map<string, any[]>()
        const { dateFrom } = getDateRangeFromFilters()
        
        for (const flat of flatsResult.value) {
          try {
            const { getFlatLedgerTransactions } = await import('../services/flatLedgerService')
            const transactions = await getFlatLedgerTransactions(
              flat.id,
              {
                dateFrom,
                dateTo: new Date(),
                includeReversed: false
              },
              50 // Get last 50 transactions
            )
            transactionsMap.set(flat.id, transactions)
          } catch (error) {
            console.error('Failed to fetch transactions for flat:', flat.id, error)
            transactionsMap.set(flat.id, [])
          }
        }
        
        setFlatTransactions(transactionsMap)
      }
      
      // Process flats
      if (flatsResult.status === 'fulfilled') {
        setFlats(flatsResult.value);
      } else {
        console.error('Flats loading failed:', flatsResult.reason);
        setFlats([]);
      }
      
    } catch (error) {
      console.error('Error loading reports data:', error);
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Error', 
        message: `Error loading reports data: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };
  
  const getDateRangeFromFilters = (): { dateFrom: Date; dateTo: Date } => {
    const now = new Date()
    let dateFrom: Date
    const dateTo = new Date()
    
    if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      return {
        dateFrom: filters.customStartDate,
        dateTo: filters.customEndDate
      }
    }
    
    switch (filters.dateRange) {
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        dateFrom = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
        break
      case '1y':
      default:
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
    }
    
    return { dateFrom, dateTo }
  }

  // Filter and search logic
  const filteredLedgers = useMemo(() => {
    return flats.filter(flat => {
      const balance = flatBalances.get(flat.id) || 0;
      const residentName = flat.currentResidentName || 'Unknown Resident';
      
      // Search filter
      const matchesSearch = searchQuery === '' || 
        flat.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        residentName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Balance filter
      const matchesBalance = filters.balanceType === 'all' ||
        (filters.balanceType === 'positive' && balance > 0) ||
        (filters.balanceType === 'negative' && balance < 0) ||
        (filters.balanceType === 'zero' && balance === 0);
      
      // Resident selection filter (empty means all selected)
      const matchesResident = filters.residents.length === 0 || 
        filters.residents.includes(flat.id);
      
      return matchesSearch && matchesBalance && matchesResident;
    });
  }, [flats, flatBalances, searchQuery, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return {
      totalResidents: filteredLedgers.length,
      totalCreditBalance: filteredLedgers
        .map(flat => flatBalances.get(flat.id) || 0)
        .filter(balance => balance > 0)
        .reduce((sum, balance) => sum + balance, 0),
      totalDebitBalance: Math.abs(filteredLedgers
        .map(flat => flatBalances.get(flat.id) || 0)
        .filter(balance => balance < 0)
        .reduce((sum, balance) => sum + balance, 0)),
      creditsAppliedTotal: filteredLedgers.reduce((sum, flat) => {
        const transactions = flatTransactions.get(flat.id) || [];
        const credits = transactions
          .filter(t => t.type === 'CREDIT_APPLICATION')
          .reduce((tSum, t) => tSum + t.creditAmount, 0);
        return sum + credits;
      }, 0)
    };
  }, [filteredLedgers, flatBalances, flatTransactions]);

  const handleGenerateStatement = async (flat: Flat) => {
    try {
      setLoading(true)
      
      // Derive date range from filters
      const { dateFrom, dateTo } = getDateRangeFromFilters()
      const residentName = flat.currentResidentName || 'Unknown Resident';
      
      // Fetch flat ledger data
      const { getStatementDataForFlat } = await import('../services/flatLedgerSyncService')
      const { summary, transactions } = await getStatementDataForFlat(
        flat.id,
        selectedBuildingId!,
        flat.flatNumber,
        residentName,
        dateFrom,
        dateTo
      )
      
      // Build statement data from flat ledger
      const statementData = {
        buildingName: selectedBuilding?.name || 'Building',
        flatNumber: flat.flatNumber,
        residentName,
        statementDate: new Date().toLocaleDateString('en-GB'),
        currentBalance: summary.currentBalance,
        summary: {
          totalDemands: summary.totalDemands,
          totalPayments: summary.totalPayments,
          totalCredits: summary.totalCredits,
          totalPenalties: summary.totalPenalties,
          overdueAmount: summary.overdueAmount,
          overdueCount: summary.overdueCount,
          paymentReliabilityScore: summary.paymentReliabilityScore
        },
        transactions
      }
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Statement Generated',
        message: `Account statement for ${flat.flatNumber} has been generated and is ready for download.`,
        type: 'success'
      })
      
      downloadStatement(statementData, flat)
      
    } catch (error) {
      console.error('Error generating statement:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: `Failed to generate account statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadStatement = (statementData: any, flat: Flat) => {
    const balanceStatus = statementData.currentBalance >= 0 ? 'CREDIT (In your favour)' : 'DEBIT (Amount owed)'
    
    const statementText = `
═══════════════════════════════════════════════════════════
           RESIDENT ACCOUNT STATEMENT
           ${selectedBuilding?.name || 'Building Name'}
═══════════════════════════════════════════════════════════

Statement Date: ${statementData.statementDate}
Flat Number: ${statementData.flatNumber}
Resident: ${statementData.residentName}

───────────────────────────────────────────────────────────
CURRENT ACCOUNT BALANCE
───────────────────────────────────────────────────────────
Balance: ${formatCurrency(Math.abs(statementData.currentBalance))} ${balanceStatus}

───────────────────────────────────────────────────────────
ACCOUNT SUMMARY
───────────────────────────────────────────────────────────
Total Service Charges: ${formatCurrency(statementData.summary.totalDemands)}
Total Payments Made: ${formatCurrency(statementData.summary.totalPayments)}
Total Credits Applied: ${formatCurrency(statementData.summary.totalCredits)}
Total Penalties: ${formatCurrency(statementData.summary.totalPenalties)}
${statementData.summary.overdueAmount > 0 ? `
⚠️  Overdue Amount: ${formatCurrency(statementData.summary.overdueAmount)} (${statementData.summary.overdueCount} items)
` : ''}
Payment Reliability Score: ${statementData.summary.paymentReliabilityScore}%

───────────────────────────────────────────────────────────
TRANSACTION HISTORY
───────────────────────────────────────────────────────────
${statementData.transactions.length === 0 ? 'No transactions in selected period.' : ''}
${statementData.transactions.map((t: any) => {
  const date = new Date(t.transactionDate).toLocaleDateString('en-GB')
  const type = t.type.replace(/_/g, ' ').toUpperCase()
  const debit = t.debitAmount > 0 ? formatCurrency(t.debitAmount) : '-'
  const credit = t.creditAmount > 0 ? formatCurrency(t.creditAmount) : '-'
  const balance = formatCurrency(t.runningBalance)
  const quarter = t.quarter || ''
  
  return `${date.padEnd(12)} | ${type.padEnd(25)} | ${quarter.padEnd(10)} | DR: ${debit.padEnd(10)} | CR: ${credit.padEnd(10)} | Bal: ${balance}`
}).join('\n')}

═══════════════════════════════════════════════════════════
END OF STATEMENT
═══════════════════════════════════════════════════════════

This statement is generated from the authoritative flat ledger system.
All balances and transactions reflect the most current data available.

For queries, please contact building management.
    `;

    const blob = new Blob([statementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${statementData.flatNumber}_statement_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkStatementGeneration = async () => {
    try {
      setLoading(true);
      
      const selectedLedgers = filters.residents.length > 0 
        ? filteredLedgers.filter(l => filters.residents.includes(l.id))
        : filteredLedgers;
      
      if (selectedLedgers.length === 0) {
        addNotification({
          userId: currentUser?.id || '',
          title: 'No Selection',
          message: 'Please select residents or adjust filters to generate statements',
          type: 'warning'
        });
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Generate statements for all selected residents using FlatLedger
      for (const ledger of selectedLedgers) {
        try {
          const flat = ledger;
          
          // Use same logic as single statement generation
          await handleGenerateStatement(flat);
          successCount++;
          
          // Add small delay to prevent browser blocking multiple downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Failed to generate statement for flat:', ledger.flatNumber, error);
          errorCount++;
        }
      }
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Bulk Generation Complete',
        message: `Generated ${successCount} statements successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        type: successCount > 0 ? 'success' : 'warning'
      });
      
    } catch (error) {
      console.error('Error in bulk generation:', error);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to generate bulk statements',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLedgerExpansion = (ledgerId: string) => {
    const newExpanded = new Set(expandedLedgers);
    if (newExpanded.has(ledgerId)) {
      newExpanded.delete(ledgerId);
    } else {
      newExpanded.add(ledgerId);
    }
    setExpandedLedgers(newExpanded);
  };

  // Show loading spinner while data is loading
  if (loading && flats.length === 0) {
    return <PageLoading message="Loading reports data..." />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter">Reports & Statements</h1>
            <p className="text-gray-600 font-inter">Generate resident account statements and financial reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => loadReportsData()}
              disabled={loading || !selectedBuildingId}
              variant="secondary"
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Header Actions */}
        <div className="border-b border-neutral-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 font-inter flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Account Statements
            </h2>
            <Button
              onClick={handleBulkStatementGeneration}
              disabled={loading}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Generate Selected Statements
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by flat or resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm"
            />
          </div>
          
          {/* Balance Filter */}
          <Dropdown
            options={balanceFilterOptions}
            value={filters.balanceType}
            onChange={(value) => setFilters({ ...filters, balanceType: value as BalanceFilter })}
            placeholder="Filter by balance..."
            size="sm"
            className="min-w-[200px]"
          />
          
          {/* Date Range */}
          <Dropdown
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(value) => setFilters({ ...filters, dateRange: value as DateRange })}
            placeholder="Select date range..."
            size="sm"
            className="min-w-[200px]"
          />
          
          {/* Statement Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.includeTransactions}
                onChange={(e) => setFilters({ ...filters, includeTransactions: e.target.checked })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-inter">Include Transactions</span>
            </label>
          </div>
        </div>
        
        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.customStartDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  customStartDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                End Date
              </label>
              <Input
                type="date"
                value={filters.customEndDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  customEndDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 font-inter">Total Residents</p>
                        <p className="text-2xl font-semibold text-neutral-900 font-inter">{summaryStats.totalResidents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-8 w-8 text-success-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 font-inter">Total Credit Balance</p>
                        <p className="text-2xl font-semibold text-success-600 font-inter">
                          {formatCurrency(summaryStats.totalCreditBalance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 font-inter">Total Debit Balance</p>
                        <p className="text-2xl font-semibold text-red-600 font-inter">
                          {formatCurrency(summaryStats.totalDebitBalance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 font-inter">Credits Applied</p>
                        <p className="text-2xl font-semibold text-primary-600 font-inter">
                          {formatCurrency(summaryStats.creditsAppliedTotal)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resident Accounts Table */}
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 font-inter">Resident Account Statements</h3>
                  <p className="text-sm text-gray-600 font-inter mt-1">
                    Select residents and generate individual or bulk account statements
                  </p>
                </div>
                
                {filteredLedgers.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 font-inter">No Resident Accounts Found</h3>
                    <p className="text-gray-600 font-inter">
                      {flats.length === 0 
                        ? 'No flats exist yet. Add flats to the building to create resident accounts.'
                        : 'No accounts match your current filters. Try adjusting the search or filter criteria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {filteredLedgers.map((flat) => {
                      const balance = flatBalances.get(flat.id) || 0;
                      const residentName = flat.currentResidentName || 'Unknown Resident';
                      const isExpanded = expandedLedgers.has(flat.id);
                      const isSelected = filters.residents.includes(flat.id);
                      
                      // Get transactions from FlatLedger
                      const flatLedgerTxs = flatTransactions.get(flat.id) || [];
                      const recentTransactions = flatLedgerTxs.slice(0, 3); // Get 3 most recent
                      
                      return (
                        <div key={flat.id} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters({ 
                                      ...filters, 
                                      residents: [...filters.residents, flat.id] 
                                    });
                                  } else {
                                    setFilters({ 
                                      ...filters, 
                                      residents: filters.residents.filter(id => id !== flat.id) 
                                    });
                                  }
                                }}
                                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                              />
                              <button
                                onClick={() => toggleLedgerExpansion(flat.id)}
                                className="flex items-center space-x-2 text-left hover:bg-neutral-50 rounded p-2 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                                )}
                                <div>
                                  <h4 className="font-medium text-neutral-900 font-inter">
                                    {flat.flatNumber} - {residentName}
                                  </h4>
                                  <p className="text-sm text-gray-500 font-inter">
                                    Balance: <span className={`font-medium ${
                                      balance > 0 ? 'text-success-600' :
                                      balance < 0 ? 'text-red-600' : 'text-neutral-600'
                                    }`}>
                                      {formatCurrency(balance)}
                                    </span>
                                  </p>
                                </div>
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleGenerateStatement(flat)}
                                leftIcon={<FileText className="h-4 w-4" />}
                              >
                                Generate Statement
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedFlat(flat);
                                  setShowStatementModal(true);
                                }}
                                leftIcon={<Eye className="h-4 w-4" />}
                              >
                                Preview
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pl-8 border-l-2 border-neutral-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="font-medium text-neutral-900 mb-2 font-inter">Account Summary</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 font-inter">Current Balance:</span>
                                      <span className={`font-medium ${
                                        balance > 0 ? 'text-success-600' :
                                        balance < 0 ? 'text-red-600' : 'text-neutral-600'
                                      }`}>
                                        {formatCurrency(balance)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 font-inter">Total Transactions:</span>
                                      <span className="font-medium text-neutral-900">{flatLedgerTxs.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 font-inter">Last Updated:</span>
                                      <span className="font-medium text-neutral-900">
                                        {new Date(flat.updatedAt || Date.now()).toLocaleDateString('en-GB')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h5 className="font-medium text-neutral-900 mb-2 font-inter">Recent Transactions</h5>
                                  <div className="space-y-2">
                                    {recentTransactions.length > 0 ? (
                                      recentTransactions.map((transaction, index) => (
                                        <div key={index} className="text-sm space-y-1">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <span className="text-gray-600 font-inter">
                                                {transaction.type.replace(/_/g, ' ').toUpperCase()}
                                              </span>
                                              {transaction.quarter && (
                                                <span className="text-xs text-gray-500 ml-2">
                                                  {transaction.quarter}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              {transaction.debitAmount > 0 && (
                                                <span className="font-medium text-red-600">
                                                  -{formatCurrency(transaction.debitAmount)}
                                                </span>
                                              )}
                                              {transaction.creditAmount > 0 && (
                                                <span className="font-medium text-success-600">
                                                  +{formatCurrency(transaction.creditAmount)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {new Date(transaction.transactionDate).toLocaleDateString('en-GB')} • Balance: {formatCurrency(transaction.runningBalance)}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-gray-500 font-inter">No recent transactions</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
        </div>
      </div>

      {/* Statement Preview Modal */}
      {showStatementModal && selectedFlat && (() => {
        // Get FlatLedger transactions for the selected flat
        const balance = flatBalances.get(selectedFlat.id) || 0;
        const residentName = selectedFlat.currentResidentName || 'Unknown Resident';
        const flatLedgerTxs = flatTransactions.get(selectedFlat.id) || [];
        
        return (
        <Modal
          isOpen={showStatementModal}
          onClose={() => {
            setShowStatementModal(false);
            setSelectedFlat(null);
          }}
          title={`Account Statement Preview - ${selectedFlat.flatNumber}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Statement Header */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 font-inter">
                    {selectedBuilding?.name || 'Building Name'}
                  </h3>
                  <p className="text-gray-600 font-inter">Resident Account Statement</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-inter">Statement Date:</p>
                  <p className="font-medium text-neutral-900 font-inter">
                    {new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <p className="text-sm text-gray-600 font-inter">Flat Number:</p>
                  <p className="font-medium text-neutral-900 font-inter">{selectedFlat.flatNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-inter">Resident Name:</p>
                  <p className="font-medium text-neutral-900 font-inter">
                    {residentName}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Current Balance */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h4 className="font-medium text-neutral-900 mb-2 font-inter">Current Account Balance</h4>
              <div className={`text-3xl font-bold ${
                balance > 0 ? 'text-success-600' :
                balance < 0 ? 'text-red-600' : 'text-neutral-600'
              }`}>
                {formatCurrency(balance)}
              </div>
              <p className="text-sm text-gray-600 mt-1 font-inter">
                {balance > 0 ? 'Credit Balance (you are in credit)' :
                 balance < 0 ? 'Debit Balance (amount owed)' : 'Zero Balance'}
              </p>
            </div>
            
            {/* Transaction Summary for Selected Period */}
            <div>
              <h4 className="font-medium text-neutral-900 mb-3 font-inter">
                Transaction Summary (All Time)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {(() => {
                  const totalDemands = flatLedgerTxs
                    .filter(t => t.type === 'SERVICE_CHARGE_DEMAND')
                    .reduce((sum, t) => sum + t.debitAmount, 0);
                  const totalPayments = flatLedgerTxs
                    .filter(t => t.type === 'PAYMENT')
                    .reduce((sum, t) => sum + t.creditAmount, 0);
                  const totalCredits = flatLedgerTxs
                    .filter(t => t.type === 'CREDIT_APPLICATION')
                    .reduce((sum, t) => sum + t.creditAmount, 0);
                  
                  return (
                    <>
                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-sm text-red-900 font-inter">Total Demands</p>
                        <p className="text-lg font-semibold text-red-600 font-inter">{formatCurrency(totalDemands)}</p>
                      </div>
                      <div className="bg-success-50 p-3 rounded">
                        <p className="text-sm text-success-900 font-inter">Total Payments</p>
                        <p className="text-lg font-semibold text-success-600 font-inter">{formatCurrency(totalPayments)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-900 font-inter">Credits Applied</p>
                        <p className="text-lg font-semibold text-primary-600 font-inter">{formatCurrency(totalCredits)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Recent Transactions */}
            {filters.includeTransactions && (
              <div>
                <h4 className="font-medium text-neutral-900 mb-3 font-inter">Transaction History</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {flatLedgerTxs.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase font-inter">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase font-inter">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase font-inter">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase font-inter">Debit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase font-inter">Credit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase font-inter">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {flatLedgerTxs.map((transaction, index) => (
                            <tr key={index} className="hover:bg-neutral-50">
                              <td className="px-4 py-2 text-sm text-neutral-900 font-inter">
                                {new Date(transaction.transactionDate).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-4 py-2 text-sm text-neutral-900 font-inter">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  transaction.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                                  transaction.type === 'SERVICE_CHARGE_DEMAND' ? 'bg-red-100 text-red-800' :
                                  transaction.type === 'CREDIT_APPLICATION' ? 'bg-blue-100 text-blue-800' :
                                  'bg-neutral-100 text-gray-800'
                                }`}>
                                  {transaction.type.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-neutral-900 font-inter">
                                <div>
                                  {transaction.description}
                                  {transaction.quarter && (
                                    <div className="text-xs text-gray-500 mt-0.5">{transaction.quarter}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium font-inter text-red-600">
                                {transaction.debitAmount > 0 ? formatCurrency(transaction.debitAmount) : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium font-inter text-success-600">
                                {transaction.creditAmount > 0 ? formatCurrency(transaction.creditAmount) : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium font-inter text-neutral-900">
                                {formatCurrency(transaction.runningBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 font-inter">No transactions found</p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowStatementModal(false);
                setSelectedFlat(null);
              }}
            >
              Close Preview
            </Button>
            <Button
              onClick={() => handleGenerateStatement(selectedFlat)}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download Statement
            </Button>
          </ModalFooter>
        </Modal>
        )
      })()}
    </div>
  );
};

export default Reports;
