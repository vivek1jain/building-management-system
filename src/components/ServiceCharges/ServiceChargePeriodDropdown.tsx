import React, { useMemo } from 'react';
import { Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useBuilding } from '../../contexts/BuildingContext';
import { getFinancialYearInfo, FinancialPeriod } from '../../utils/financialYear';
import { Dropdown, DropdownOption } from '../UI';
import { ServiceChargeDemand } from '../../types';

interface ServiceChargePeriodDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  existingDemands?: ServiceChargeDemand[]; // Add existing demands to show indicators
}

export const ServiceChargePeriodDropdown: React.FC<ServiceChargePeriodDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select period...",
  disabled = false,
  className = "",
  buttonClassName = "",
  existingDemands = []
}) => {
  const { selectedBuilding } = useBuilding();

  // Get existing periods that have demands raised
  const periodsWithDemands = useMemo(() => {
    const periods = new Set<string>()
    existingDemands.forEach(demand => {
      if (demand.financialQuarterDisplayString) {
        periods.add(demand.financialQuarterDisplayString)
      }
    })
    return periods
  }, [existingDemands])

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

  // Convert periods to DropdownOptions
  const dropdownOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = []
    
    // Add last period if it exists (for reference)
    if (periodOptions.lastPeriod) {
      const period = periodOptions.lastPeriod
      const hasExistingDemands = periodsWithDemands.has(period.id)
      const dateRange = `${period.startDate.toLocaleDateString('en-GB', { 
        month: 'short', 
        day: 'numeric' 
      })} - ${period.endDate.toLocaleDateString('en-GB', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}`
      const dueDate = `Due: ${period.dueDate.toLocaleDateString('en-GB')}`
      
      options.push({
        value: period.id,
        label: `${period.label} (Last Period)`,
        description: `${dateRange} • ${dueDate}`,
        icon: hasExistingDemands ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-gray-400" />
        ),
        disabled: true // Can't generate demands for past periods
      })
    }
    
    // Add available periods for demand generation
    periodOptions.availablePeriods.forEach(period => {
      const hasExistingDemands = periodsWithDemands.has(period.id)
      const dateRange = `${period.startDate.toLocaleDateString('en-GB', { 
        month: 'short', 
        day: 'numeric' 
      })} - ${period.endDate.toLocaleDateString('en-GB', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}`
      const dueDate = `Due: ${period.dueDate.toLocaleDateString('en-GB')}`
      
      options.push({
        value: period.id,
        label: period.label,
        description: `${dateRange} • ${dueDate}`,
        icon: hasExistingDemands ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Clock className="h-4 w-4 text-gray-400" />
        ),
        disabled: false
      })
    })
    
    return options
  }, [periodOptions, periodsWithDemands])

  if (!selectedBuilding?.financialSettings) {
    return (
      <div className={className}>
        <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm font-inter">No financial settings configured</span>
        </div>
      </div>
    );
  }

  if (dropdownOptions.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm font-inter">No periods available</span>
        </div>
      </div>
    );
  }

  return (
    <Dropdown
      options={dropdownOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      icon={<Calendar className="h-4 w-4" />}
      size="md"
      variant="default"
      showSearch={dropdownOptions.length > 5}
      className={className}
      buttonClassName={buttonClassName}
      dropdownClassName="w-full"
      maxHeight="max-h-80"
    />
  );
};
