import React from 'react';
import { User, Notification } from '../../types';
import DataCleanupCompact from '../Testing/DataCleanupCompact';
import FinancialYearTestCompact from '../Testing/FinancialYearTestCompact';
import TestingUtilitiesCompact from '../Testing/TestingUtilitiesCompact';
import UIDiagnostics from '../Testing/UIDiagnostics';
import { Card, CardContent } from '../UI';

interface TestingSettingsProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const TestingSettings: React.FC<TestingSettingsProps> = ({ 
  currentUser, 
  addNotification 
}) => {
  
  // Allow admin and manager users to access testing features
  const canAccessTesting = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (!canAccessTesting) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <h3 className="font-medium text-yellow-800 mb-2">Manager or Administrator Access Required</h3>
        <p className="text-yellow-700">
          The testing features are only available to users with manager or administrative privileges.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Testing Tools</h2>
        <p className="text-neutral-600">
          Development and QA tools for testing, debugging, and data management.
        </p>
      </div>

      {/* Testing Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <Card className="border border-neutral-200 h-full">
          <CardContent className="pt-4 pb-4 h-full">
            <UIDiagnostics />
          </CardContent>
        </Card>
        
        <Card className="border border-neutral-200 h-full">
          <CardContent className="pt-4 pb-4 h-full">
            <FinancialYearTestCompact />
          </CardContent>
        </Card>
        
        <Card className="border border-neutral-200 h-full">
          <CardContent className="pt-4 pb-4 h-full">
            <DataCleanupCompact 
              currentUser={currentUser}
              addNotification={addNotification}
            />
          </CardContent>
        </Card>
        
        <Card className="border border-neutral-200 h-full">
          <CardContent className="pt-4 pb-4 h-full">
            <TestingUtilitiesCompact 
              currentUser={currentUser}
              addNotification={addNotification}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestingSettings;
