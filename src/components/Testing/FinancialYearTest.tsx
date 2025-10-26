import { Calendar, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useBuilding } from '../../contexts/BuildingContext';
import { getFinancialYearInfo, getLastDemandPeriod, FinancialPeriod } from '../../utils/financialYear';

export const FinancialYearTest: React.FC = () => {
  const { selectedBuilding } = useBuilding();
  const [financialYearInfo, setFinancialYearInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update calculations when building changes or date changes
  useEffect(() => {
    console.log('🧪 FinancialYearTest useEffect triggered', {
      selectedBuilding: selectedBuilding?.name,
      hasFinancialSettings: !!selectedBuilding?.financialSettings,
      currentDate
    });
    
    if (selectedBuilding?.financialSettings) {
      try {
        console.log('🧪 Running financial year calculations with settings:', selectedBuilding.financialSettings);
        const info = getFinancialYearInfo(selectedBuilding.financialSettings, currentDate);
        console.log('🧪 Financial year info calculated:', info);
        setFinancialYearInfo(info);
        runTests(selectedBuilding.financialSettings, currentDate);
      } catch (error) {
        console.error('🚨 Error in financial year calculations:', error);
      }
    } else {
      console.log('🧪 No financial settings available');
      setFinancialYearInfo(null);
      setTestResults([]);
    }
  }, [selectedBuilding, currentDate]);

  const runTests = (settings: any, testDate: Date) => {
    const tests = [];
    
    // Test 1: Financial Year Calculation
    const yearInfo = getFinancialYearInfo(settings, testDate);
    tests.push({
      name: 'Financial Year Calculation',
      status: yearInfo ? 'pass' : 'fail',
      result: `Financial year: ${yearInfo.financialYearStart.toLocaleDateString()} - ${yearInfo.financialYearEnd.toLocaleDateString()}`,
      details: `Current year detected as: ${yearInfo.currentYear}`
    });

    // Test 2: Current Period Detection
    tests.push({
      name: 'Current Period Detection',
      status: yearInfo.currentPeriod ? 'pass' : 'warning',
      result: yearInfo.currentPeriod ? 
        `Currently in: ${yearInfo.currentPeriod.label}` : 
        'No current period (might be between periods)',
      details: yearInfo.currentPeriod ? 
        `Period: ${yearInfo.currentPeriod.startDate.toLocaleDateString()} - ${yearInfo.currentPeriod.endDate.toLocaleDateString()}` : 
        'This is normal if current date is between financial periods'
    });

    // Test 3: Next Periods Generation
    tests.push({
      name: 'Next Available Periods',
      status: yearInfo.nextPeriods.length === 3 ? 'pass' : 'warning',
      result: `Generated ${yearInfo.nextPeriods.length} periods for demand generation`,
      details: yearInfo.nextPeriods.map(p => p.label).join(', ')
    });

    // Test 4: Previous Period Detection
    const lastPeriod = getLastDemandPeriod(settings, testDate);
    tests.push({
      name: 'Last Period for Demands',
      status: lastPeriod ? 'pass' : 'info',
      result: lastPeriod ? 
        `Last completed period: ${lastPeriod.label}` : 
        'No previous period found',
      details: lastPeriod ? 
        `Ended: ${lastPeriod.endDate.toLocaleDateString()}, Due: ${lastPeriod.dueDate.toLocaleDateString()}` :
        'This might be normal for a new financial year'
    });

    // Test 5: Frequency Logic
    const frequency = settings.serviceChargeFrequency;
    const expectedPeriods = frequency === 'quarterly' ? 4 : frequency === 'monthly' ? 12 : 1;
    tests.push({
      name: 'Frequency Configuration',
      status: 'pass',
      result: `Service charges are ${frequency} (${expectedPeriods} periods per year)`,
      details: `Payment grace period: ${settings.paymentGracePeriod || 30} days`
    });

    setTestResults(tests);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'fail': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-success-50 border-success-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'fail': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (!selectedBuilding) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Building Selected</h3>
        <p className="text-gray-600">
          Please select a building from the header to test financial year calculations.
        </p>
      </div>
    );
  }

  if (!selectedBuilding.financialSettings) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Financial Settings</h3>
        <p className="text-gray-600">
          This building doesn't have financial settings configured. Please go to Settings {'>'}  Financial Setup to configure them first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-gray-700 mb-2">Debug Information</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="font-medium">Selected Building:</span>
            <div>{selectedBuilding?.name || 'None'}</div>
          </div>
          <div>
            <span className="font-medium">Has Financial Settings:</span>
            <div>{selectedBuilding?.financialSettings ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <span className="font-medium">Test Results Count:</span>
            <div>{testResults.length}</div>
          </div>
          <div>
            <span className="font-medium">Financial Year Info:</span>
            <div>{financialYearInfo ? 'Loaded' : 'Not loaded'}</div>
          </div>
        </div>
        
        {/* Raw Financial Settings */}
        {selectedBuilding?.financialSettings ? (
          <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
            <h5 className="font-medium text-gray-700 mb-2">Raw Financial Settings:</h5>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(selectedBuilding.financialSettings, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-700 text-xs">
              <strong>No financial settings found.</strong> Please go to Settings {'>'} Financial Setup to configure them.
            </p>
          </div>
        )}
      </div>
      
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-neutral-900">
            Financial Year Test - {selectedBuilding.name}
          </h2>
        </div>
        
        {/* Test Date Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Test Date (change this to see how periods change):
          </label>
          <input
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-600 mt-1">
            Current test date: {formatDate(currentDate)}
          </p>
        </div>

        {/* Financial Settings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-neutral-700">Financial Year Start:</span>
            <div className="text-neutral-900">
              {new Date(selectedBuilding.financialSettings.currentYear, selectedBuilding.financialSettings.startMonth - 1, selectedBuilding.financialSettings.startDay).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-neutral-700">Service Charge Frequency:</span>
            <div className="text-neutral-900 capitalize">
              {selectedBuilding.financialSettings.serviceChargeFrequency}
            </div>
          </div>
          <div>
            <span className="font-medium text-neutral-700">Rate per sq ft:</span>
            <div className="text-neutral-900">
              £{selectedBuilding.financialSettings.serviceChargeRatePerSqFt || 'Not set'}
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 gap-4">
        {testResults.map((test, index) => (
          <div key={index} className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(test.status)}
              <div className="flex-1">
                <h3 className="font-medium text-neutral-900 mb-1">{test.name}</h3>
                <p className="text-neutral-700 mb-2">{test.result}</p>
                {test.details && (
                  <p className="text-sm text-neutral-600">{test.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Period Information */}
      {financialYearInfo && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Detailed Period Information</h3>
          
          {/* Current Period */}
          {financialYearInfo.currentPeriod && (
            <div className="mb-6">
              <h4 className="font-medium text-success-700 mb-2">📅 Current Period</h4>
              <div className="bg-success-50 border border-success-200 rounded p-3">
                <p><strong>{financialYearInfo.currentPeriod.label}</strong></p>
                <p className="text-sm text-neutral-600">
                  {formatDate(financialYearInfo.currentPeriod.startDate)} - {formatDate(financialYearInfo.currentPeriod.endDate)}
                </p>
                <p className="text-sm text-neutral-600">
                  Payment due: {formatDate(financialYearInfo.currentPeriod.dueDate)}
                </p>
              </div>
            </div>
          )}

          {/* Next Available Periods */}
          <div className="mb-6">
            <h4 className="font-medium text-blue-700 mb-2">🔮 Next Available Periods for Demand Generation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {financialYearInfo.nextPeriods.map((period: FinancialPeriod, index: number) => (
                <div key={period.id} className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="font-medium">{period.label}</p>
                  <p className="text-xs text-neutral-600">
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </p>
                  <p className="text-xs text-neutral-600">
                    Due: {formatDate(period.dueDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Period */}
          {financialYearInfo.previousPeriod && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">⏮️ Last Completed Period</h4>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p><strong>{financialYearInfo.previousPeriod.label}</strong></p>
                <p className="text-sm text-neutral-600">
                  {formatDate(financialYearInfo.previousPeriod.startDate)} - {formatDate(financialYearInfo.previousPeriod.endDate)}
                </p>
                <p className="text-sm text-neutral-600">
                  Payment was due: {formatDate(financialYearInfo.previousPeriod.dueDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
