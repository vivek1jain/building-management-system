import React, { useState } from 'react';
import { TestTube, Database, Settings, ChevronRight } from 'lucide-react';
import { User, Notification } from '../../types';
import UITestSuite from '../Testing/UITestSuite';
import DiagnosticTest from '../Testing/DiagnosticTest';
import DataCleanup from '../Testing/DataCleanup';
import TestingUtilities from '../Testing/TestingUtilities';
import { Card, CardContent } from '../UI';

interface TestingSettingsProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const TestingSettings: React.FC<TestingSettingsProps> = ({ 
  currentUser, 
  addNotification 
}) => {
  const [activeSection, setActiveSection] = useState<'diagnostics' | 'ui-tests' | 'data-cleanup' | 'utilities'>('diagnostics');
  
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

  const sections = [
    {
      id: 'diagnostics' as const,
      title: 'Quick Diagnostics',
      description: 'Scan for common UI issues and problems',
      icon: <TestTube className="w-5 h-5" />
    },
    {
      id: 'ui-tests' as const,
      title: 'UI Test Suite', 
      description: 'Comprehensive component and functionality testing',
      icon: <TestTube className="w-5 h-5" />
    },
    {
      id: 'data-cleanup' as const,
      title: 'Data Cleanup',
      description: 'Remove test data from Firestore collections',
      icon: <Database className="w-5 h-5" />
    },
    {
      id: 'utilities' as const,
      title: 'Testing Utilities',
      description: 'Debug tools, theme testing, and performance monitoring',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Testing Environment</h2>
        <p className="text-neutral-600">
          Comprehensive testing tools for development and quality assurance.
          Use these tools to validate components, clean test data, and debug issues.
        </p>
      </div>

      {/* Section Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`cursor-pointer transition-all bg-white rounded-lg border p-4 ${
              activeSection === section.id 
                ? 'ring-2 ring-primary-500 border-primary-200' 
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => setActiveSection(section.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  activeSection === section.id 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {section.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-neutral-900 text-sm truncate">{section.title}</h3>
                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{section.description}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${
                activeSection === section.id ? 'rotate-90 text-primary-600' : 'text-neutral-400'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Active Section Content */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        {activeSection === 'diagnostics' && (
          <DiagnosticTest />
        )}
        
        {activeSection === 'ui-tests' && (
          <UITestSuite />
        )}
        
        {activeSection === 'data-cleanup' && (
          <DataCleanup 
            currentUser={currentUser}
            addNotification={addNotification}
          />
        )}
        
        {activeSection === 'utilities' && (
          <TestingUtilities 
            currentUser={currentUser}
            addNotification={addNotification}
          />
        )}
      </div>
    </div>
  );
};

export default TestingSettings;
