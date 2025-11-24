import { 
  Shield,
  TestTube,
  Share2,
  Database
} from 'lucide-react';
import React, { useState } from 'react';
import { LedgerBackfillUtility, TicketAutoCloseUtility } from '../components/Admin';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { SharingSettings } from '../components/Settings/SharingSettings';
import { TestingSettings } from '../components/Settings/TestingSettings';
import { Button, Card, CardContent, TabLoadingSkeleton } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const Admin: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  
  // State for active tab and loading
  const [activeTab, setActiveTab] = useState<'security' | 'testing' | 'sharing' | 'data'>('security');
  const [loading, setLoading] = useState(false);
  
  const handleTabChange = async (tab: typeof activeTab) => {
    setLoading(true);
    setActiveTab(tab);
    // Simulate loading delay for admin settings
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };
  
  // Security/Whitelist State
  const [securitySettings, setSecuritySettings] = useState({
    allowedDomains: ['riverside.com', 'victoria.com', 'canary.com'],
    requireEmailVerification: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Admin</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div>
          <div className="flex items-center justify-between">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('security')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                Security & Access
              </button>
              <button
                onClick={() => handleTabChange('testing')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'testing'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <TestTube className="w-4 h-4" />
                Testing
              </button>
              <button
                onClick={() => handleTabChange('sharing')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sharing'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Sharing
              </button>
              <button
                onClick={() => handleTabChange('data')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'data'
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Database className="w-4 h-4" />
                Data Tools
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {loading ? (
            <TabLoadingSkeleton />
          ) : (
            <>
              {/* Security & Access Tab */}
              {activeTab === 'security' && (
                <SecuritySettings 
                  securitySettings={securitySettings}
                  setSecuritySettings={setSecuritySettings}
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

              {/* Sharing Tab */}
              {activeTab === 'sharing' && (
                <SharingSettings 
                  addNotification={addNotification}
                  currentUser={currentUser}
                />
              )}

              {/* Data Tools Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Data Management Tools</h2>
                    <p className="text-sm text-neutral-600">
                      Administrative utilities for data synchronization and maintenance.
                    </p>
                  </div>
                  <TicketAutoCloseUtility />
                  <LedgerBackfillUtility />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;