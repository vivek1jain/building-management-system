import React from 'react';
import { BudgetValidationResult } from '../../types';
import { AlertTriangle, CheckCircle, Info, Lightbulb, X } from 'lucide-react';

interface BudgetValidationPanelProps {
  validation: BudgetValidationResult | null;
  onClose?: () => void;
  className?: string;
}

export const BudgetValidationPanel: React.FC<BudgetValidationPanelProps> = ({
  validation,
  onClose,
  className = ''
}) => {
  if (!validation) return null;

  const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0;
  
  if (!hasIssues) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">
            Budget validation passed - no issues found
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Budget Validation</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
          <span>Total: {validation.totalPercentage}%</span>
          <span>Valid: {validation.isValid ? 'Yes' : 'No'}</span>
          <span>Validated: {validation.validatedAt.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Errors */}
        {validation.errors.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <h4 className="text-sm font-medium text-red-800">
                Errors ({validation.errors.length})
              </h4>
            </div>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
              <h4 className="text-sm font-medium text-amber-800">
                Warnings ({validation.warnings.length})
              </h4>
            </div>
            <ul className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {validation.suggestions.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-800">
                Suggestions ({validation.suggestions.length})
              </h4>
            </div>
            <ul className="space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {validation.errors.length > 0 && 'Fix errors before proceeding'}
            {validation.errors.length === 0 && validation.warnings.length > 0 && 'Review warnings before proceeding'}
            {validation.errors.length === 0 && validation.warnings.length === 0 && validation.suggestions.length > 0 && 'Consider suggestions for improvement'}
          </span>
          <div className="flex items-center space-x-2">
            {validation.errors.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                {validation.errors.length} Error{validation.errors.length !== 1 ? 's' : ''}
              </span>
            )}
            {validation.warnings.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
                {validation.warnings.length} Warning{validation.warnings.length !== 1 ? 's' : ''}
              </span>
            )}
            {validation.suggestions.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                {validation.suggestions.length} Tip{validation.suggestions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetValidationPanel;