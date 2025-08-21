import React, { useState } from 'react';
import { Save, Shield, Plus, X, AlertTriangle } from 'lucide-react';

interface SecuritySettings {
  allowedDomains: string[];
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

interface SecuritySettingsProps {
  securitySettings: SecuritySettings;
  setSecuritySettings: React.Dispatch<React.SetStateAction<SecuritySettings>>;
  addNotification: (notification: any) => void;
  currentUser: any;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  securitySettings,
  setSecuritySettings,
  addNotification,
  currentUser
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  const handleSave = () => {
    addNotification({
      userId: currentUser?.id || '',
      title: 'Security Settings Saved',
      message: 'Security and access control settings have been updated successfully.',
      type: 'success'
    });
    setHasChanges(false);
  };

  const updateSecuritySettings = (updates: Partial<SecuritySettings>) => {
    setSecuritySettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Invalid Domain',
        message: 'Please enter a valid domain name (e.g., example.com).',
        type: 'error'
      });
      return;
    }

    if (securitySettings.allowedDomains.includes(newDomain.trim())) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Domain Already Exists',
        message: 'This domain is already in the whitelist.',
        type: 'error'
      });
      return;
    }

    updateSecuritySettings({
      allowedDomains: [...securitySettings.allowedDomains, newDomain.trim()]
    });
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    updateSecuritySettings({
      allowedDomains: securitySettings.allowedDomains.filter(d => d !== domain)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {hasChanges && (
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Whitelist */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-medium text-neutral-900">Domain Whitelist</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Only users with email addresses from these domains can register or be invited to the system.
          </p>

          <div className="space-y-3">
            {securitySettings.allowedDomains.map((domain, index) => (
              <div key={index} className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-md">
                <span className="text-sm font-medium text-neutral-900">{domain}</span>
                <button
                  onClick={() => removeDomain(domain)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g., company.com"
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            />
            <button
              onClick={addDomain}
              className="inline-flex items-center gap-2 px-3 py-2 bg-success-600 text-white rounded-md hover:bg-success-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Authentication Settings */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Authentication Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-700">
                  Require Email Verification
                </label>
                <p className="text-xs text-neutral-500">
                  New users must verify their email before accessing the system
                </p>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.requireEmailVerification}
                onChange={(e) => updateSecuritySettings({ requireEmailVerification: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={securitySettings.sessionTimeout}
                onChange={(e) => updateSecuritySettings({ sessionTimeout: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Users will be automatically logged out after this period of inactivity
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Maximum Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => updateSecuritySettings({ maxLoginAttempts: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Account will be temporarily locked after this many failed login attempts
              </p>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Security Policies</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-neutral-900 mb-3">Password Requirements</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Minimum 8 characters</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Require uppercase letter</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Require number</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Require special character</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-neutral-900 mb-3">Access Control</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Enable role-based access control</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Log all admin actions</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Enable IP address restrictions</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" />
                  <span className="ml-2 text-sm text-neutral-700">Require two-factor authentication</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="lg:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Security Recommendations</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Consider enabling two-factor authentication for admin accounts</li>
                <li>• Regularly review and update domain whitelist</li>
                <li>• Monitor failed login attempts and suspicious activity</li>
                <li>• Ensure all users have strong, unique passwords</li>
                <li>• Keep the system updated with latest security patches</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
