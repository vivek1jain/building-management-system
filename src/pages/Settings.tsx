import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building as BuildingIcon, 
  Users, 
  Calendar, 
  Shield,
  Palette,
  TestTube
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { BuildingManagement } from '../components/Settings/BuildingManagement';
import { UserManagement } from '../components/Settings/UserManagement';
import { FinancialSetup } from '../components/Settings/FinancialSetup';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { AppearanceSettings } from '../components/Settings/AppearanceSettings';
import { TestingSettings } from '../components/Settings/TestingSettings';
import { Button, Card, CardContent } from '../components/UI';

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
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'buildings' | 'users' | 'financial' | 'security' | 'appearance' | 'testing'>('buildings');
  
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
  
  // Security/Whitelist State
  const [securitySettings, setSecuritySettings] = useState({
    allowedDomains: ['riverside.com', 'victoria.com', 'canary.com'],
    requireEmailVerification: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-neutral-900">System Settings</h1>
          </div>
          <p className="text-neutral-600">
            Configure buildings, manage users, set up financial parameters, and control security settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6">
          <div className="flex border-b border-neutral-200">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('buildings')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors rounded-none border-b-2 ${
                activeTab === 'buildings'
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
              }`}
            >
              <BuildingIcon className="w-5 h-5" />
              Building Management
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors rounded-none border-b-2 ${
                activeTab === 'users'
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
              }`}
            >
              <Users className="w-5 h-5" />
              User Management
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors rounded-none border-b-2 ${
                activeTab === 'financial'
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Financial Setup
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors rounded-none border-b-2 ${
                activeTab === 'security'
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
              }`}
            >
              <Shield className="w-5 h-5" />
              Security & Access
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors rounded-none border-b-2 ${
                activeTab === 'appearance'
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
              }`}
            >
              <Palette className="w-5 h-5" />
              Appearance
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('testing')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors rounded-none border-b-2 ${
                activeTab === 'testing'
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
              }`}
            >
              <TestTube className="w-5 h-5" />
              Testing
            </Button>
          </div>
        </Card>

        {/* Tab Content */}
        <Card>
          <CardContent>
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

          {/* Security & Access Tab */}
          {activeTab === 'security' && (
            <SecuritySettings 
              securitySettings={securitySettings}
              setSecuritySettings={setSecuritySettings}
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

          {/* Testing Tab */}
          {activeTab === 'testing' && (
            <TestingSettings 
              addNotification={addNotification}
              currentUser={currentUser}
            />
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
