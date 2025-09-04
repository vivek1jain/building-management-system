import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useBuilding } from '../contexts/BuildingContext';
import { useLocation } from 'react-router-dom';
import { 
  ResidentAccountLedger,
  AccountTransaction,
  Flat
} from '../types';
import { residentAccountService } from '../services/residentAccountService';
import { getFlatsByBuilding } from '../services/flatService';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Users,
  Eye,
  Mail,
  Printer,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalFooter, PageLoading } from '../components/UI';

type ReportType = 'account_statements' | 'financial_summary' | 'payment_history' | 'credit_analysis';
type BalanceFilter = 'all' | 'positive' | 'negative' | 'zero';
type DateRange = '30d' | '90d' | '6m' | '1y' | 'custom';

interface StatementFilters {
  residents: string[];
  balanceType: BalanceFilter;
  dateRange: DateRange;
  customStartDate?: Date;
  customEndDate?: Date;
  includeTransactions: boolean;
  includeSummary: boolean;
}

const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { selectedBuildingId, selectedBuilding, buildingsLoading } = useBuilding();
  const location = useLocation();

  // Core state
  const [loading, setLoading] = useState(false);
  const [activeReportType, setActiveReportType] = useState<ReportType>('account_statements');
  
  // Data state
  const [residentLedgers, setResidentLedgers] = useState<ResidentAccountLedger[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StatementFilters>({
    residents: [],
    balanceType: 'all',
    dateRange: '1y',
    customStartDate: undefined,
    customEndDate: undefined,
    includeTransactions: true,
    includeSummary: true
  });
  
  // UI state
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<ResidentAccountLedger | null>(null);
  const [expandedLedgers, setExpandedLedgers] = useState<Set<string>>(new Set());

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
      // Set active tab if specified
      if (navigationState.activeTab) {
        setActiveReportType(navigationState.activeTab);
      }
      
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
      console.log('Loading reports data for building:', selectedBuildingId);
      
      const [ledgersResult, flatsResult] = await Promise.allSettled([
        residentAccountService.getResidentLedgersByBuilding(selectedBuildingId),
        getFlatsByBuilding(selectedBuildingId)
      ]);
      
      // Process ledgers
      if (ledgersResult.status === 'fulfilled') {
        setResidentLedgers(ledgersResult.value);
        console.log('✅ Resident ledgers loaded:', ledgersResult.value.length, 'ledgers');
      } else {
        console.error('❌ Resident ledgers loading failed:', ledgersResult.reason);
        setResidentLedgers([]);
      }
      
      // Process flats
      if (flatsResult.status === 'fulfilled') {
        setFlats(flatsResult.value);
        console.log('✅ Flats loaded:', flatsResult.value.length, 'flats');
      } else {
        console.error('❌ Flats loading failed:', flatsResult.reason);
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

  // Filter and search logic
  const filteredLedgers = useMemo(() => {
    return residentLedgers.filter(ledger => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        ledger.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ledger.residentName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Balance filter
      const matchesBalance = filters.balanceType === 'all' ||
        (filters.balanceType === 'positive' && ledger.currentBalance > 0) ||
        (filters.balanceType === 'negative' && ledger.currentBalance < 0) ||
        (filters.balanceType === 'zero' && ledger.currentBalance === 0);
      
      // Resident selection filter (empty means all selected)
      const matchesResident = filters.residents.length === 0 || 
        filters.residents.includes(ledger.id);
      
      return matchesSearch && matchesBalance && matchesResident;
    });
  }, [residentLedgers, searchQuery, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return {
      totalResidents: filteredLedgers.length,
      totalCreditBalance: filteredLedgers
        .filter(l => l.currentBalance > 0)
        .reduce((sum, l) => sum + l.currentBalance, 0),
      totalDebitBalance: Math.abs(filteredLedgers
        .filter(l => l.currentBalance < 0)
        .reduce((sum, l) => sum + l.currentBalance, 0)),
      creditsAppliedTotal: filteredLedgers.reduce((sum, l) => 
        sum + (l.transactions || []).reduce((tSum, t) => 
          t.type === 'credit_application' ? tSum + Math.abs(t.amount) : tSum, 0
        ), 0
      )
    };
  }, [filteredLedgers]);

  const handleGenerateStatement = async (ledger: ResidentAccountLedger) => {
    try {
      setLoading(true);
      
      // TODO: Implement actual PDF generation
      // This is a placeholder for the statement generation logic
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Statement Generated',
        message: `Account statement for ${ledger.flatNumber} has been generated and is ready for download.`,
        type: 'success'
      });
      
      // Simulate download
      const statementData = generateStatementData(ledger);
      downloadStatement(statementData, ledger);
      
    } catch (error) {
      console.error('Error generating statement:', error);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to generate account statement',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStatementData = (ledger: ResidentAccountLedger) => {
    // Generate statement data structure
    const transactionsInRange = getTransactionsInDateRange(ledger.transactions || []);
    
    return {
      buildingName: selectedBuilding?.name || 'Building',
      flatNumber: ledger.flatNumber,
      residentName: ledger.residentName || 'Unknown Resident',
      statementDate: new Date().toLocaleDateString('en-GB'),
      currentBalance: ledger.currentBalance,
      transactions: transactionsInRange,
      summary: {
        totalCredits: transactionsInRange
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0),
        totalDebits: Math.abs(transactionsInRange
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)),
        creditsApplied: transactionsInRange
          .filter(t => t.type === 'credit_application')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      }
    };
  };

  const getTransactionsInDateRange = (transactions: AccountTransaction[]) => {
    if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      return transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= filters.customStartDate! && transactionDate <= filters.customEndDate!;
      });
    }
    
    const now = new Date();
    let startDate: Date;
    
    switch (filters.dateRange) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return transactions.filter(t => new Date(t.createdAt) >= startDate);
  };

  const downloadStatement = (statementData: any, ledger: ResidentAccountLedger) => {
    // Create a simple text-based statement for now
    // TODO: Replace with proper PDF generation
    const statementText = `
RESIDENT ACCOUNT STATEMENT
${selectedBuilding?.name || 'Building Name'}
Generated: ${new Date().toLocaleDateString('en-GB')}

Flat: ${statementData.flatNumber}
Resident: ${statementData.residentName}
Current Balance: ${formatCurrency(statementData.currentBalance)}

TRANSACTION SUMMARY:
Total Credits: ${formatCurrency(statementData.summary.totalCredits)}
Total Debits: ${formatCurrency(statementData.summary.totalDebits)}
Credits Applied: ${formatCurrency(statementData.summary.creditsApplied)}

TRANSACTION HISTORY:
${statementData.transactions.map((t: AccountTransaction) => 
  `${new Date(t.createdAt).toLocaleDateString('en-GB')} - ${t.type.toUpperCase()} - ${formatCurrency(t.amount)} - ${t.description}`
).join('\n')}

End of Statement
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
      
      // Generate statements for all selected residents
      for (const ledger of selectedLedgers) {
        const statementData = generateStatementData(ledger);
        downloadStatement(statementData, ledger);
        
        // Add small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Bulk Generation Complete',
        message: `Generated ${selectedLedgers.length} account statements`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error generating bulk statements:', error);
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

  // Show loading spinner while buildings are loading
  if (buildingsLoading || (loading && residentLedgers.length === 0)) {
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

        {/* Report Type Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'account_statements', name: 'Account Statements', icon: FileText },
              { id: 'financial_summary', name: 'Financial Summary', icon: DollarSign },
              { id: 'payment_history', name: 'Payment History', icon: Clock },
              { id: 'credit_analysis', name: 'Credit Analysis', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeReportType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReportType(tab.id as ReportType)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors font-inter`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeReportType === 'account_statements' && (
            <div className="space-y-6">
              {/* Filters and Controls */}
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900 font-inter">Statement Generation Controls</h3>
                  <Button
                    onClick={handleBulkStatementGeneration}
                    disabled={loading}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Generate Selected Statements
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      type="text"
                      placeholder="Search by flat or resident..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Balance Filter */}
                  <select
                    value={filters.balanceType}
                    onChange={(e) => setFilters({ ...filters, balanceType: e.target.value as BalanceFilter })}
                    className="px-3 py-2 border border-neutral-300 rounded-md text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Balances</option>
                    <option value="positive">Credit Balance (Positive)</option>
                    <option value="negative">Debit Balance (Negative)</option>
                    <option value="zero">Zero Balance</option>
                  </select>
                  
                  {/* Date Range */}
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as DateRange })}
                    className="px-3 py-2 border border-neutral-300 rounded-md text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="1y">Last 12 Months</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              </div>

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
                      {residentLedgers.length === 0 
                        ? 'No resident account ledgers exist yet. Issue service charges to create resident accounts.'
                        : 'No accounts match your current filters. Try adjusting the search or filter criteria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {filteredLedgers.map((ledger) => {
                      const isExpanded = expandedLedgers.has(ledger.id);
                      const isSelected = filters.residents.includes(ledger.id);
                      const recentTransactions = (ledger.transactions || []).slice(-3);
                      
                      return (
                        <div key={ledger.id} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters({ 
                                      ...filters, 
                                      residents: [...filters.residents, ledger.id] 
                                    });
                                  } else {
                                    setFilters({ 
                                      ...filters, 
                                      residents: filters.residents.filter(id => id !== ledger.id) 
                                    });
                                  }
                                }}
                                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                              />
                              <button
                                onClick={() => toggleLedgerExpansion(ledger.id)}
                                className="flex items-center space-x-2 text-left hover:bg-neutral-50 rounded p-2 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                                )}
                                <div>
                                  <h4 className="font-medium text-neutral-900 font-inter">
                                    {ledger.flatNumber} - {ledger.residentName || 'Unknown Resident'}
                                  </h4>
                                  <p className="text-sm text-gray-500 font-inter">
                                    Balance: <span className={`font-medium ${
                                      ledger.currentBalance > 0 ? 'text-success-600' :
                                      ledger.currentBalance < 0 ? 'text-red-600' : 'text-neutral-600'
                                    }`}>
                                      {formatCurrency(ledger.currentBalance)}
                                    </span>
                                  </p>
                                </div>
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleGenerateStatement(ledger)}
                                leftIcon={<FileText className="h-4 w-4" />}
                              >
                                Generate Statement
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedLedger(ledger);
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
                                        ledger.currentBalance > 0 ? 'text-success-600' :
                                        ledger.currentBalance < 0 ? 'text-red-600' : 'text-neutral-600'
                                      }`}>
                                        {formatCurrency(ledger.currentBalance)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 font-inter">Total Transactions:</span>
                                      <span className="font-medium text-neutral-900">{ledger.transactions?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 font-inter">Last Updated:</span>
                                      <span className="font-medium text-neutral-900">
                                        {new Date(ledger.updatedAt || Date.now()).toLocaleDateString('en-GB')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h5 className="font-medium text-neutral-900 mb-2 font-inter">Recent Transactions</h5>
                                  <div className="space-y-2">
                                    {recentTransactions.length > 0 ? (
                                      recentTransactions.map((transaction, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                          <span className="text-gray-600 font-inter">
                                            {transaction.type.replace('_', ' ')}
                                          </span>
                                          <span className={`font-medium ${
                                            transaction.amount > 0 ? 'text-success-600' : 'text-red-600'
                                          }`}>
                                            {formatCurrency(Math.abs(transaction.amount))}
                                          </span>
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
          )}

          {/* Placeholder for other report types */}
          {activeReportType !== 'account_statements' && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 font-inter">
                {activeReportType === 'financial_summary' && 'Financial Summary Reports'}
                {activeReportType === 'payment_history' && 'Payment History Reports'}
                {activeReportType === 'credit_analysis' && 'Credit Analysis Reports'}
              </h3>
              <p className="text-gray-600 font-inter">
                This report type will be available in a future update
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statement Preview Modal */}
      {showStatementModal && selectedLedger && (
        <Modal
          isOpen={showStatementModal}
          onClose={() => {
            setShowStatementModal(false);
            setSelectedLedger(null);
          }}
          title={`Account Statement Preview - ${selectedLedger.flatNumber}`}
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
                  <p className="font-medium text-neutral-900 font-inter">{selectedLedger.flatNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-inter">Resident Name:</p>
                  <p className="font-medium text-neutral-900 font-inter">
                    {selectedLedger.residentName || 'Unknown Resident'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Current Balance */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h4 className="font-medium text-neutral-900 mb-2 font-inter">Current Account Balance</h4>
              <div className={`text-3xl font-bold ${
                selectedLedger.currentBalance > 0 ? 'text-success-600' :
                selectedLedger.currentBalance < 0 ? 'text-red-600' : 'text-neutral-600'
              }`}>
                {formatCurrency(selectedLedger.currentBalance)}
              </div>
              <p className="text-sm text-gray-600 mt-1 font-inter">
                {selectedLedger.currentBalance > 0 ? 'Credit Balance (you are in credit)' :
                 selectedLedger.currentBalance < 0 ? 'Debit Balance (amount owed)' : 'Zero Balance'}
              </p>
            </div>
            
            {/* Transaction Summary for Selected Period */}
            <div>
              <h4 className="font-medium text-neutral-900 mb-3 font-inter">
                Transaction Summary ({filters.dateRange === 'custom' ? 'Custom Period' : filters.dateRange.toUpperCase()})
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {(() => {
                  const transactionsInRange = getTransactionsInDateRange(selectedLedger.transactions || []);
                  const totalCredits = transactionsInRange.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                  const totalDebits = Math.abs(transactionsInRange.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
                  const creditsApplied = transactionsInRange.filter(t => t.type === 'credit_application').reduce((sum, t) => sum + Math.abs(t.amount), 0);
                  
                  return (
                    <>
                      <div className="bg-success-50 p-3 rounded">
                        <p className="text-sm text-success-900 font-inter">Total Credits</p>
                        <p className="text-lg font-semibold text-success-600 font-inter">{formatCurrency(totalCredits)}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-sm text-red-900 font-inter">Total Debits</p>
                        <p className="text-lg font-semibold text-red-600 font-inter">{formatCurrency(totalDebits)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-900 font-inter">Credits Applied</p>
                        <p className="text-lg font-semibold text-primary-600 font-inter">{formatCurrency(creditsApplied)}</p>
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
                  {(() => {
                    const transactionsInRange = getTransactionsInDateRange(selectedLedger.transactions || []);
                    return transactionsInRange.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase font-inter">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase font-inter">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase font-inter">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase font-inter">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactionsInRange.map((transaction, index) => (
                            <tr key={index} className="hover:bg-neutral-50">
                              <td className="px-4 py-2 text-sm text-neutral-900 font-inter">
                                {new Date(transaction.createdAt).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-4 py-2 text-sm text-neutral-900 font-inter">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  transaction.type === 'credit_application' ? 'bg-green-100 text-green-800' :
                                  transaction.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                                  transaction.type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-neutral-100 text-gray-800'
                                }`}>
                                  {transaction.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-neutral-900 font-inter">
                                {transaction.description}
                              </td>
                              <td className={`px-4 py-2 text-sm text-right font-medium font-inter ${
                                transaction.amount > 0 ? 'text-success-600' : 'text-red-600'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 font-inter">No transactions in the selected period</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowStatementModal(false);
                setSelectedLedger(null);
              }}
            >
              Close Preview
            </Button>
            <Button
              onClick={() => handleGenerateStatement(selectedLedger)}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download Statement
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default Reports;
