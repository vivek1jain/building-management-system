import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building as BuildingIcon, 
  Users, 
  Calendar, 
  Palette
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { BuildingManagement } from '../components/Settings/BuildingManagement';
import { UserManagement } from '../components/Settings/UserManagement';
import { FinancialSetup } from '../components/Settings/FinancialSetup';
import { AppearanceSettings } from '../components/Settings/AppearanceSettings';
import { Button, Card, CardContent, TabLoadingSkeleton } from '../components/UI';

// Settings-specific interfaces
interface SettingsBuilding {
  id: string;
  name: string;
  address: string;
  units: number;
  status: 'active' | 'inactive';
}

interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'admin' | 'resident';
  status: 'active' | 'inactive';
  buildings: string[];
}

interface FinancialYear {
  startMonth: number;
  startDay: number;
  currentYear: number;
  budgetLockDate: string;
  serviceChargeFrequency: 'quarterly' | 'annually' | 'monthly';
  groundRentFrequency: 'quarterly' | 'annually' | 'monthly';
}



const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  
  // State for active tab and loading
  const [activeTab, setActiveTab] = useState<'buildings' | 'users' | 'financial' | 'appearance'>('buildings');
  const [loading, setLoading] = useState(false);
  
  const handleTabChange = async (tab: typeof activeTab) => {
    setLoading(true);
    setActiveTab(tab);
    // Simulate loading delay for settings
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };
  
  // Building Management State
  const [buildings, setBuildings] = useState<SettingsBuilding[]>([
    { id: 'building-1', name: 'Riverside Gardens', address: '123 Thames Street, London', units: 45, status: 'active' },
    { id: 'building-2', name: 'Victoria Heights', address: '456 Victoria Road, London', units: 32, status: 'active' },
    { id: 'building-3', name: 'Canary Wharf Towers', address: '789 Canary Wharf, London', units: 78, status: 'active' }
  ]);
  
  // User Management State
  const [users, setUsers] = useState<SettingsUser[]>([
    { id: '1', name: 'John Manager', email: 'john@riverside.com', role: 'manager', status: 'active', buildings: ['building-1'] },
    { id: '2', name: 'Sarah Admin', email: 'sarah@victoria.com', role: 'admin', status: 'active', buildings: ['building-2'] },
    { id: '3', name: 'Mike Resident', email: 'mike@canary.com', role: 'resident', status: 'active', buildings: ['building-3'] }
  ]);
  
  // Financial Year State
  const [financialYear, setFinancialYear] = useState<FinancialYear>({
    startMonth: 4, // April
    startDay: 1,
    currentYear: 2024,
    budgetLockDate: '2024-03-31',
    serviceChargeFrequency: 'quarterly',
    groundRentFrequency: 'annually'
  });
  

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">System Settings</h1>
            <p className="text-neutral-600">
              Configure buildings, manage users, set up financial parameters, and control security settings.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('buildings')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'buildings'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <BuildingIcon className="w-4 h-4" />
                Building Management
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Users className="w-4 h-4" />
                User Management
              </button>
              <button
                onClick={() => handleTabChange('financial')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'financial'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Financial Setup
              </button>
              <button
                onClick={() => handleTabChange('appearance')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'appearance'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                Appearance
              </button>
            </nav>
            
            {/* Add Building Button - Aligned with tab headers */}
            {activeTab === 'buildings' && (
              <button
                onClick={() => {
                  // Trigger the add building action
                  const addButton = document.querySelector('[data-add-building-button]') as HTMLButtonElement;
                  if (addButton) {
                    addButton.click();
                  }
                }}
                className="btn-primary flex items-center font-inter"
              >
                Add Building
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {loading ? (
            <TabLoadingSkeleton />
          ) : (
            <>
              {/* Building Management Tab */}
              {activeTab === 'buildings' && (
                <BuildingManagement 
                  buildings={buildings} 
                  setBuildings={setBuildings}
                  addNotification={addNotification}
                  currentUser={currentUser}
                />
              )}

              {/* User Management Tab */}
              {activeTab === 'users' && (
                <UserManagement 
                  users={users} 
                  setUsers={setUsers}
                  buildings={buildings}
                  addNotification={addNotification}
                  currentUser={currentUser}
                />
              )}

              {/* Financial Setup Tab */}
              {activeTab === 'financial' && (
                <FinancialSetup 
                  financialYear={financialYear}
                  setFinancialYear={setFinancialYear}
                  addNotification={addNotification}
                  currentUser={currentUser}
                />
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <AppearanceSettings 
                  addNotification={addNotification}
                  currentUser={currentUser}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
