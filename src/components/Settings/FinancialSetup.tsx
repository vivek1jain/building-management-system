import React, { useState, useEffect } from 'react';
import { Save, Calendar, DollarSign, Building, ChevronDown } from 'lucide-react';
import { useBuilding } from '../../contexts/BuildingContext';
import { updateBuilding } from '../../services/buildingService';

interface BuildingFinancialSettings {
  startMonth: number;
  startDay: number;
  currentYear: number;
  budgetLockDate: string;
  serviceChargeFrequency: 'monthly' | 'quarterly' | 'annually';
  groundRentFrequency: 'monthly' | 'quarterly' | 'annually';
  currency: string;
  latePaymentInterestRate: number;
  paymentGracePeriod: number;
  reminderDays: number;
}

// Legacy interface for compatibility
interface FinancialYear {
  startMonth: number;
  startDay: number;
  currentYear: number;
  budgetLockDate: string;
  serviceChargeFrequency: 'monthly' | 'quarterly' | 'annually';
  groundRentFrequency: 'monthly' | 'quarterly' | 'annually';
}

interface FinancialSetupProps {
  financialYear: FinancialYear;
  setFinancialYear: React.Dispatch<React.SetStateAction<FinancialYear>>;
  addNotification: (notification: any) => void;
  currentUser: any;
}

