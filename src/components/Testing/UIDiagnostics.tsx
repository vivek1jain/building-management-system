import { AlertCircle, CheckCircle, XCircle, Search, Play, HelpCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '../UI';

interface Issue {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

const UIDiagnostics: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'quick' | 'comprehensive'>('quick');
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);

  const runQuickScan = () => {
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
          description: `Found ${importExportButtons.length} import/export buttons.`
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
            title: `Search Input Overlap #${index + 1}`,
            severity: 'medium',
            description: `${paddingLeft}px padding may cause icon overlap.`
          });
        }
      });

      // Check for missing DataTable components
      const tables = document.querySelectorAll('table');
      if (tables.length === 0) {
        foundIssues.push({
          id: 'no-datatables',
          title: 'No Tables Found',
          severity: 'low',
          description: 'Navigate to Building Data to test tables.'
        });
      }

      setIssues(foundIssues);
      setIsScanning(false);
    }, 800);
  };

  const runComprehensiveScan = () => {
    setIsScanning(true);
    setIssues([]);

    setTimeout(() => {
      const foundIssues: Issue[] = [];

      // Run all quick scan checks
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
          description: `Found ${importExportButtons.length} import/export buttons.`
        });
      }

      // Check DataTables
      const tables = document.querySelectorAll('table, [data-component="datatable"]');
      if (tables.length === 0) {
        foundIssues.push({
          id: 'no-datatables',
          title: 'No DataTables Found',
          severity: 'medium',
          description: 'Navigate to data pages to test tables.'
        });
      }

      // Check accessibility
      const buttonsWithoutLabels = document.querySelectorAll('button:not([aria-label]):not([title])');
      if (buttonsWithoutLabels.length > 5) {
        foundIssues.push({
          id: 'missing-aria',
          title: 'Missing Accessibility Labels',
          severity: 'medium',
          description: `${buttonsWithoutLabels.length} buttons lack labels.`
        });
      }

      // Check theme support
      const themeToggle = document.querySelector('[data-theme-toggle], button[aria-label*="theme"]');
      if (!themeToggle) {
        foundIssues.push({
          id: 'no-theme-toggle',
          title: 'Theme Toggle Missing',
          severity: 'low',
          description: 'No theme toggle found.'
        });
      }

      setIssues(foundIssues);
      setIsScanning(false);
    }, 1500);
  };

  useEffect(() => {
    if (activeMode === 'quick') {
      runQuickScan();
    }
  }, [activeMode]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="w-3 h-3 text-red-600" />;
      case 'medium': return <AlertCircle className="w-3 h-3 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-3 h-3 text-blue-600" />;
      default: return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-neutral-200 bg-neutral-50';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Search className="h-4 w-4 text-green-700" />
          </div>
          <h3 className="text-base font-semibold">UI Diagnostics</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">UI Diagnostics & Testing</p>
            <p className="mb-2">Scan your application for common UI issues and component problems.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Quick:</strong> Fast scan for common issues</li>
              <li><strong>Comprehensive:</strong> Detailed component testing</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveMode('quick')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              activeMode === 'quick'
                ? 'bg-green-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Quick
          </button>
          <button
            onClick={() => setActiveMode('comprehensive')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              activeMode === 'comprehensive'
                ? 'bg-green-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Full
          </button>
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {isScanning && (
            <div className="text-center py-4 text-xs text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-1"></div>
              Scanning...
            </div>
          )}

          {!isScanning && issues.length === 0 && (
            <div className="text-center py-4 bg-green-50 rounded border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-green-900">All Good!</p>
            </div>
          )}

          {!isScanning && issues.length > 0 && (
            <>
              <p className="text-xs font-medium text-neutral-700">{issues.length} issue{issues.length !== 1 ? 's' : ''}</p>
              {issues.map((issue) => (
                <div key={issue.id} className={`p-2 rounded border ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-900 truncate">{issue.title}</p>
                      <p className="text-xs text-neutral-600 line-clamp-2">{issue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mt-auto pt-2">
        <Button
          onClick={() => activeMode === 'quick' ? runQuickScan() : runComprehensiveScan()}
          disabled={isScanning}
          className="text-xs px-3 py-1.5 h-7 flex items-center justify-center gap-1"
        >
          {isScanning ? <Search className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {isScanning ? 'Scanning...' : 'Run Scan'}
        </Button>
      </div>
    </div>
  );
};

export default UIDiagnostics;
