import React, { useMemo } from 'react';
import { ChevronDown, Calendar, Clock } from 'lucide-react';
import { useBuilding } from '../../contexts/BuildingContext';
import { getFinancialYearInfo, FinancialPeriod } from '../../utils/financialYear';

interface ServiceChargePeriodDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ServiceChargePeriodDropdown: React.FC<ServiceChargePeriodDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select period...",
  disabled = false,
  className = ""
}) => {
  const { selectedBuilding } = useBuilding();

  const periodOptions = useMemo(() => {
    if (!selectedBuilding?.financialSettings) {
      return {
        availablePeriods: [],
        lastPeriod: null,
        currentPeriod: null
      };
    }

    try {
      const financialInfo = getFinancialYearInfo(selectedBuilding.financialSettings, new Date());
      
      return {
        availablePeriods: financialInfo.nextPeriods || [],
        lastPeriod: financialInfo.previousPeriod,
        currentPeriod: financialInfo.currentPeriod
      };
    } catch (error) {
      console.error('Error calculating periods:', error);
      return {
        availablePeriods: [],
        lastPeriod: null,
        currentPeriod: null
      };
    }
  }, [selectedBuilding?.financialSettings]);

  const formatPeriod = (period: FinancialPeriod, isLast: boolean = false) => {
    const label = isLast ? `${period.label} (Last Period)` : period.label;
    const dateRange = `${period.startDate.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${period.endDate.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
    const dueDate = `Due: ${period.dueDate.toLocaleDateString('en-GB')}`;
    
    return {
      label,
      dateRange,
      dueDate,
      value: period.id
    };
  };

  const allOptions = useMemo(() => {
    const options = [];
    
    // Add last period if it exists (for reference)
    if (periodOptions.lastPeriod) {
      const lastOption = formatPeriod(periodOptions.lastPeriod, true);
      options.push({
        ...lastOption,
        disabled: true, // Can't generate demands for past periods
        isLast: true
      });
    }

    // Add available periods for demand generation
    periodOptions.availablePeriods.forEach(period => {
      const option = formatPeriod(period);
      options.push({
        ...option,
        disabled: false,
        isLast: false
      });
    });

    return options;
  }, [periodOptions]);

  if (!selectedBuilding?.financialSettings) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm">No financial settings configured</span>
        </div>
      </div>
    );
  }

  if (allOptions.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm">No periods available</span>
        </div>
      </div>
    );
  }

  const selectedOption = allOptions.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      {/* Information Banner */}
      <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <div className="font-medium">Available Periods for Demand Generation</div>
            <div className="mt-1">
              Based on your financial year settings ({selectedBuilding.financialSettings.serviceChargeFrequency} charges, 
              starting {new Date(
                selectedBuilding.financialSettings.currentYear, 
                selectedBuilding.financialSettings.startMonth - 1, 
                selectedBuilding.financialSettings.startDay
              ).toLocaleDateString('en-GB')})
            </div>
            {periodOptions.lastPeriod && (
              <div className="mt-1 text-blue-700">
                Last period with demands: {periodOptions.lastPeriod.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full pl-10 pr-8 py-3 text-sm border border-gray-300 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            appearance-none bg-white
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          
          {allOptions.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              className={option.isLast ? 'text-gray-500 italic' : ''}
            >
              {option.label} | {option.dateRange} | {option.dueDate}
            </option>
          ))}
        </select>

        {/* Calendar Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>

        {/* Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Selected Period Details */}
      {selectedOption && !selectedOption.disabled && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="text-xs text-green-800">
            <div className="font-medium">Selected: {selectedOption.label}</div>
            <div>Period: {selectedOption.dateRange}</div>
            <div>Payment {selectedOption.dueDate}</div>
          </div>
        </div>
      )}

      {/* Error state for past period selection */}
      {selectedOption?.disabled && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-xs text-yellow-800">
            <div className="font-medium">Reference Only</div>
            <div>This is the last period demands were raised for. You cannot generate new demands for past periods.</div>
          </div>
        </div>
      )}
    </div>
  );
};
