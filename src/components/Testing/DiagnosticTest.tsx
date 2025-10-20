import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Search as SearchIcon } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

const DiagnosticTest: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const runDiagnostic = () => {
    setIsScanning(true);
    setIssues([]);

    setTimeout(() => {
      const foundIssues: Issue[] = [];

      // Check for multiple BulkImportExport buttons
      const importButtons = document.querySelectorAll('button');
      const importExportButtons = Array.from(importButtons).filter(btn => 
        btn.textContent?.toLowerCase().includes('import') || 
        btn.textContent?.toLowerCase().includes('export')
      );
      
      if (importExportButtons.length > 4) {
        foundIssues.push({
          id: 'duplicate-bulk-buttons',
          title: 'Multiple Import/Export Buttons',
          severity: 'high',
          description: `Found ${importExportButtons.length} import/export buttons. Each DataTable component may be rendering its own BulkImportExport component.`,
          fix: 'Move BulkImportExport to the parent BuildingDataManagement component and pass data to it.'
        });
      }

      // Check for search icon/text overlap
      const searchInputs = document.querySelectorAll('input[placeholder*="Search"], input[placeholder*="search"]');
      searchInputs.forEach((input, index) => {
        const htmlInput = input as HTMLInputElement;
        const computedStyle = window.getComputedStyle(htmlInput);
        const paddingLeft = parseInt(computedStyle.paddingLeft);
        
        if (paddingLeft < 40) {
          foundIssues.push({
            id: `search-overlap-${index}`,
            title: `Search Input Icon Overlap #${index + 1}`,
            severity: 'medium',
            description: `Search input has ${paddingLeft}px left padding, which may cause icon overlap.`,
            fix: 'Increase left padding to at least 40px or adjust icon positioning.'
          });
        }
      });

      // Check for missing DataTable components
      const tables = document.querySelectorAll('table');
      if (tables.length === 0) {
        foundIssues.push({
          id: 'no-datatables',
          title: 'No DataTable Components Found',
          severity: 'high',
          description: 'No table elements found in the current view.',
          fix: 'Navigate to Building Data Management page to test DataTable components.'
        });
      }

      // Check for theme toggle
      const themeToggle = document.querySelector('[data-theme-toggle], button[aria-label*="theme"], button[title*="theme"]');
      if (!themeToggle) {
        foundIssues.push({
          id: 'no-theme-toggle',
          title: 'Theme Toggle Missing',
          severity: 'low',
          description: 'No theme toggle button found.',
          fix: 'Add theme toggle functionality to the header or settings.'
        });
      }

      setIssues(foundIssues);
      setIsScanning(false);
    }, 1000);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-primary-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-neutral-200 bg-neutral-50';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Quick Diagnostic</h3>
        <button
          onClick={runDiagnostic}
          disabled={isScanning}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          <SearchIcon className="w-4 h-4" />
          {isScanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {isScanning && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Scanning for UI issues...</p>
        </div>
      )}

      {!isScanning && issues.length === 0 && (
        <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-2" />
          <h4 className="text-lg font-medium text-green-900">No Issues Found</h4>
          <p className="text-green-700">All scanned components appear to be working correctly.</p>
        </div>
      )}

      {!isScanning && issues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-neutral-900">
            Found {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </h4>
          {issues.map((issue) => (
            <div key={issue.id} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
              <div className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <h5 className="font-medium text-neutral-900">{issue.title}</h5>
                  <p className="text-sm text-neutral-700 mt-1">{issue.description}</p>
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs font-medium text-neutral-600">Fix:</p>
                    <p className="text-xs text-neutral-700">{issue.fix}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagnosticTest;
