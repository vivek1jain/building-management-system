import React, { useState } from 'react';
import { 
  Shield,
  TestTube,
  Share2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { TestingSettings } from '../components/Settings/TestingSettings';
import { SharingSettings } from '../components/Settings/SharingSettings';
import { Button, Card, CardContent, TabLoadingSkeleton } from '../components/UI';

const Admin: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  
  // State for active tab and loading
  const [activeTab, setActiveTab] = useState<'security' | 'testing' | 'sharing'>('security');
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
            <p className="text-neutral-600">
              Manage system security, access controls, and testing configurations.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;