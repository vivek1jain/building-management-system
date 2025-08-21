import React from 'react';
import { User, Notification } from '../../types';
import UITestSuite from '../Testing/UITestSuite';
import DiagnosticTest from '../Testing/DiagnosticTest';

interface TestingSettingsProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const TestingSettings: React.FC<TestingSettingsProps> = ({ 
  currentUser, 
  addNotification 
}) => {
  // Only allow admin users to access testing features
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <h3 className="font-medium text-yellow-800 mb-2">Administrator Access Required</h3>
        <p className="text-yellow-700">
          The testing features are only available to users with administrative privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Component Testing</h2>
        <p className="text-neutral-600 mb-6">
          This testing environment allows you to validate migrated UI components and identify potential issues.
          The test suite automatically checks for rendering issues, search functionality, button consistency,
          theme system, and accessibility features.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <DiagnosticTest />
      </div>

      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <UITestSuite />
      </div>
    </div>
  );
};

export default TestingSettings;