export const FinancialSetup: React.FC<FinancialSetupProps> = ({
  addNotification,
  currentUser
}) => {
  const { 
    buildings, 
    selectedBuilding, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    loading: buildingsLoading, 
    error: buildingsError 
  } = useBuilding();
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [financialSettings, setFinancialSettings] = useState<BuildingFinancialSettings>({
    startMonth: 4, // April
    startDay: 1,
    currentYear: new Date().getFullYear(),
    budgetLockDate: '',
    serviceChargeFrequency: 'quarterly',
    groundRentFrequency: 'annually',
    currency: 'GBP',
    latePaymentInterestRate: 1.5,
    paymentGracePeriod: 7,
    reminderDays: 14
  });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Load building financial settings when selected building changes
  useEffect(() => {
    if (selectedBuilding?.financialSettings) {
      setFinancialSettings({
        startMonth: selectedBuilding.financialSettings.startMonth || 4,
        startDay: selectedBuilding.financialSettings.startDay || 1,
        currentYear: selectedBuilding.financialSettings.currentYear || new Date().getFullYear(),
        budgetLockDate: selectedBuilding.financialSettings.budgetLockDate || '',
        serviceChargeFrequency: selectedBuilding.financialSettings.serviceChargeFrequency || 'quarterly',
        groundRentFrequency: selectedBuilding.financialSettings.groundRentFrequency || 'annually',
        currency: selectedBuilding.financialSettings.currency || 'GBP',
        latePaymentInterestRate: selectedBuilding.financialSettings.latePaymentInterestRate || 1.5,
        paymentGracePeriod: selectedBuilding.financialSettings.paymentGracePeriod || 7,
        reminderDays: selectedBuilding.financialSettings.reminderDays || 14
      });
    }
    setHasChanges(false);
  }, [selectedBuilding]);

  // Save financial settings to Firebase for the selected building
  const handleSave = async () => {
    if (!selectedBuilding) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Please select a building first.',
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      console.log('💰 Saving financial settings for building:', selectedBuilding.id);
      
      // Save the financial settings to the building document
      await updateBuilding(selectedBuilding.id, {
        financialSettings
      });
      
      console.log('💰 Financial settings saved successfully');
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Financial Settings Saved',
        message: `Financial settings for "${selectedBuilding.name}" have been updated successfully.`,
        type: 'success'
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('🚨 Error saving financial settings:', error);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to save financial settings. Please try again.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFinancialSettings = (updates: Partial<BuildingFinancialSettings>) => {
    setFinancialSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Building switcher component
  const BuildingSwitcher = () => {
    if (buildingsLoading) {
      return (
        <div className="flex items-center space-x-2 px-3 py-2">
          <Building className="h-4 w-4 text-neutral-400 animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      );
    }

    if (buildingsError || buildings.length === 0) {
      return (
        <div className="flex items-center space-x-2 px-3 py-2 text-sm text-neutral-500">
          <Building className="h-4 w-4" />
          <span>No buildings available</span>
        </div>
      );
    }

    return (
      <div className="relative">
        <select
          value={selectedBuildingId}
          onChange={(e) => setSelectedBuildingId(e.target.value)}
          className="appearance-none bg-white border border-neutral-200 rounded-lg pl-10 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[180px]"
          title={`Current building: ${selectedBuilding?.name || 'Select building'}`}
        >
          {!selectedBuildingId && (
            <option value="">Select Building</option>
          )}
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </div>
        
        {/* Building icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Building className="h-4 w-4 text-neutral-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Financial Setup</h2>
          <p className="text-gray-600 mt-1">Configure financial year, budget periods, and payment frequencies per building.</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Building Switcher */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">Select Building</h3>
            <p className="text-sm text-gray-600">Choose a building to configure its financial settings</p>
          </div>
          <BuildingSwitcher />
        </div>
      </div>

      {!selectedBuilding && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Building className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Building Selected</h3>
          <p className="text-gray-600">
            Please select a building from the dropdown above to configure its financial settings.
          </p>
        </div>
      )}

      {selectedBuilding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Configuring settings for:</span> {selectedBuilding.name}
          </p>
        </div>
      )}

      {/* Current Configuration Summary - moved to top */}
      {selectedBuilding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Current Configuration Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-neutral-700">Financial Year:</span>
              <div className="text-neutral-900">
                {months.find(m => m.value === financialSettings.startMonth)?.label} {financialSettings.startDay}, {financialSettings.currentYear} - 
                {months.find(m => m.value === financialSettings.startMonth)?.label} {financialSettings.startDay}, {financialSettings.currentYear + 1}
              </div>
            </div>
            <div>
              <span className="font-medium text-neutral-700">Service Charges:</span>
              <div className="text-neutral-900 capitalize">{financialSettings.serviceChargeFrequency}</div>
            </div>
            <div>
              <span className="font-medium text-neutral-700">Ground Rent:</span>
              <div className="text-neutral-900 capitalize">{financialSettings.groundRentFrequency}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Year Configuration */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-medium text-neutral-900">Financial Year</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Month
                </label>
                <select
                  value={financialSettings.startMonth}
                  onChange={(e) => updateFinancialSettings({ startMonth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!selectedBuilding}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={financialSettings.startDay}
                  onChange={(e) => updateFinancialSettings({ startDay: parseInt(e.target.value) || 1 })}
                  disabled={!selectedBuilding}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Current Financial Year
              </label>
              <input
                type="number"
                value={financialSettings.currentYear}
                onChange={(e) => updateFinancialSettings({ currentYear: parseInt(e.target.value) || new Date().getFullYear() })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Budget Lock Date
              </label>
              <input
                type="date"
                value={financialSettings.budgetLockDate}
                onChange={(e) => updateFinancialSettings({ budgetLockDate: e.target.value })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Date after which budgets cannot be modified without admin approval
              </p>
            </div>
          </div>
        </div>

        {/* Payment Frequencies */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-medium text-neutral-900">Payment Frequencies</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Service Charge Frequency
              </label>
              <select
                value={financialSettings.serviceChargeFrequency}
                onChange={(e) => updateFinancialSettings({ serviceChargeFrequency: e.target.value as any })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                How often service charges are collected from residents
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Ground Rent Frequency
              </label>
              <select
                value={financialSettings.groundRentFrequency}
                onChange={(e) => updateFinancialSettings({ groundRentFrequency: e.target.value as any })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                How often ground rent is collected from residents
              </p>
            </div>
          </div>
        </div>


        {/* Additional Settings */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Additional Financial Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Default Currency
              </label>
              <select 
                value={financialSettings.currency}
                onChange={(e) => updateFinancialSettings({ currency: e.target.value })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Late Payment Interest Rate (% per month)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={financialSettings.latePaymentInterestRate}
                onChange={(e) => updateFinancialSettings({ latePaymentInterestRate: parseFloat(e.target.value) || 0 })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Payment Grace Period (days)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={financialSettings.paymentGracePeriod}
                onChange={(e) => updateFinancialSettings({ paymentGracePeriod: parseInt(e.target.value) || 0 })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Automatic Reminder Days Before Due
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={financialSettings.reminderDays}
                onChange={(e) => updateFinancialSettings({ reminderDays: parseInt(e.target.value) || 14 })}
                disabled={!selectedBuilding}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
