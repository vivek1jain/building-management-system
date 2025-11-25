import { Calendar, HelpCircle, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useBuilding } from '../../contexts/BuildingContext';

export const FinancialYearTestCompact: React.FC = () => {
  const buildingContext = useBuilding();
  const selectedBuilding = buildingContext?.selectedBuilding;
  const [testDate, setTestDate] = useState(new Date());
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBuilding?.financialSettings) {
      try {
        console.log('🏢 Financial settings:', selectedBuilding.financialSettings);
        // Import dynamically to avoid blocking
        import('../../utils/financialYear').then(({ getFinancialYearInfo }) => {
          const yearInfo = getFinancialYearInfo(selectedBuilding.financialSettings, testDate);
          setInfo(yearInfo);
          setError(null);
        }).catch((err) => {
          console.error('Financial year calculation error:', err);
          setError(err instanceof Error ? err.message : 'Calculation error');
        });
      } catch (error) {
        console.error('Financial year calculation error:', error);
        setInfo(null);
        setError(error instanceof Error ? error.message : 'Calculation error');
      }
    }
  }, [selectedBuilding, testDate]);

  if (!selectedBuilding) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-700" />
            </div>
            <h3 className="text-base font-semibold">Financial Year</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-600 text-center">Select a building</p>
        </div>
      </div>
    );
  }

  if (!selectedBuilding.financialSettings) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-700" />
            </div>
            <h3 className="text-base font-semibold">Financial Year</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-red-600 text-center">No financial settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calendar className="h-4 w-4 text-orange-700" />
          </div>
          <h3 className="text-base font-semibold">Financial Year</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Financial Year Calculator</p>
            <p className="mb-2">Test financial year and period calculations for the selected building.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Change test date to see period changes</li>
              <li>Validates service charge frequency</li>
              <li>Shows current and next periods</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 text-xs overflow-y-auto">
        <div className="bg-neutral-50 rounded p-2 border border-neutral-200">
          <p className="text-neutral-600">Building</p>
          <p className="font-medium text-neutral-900">{selectedBuilding.name}</p>
        </div>

        {info && (
          <>
            <div className="bg-blue-50 rounded p-2 border border-blue-200">
              <p className="text-blue-700 font-medium mb-1">Current FY</p>
              <p className="text-blue-900">{info.financialYearStart.toLocaleDateString()} - {info.financialYearEnd.toLocaleDateString()}</p>
            </div>

            {info.currentPeriod && (
              <div className="bg-green-50 rounded p-2 border border-green-200">
                <p className="text-green-700 font-medium mb-1">Current Period</p>
                <p className="text-green-900">{info.currentPeriod.label}</p>
              </div>
            )}

            <div className="bg-purple-50 rounded p-2 border border-purple-200">
              <p className="text-purple-700 font-medium mb-1">Frequency</p>
              <p className="text-purple-900 capitalize">{selectedBuilding.financialSettings.serviceChargeFrequency}</p>
            </div>
          </>
        )}

        {!info && error && (
          <div className="bg-yellow-50 rounded p-2 border border-yellow-200 flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-800">{error}</p>
          </div>
        )}
        
        {!info && !error && selectedBuilding && (
          <div className="bg-neutral-50 rounded p-2 border border-neutral-200 text-center">
            <p className="text-xs text-neutral-600">No data available</p>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-auto pt-2">
        <input
          type="date"
          value={testDate.toISOString().split('T')[0]}
          onChange={(e) => setTestDate(new Date(e.target.value))}
          className="text-xs px-2 py-1 border border-neutral-300 rounded"
        />
      </div>
    </div>
  );
};

export default FinancialYearTestCompact;
