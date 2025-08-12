import React, { useState } from 'react';
import { Save, Calendar, DollarSign } from 'lucide-react';

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
  financialYear,
  setFinancialYear,
  addNotification,
  currentUser
}) => {
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleSave = () => {
    addNotification({
      userId: currentUser?.id || '',
      title: 'Financial Settings Saved',
      message: 'Financial year and payment settings have been updated successfully.',
      type: 'success'
    });
    setHasChanges(false);
  };

  const updateFinancialYear = (updates: Partial<FinancialYear>) => {
    setFinancialYear(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Setup</h2>
          <p className="text-gray-600 mt-1">Configure financial year, budget periods, and payment frequencies.</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Year Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Financial Year</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Month
                </label>
                <select
                  value={financialYear.startMonth}
                  onChange={(e) => updateFinancialYear({ startMonth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={financialYear.startDay}
                  onChange={(e) => updateFinancialYear({ startDay: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Financial Year
              </label>
              <input
                type="number"
                value={financialYear.currentYear}
                onChange={(e) => updateFinancialYear({ currentYear: parseInt(e.target.value) || new Date().getFullYear() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Lock Date
              </label>
              <input
                type="date"
                value={financialYear.budgetLockDate}
                onChange={(e) => updateFinancialYear({ budgetLockDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Date after which budgets cannot be modified without admin approval
              </p>
            </div>
          </div>
        </div>

        {/* Payment Frequencies */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Payment Frequencies</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Charge Frequency
              </label>
              <select
                value={financialYear.serviceChargeFrequency}
                onChange={(e) => updateFinancialYear({ serviceChargeFrequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How often service charges are collected from residents
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ground Rent Frequency
              </label>
              <select
                value={financialYear.groundRentFrequency}
                onChange={(e) => updateFinancialYear({ groundRentFrequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How often ground rent is collected from residents
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Configuration Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Financial Year:</span>
              <div className="text-gray-900">
                {months.find(m => m.value === financialYear.startMonth)?.label} {financialYear.startDay}, {financialYear.currentYear} - 
                {months.find(m => m.value === financialYear.startMonth)?.label} {financialYear.startDay}, {financialYear.currentYear + 1}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Service Charges:</span>
              <div className="text-gray-900 capitalize">{financialYear.serviceChargeFrequency}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ground Rent:</span>
              <div className="text-gray-900 capitalize">{financialYear.groundRentFrequency}</div>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Financial Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Payment Interest Rate (% per month)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                defaultValue="1.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Grace Period (days)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                defaultValue="7"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Automatic Reminder Days Before Due
              </label>
              <input
                type="number"
                min="1"
                max="30"
                defaultValue="14"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
