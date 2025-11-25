import React, { useState } from 'react';
import { User, Notification } from '../../types';
import DataCleanupCompact from '../Testing/DataCleanupCompact';
// import FinancialYearTestCompact from '../Testing/FinancialYearTestCompact';
// import TestingUtilitiesCompact from '../Testing/TestingUtilitiesCompact';
import UIDiagnostics, { Issue } from '../Testing/UIDiagnostics';
import AdminUtilitiesCompact from '../Testing/AdminUtilitiesCompact';
import BuildingDataCompact from '../Testing/BuildingDataCompact';
// import UtilitiesCompact from '../Testing/UtilitiesCompact';
import { Card, CardContent } from '../UI';
import { ChevronDown, ChevronRight, AlertCircle, XCircle, CheckCircle } from 'lucide-react';

interface TestingSettingsProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const TestingSettings: React.FC<TestingSettingsProps> = ({ 
  currentUser, 
  addNotification 
}) => {
  const [diagnosticIssues, setDiagnosticIssues] = useState<Issue[] | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

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

  console.log('TestingSettings: Starting render');
  
  try {
    return (
    <div className="space-y-6">
      {/* Testing Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <Card className="border border-neutral-200 h-full">
          <CardContent className="py-1.5 h-full">
            <UIDiagnostics onIssuesFound={setDiagnosticIssues} />
          </CardContent>
        </Card>
        
        <Card className="border border-neutral-200 h-full">
          <CardContent className="py-1.5 h-full">
            <AdminUtilitiesCompact />
          </CardContent>
        </Card>
        
        <Card className="border border-neutral-200 h-full">
          <CardContent className="py-1.5 h-full">
            <DataCleanupCompact 
              currentUser={currentUser}
              addNotification={addNotification}
            />
          </CardContent>
        </Card>
        
        <Card className="border border-neutral-200 h-full">
          <CardContent className="py-1.5 h-full">
            <BuildingDataCompact currentUser={currentUser} addNotification={addNotification} />
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic Issues Display - Full Width Below Grid */}
      {diagnosticIssues && diagnosticIssues.length === 0 && (
        <div className="mt-4 border border-green-200 bg-green-50 rounded-lg px-4 py-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm text-green-900">All Clear!</h4>
            <p className="text-xs text-green-700 mt-0.5">No accessibility or HTML issues found.</p>
          </div>
        </div>
      )}

      {diagnosticIssues && diagnosticIssues.length > 0 && (
        <div className="mt-4 space-y-2">
          {diagnosticIssues.map((issue) => {
            const isExpanded = expandedIssue === issue.id;
            return (
              <div key={issue.id} className={`border rounded-lg ${
                issue.severity === 'high' ? 'border-red-200 bg-red-50' :
                issue.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                {/* Issue Header */}
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    {issue.severity === 'high' ? (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                        issue.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    )}
                    <div className="text-left">
                      <h4 className="font-semibold text-sm text-neutral-900">{issue.title}</h4>
                      <p className="text-xs text-neutral-600 mt-0.5">{issue.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                      issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.count} found
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neutral-600" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-current/10">
                    <p className="text-xs font-medium text-neutral-700 mt-3 mb-2">
                      Showing first {Math.min(issue.elements.length, 5)} occurrence{issue.elements.length !== 1 ? 's' : ''}:
                    </p>
                    {issue.elements.map((element, idx) => (
                      <div key={idx} className="bg-white rounded border border-neutral-200 p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <code className="text-xs font-mono text-purple-600">{element.selector}</code>
                        </div>
                        <div className="text-xs text-neutral-600 mb-1">
                          <span className="font-medium">Path:</span> {element.path}
                        </div>
                        <div className="mt-2 p-2 bg-neutral-50 rounded">
                          <code className="text-xs text-neutral-700 break-all">{element.html}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('TestingSettings render error:', error);
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <h3 className="font-medium text-red-800 mb-2">Error Loading Testing Tools</h3>
        <p className="text-red-700">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }
};

export default TestingSettings;
