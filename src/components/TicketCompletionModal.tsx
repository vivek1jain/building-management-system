import React, { useState } from 'react';
import { PoundSterling, CheckCircle, X } from 'lucide-react';
import Modal from './UI/Modal';
import { ExpenseCategorySelector } from './Expenses/ExpenseCategorySelector';

interface TicketCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (finalCost: number, expenseCategory: string, notes?: string) => void;
  isSubmitting?: boolean;
  ticketTitle: string;
  estimatedCost?: number; // From quotes or initial estimation
  currentExpenseCategory?: string; // Pre-selected category from ticket
}

const TicketCompletionModal: React.FC<TicketCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  isSubmitting = false,
  ticketTitle,
  estimatedCost,
  currentExpenseCategory
}) => {
  const [finalCost, setFinalCost] = useState<string>(estimatedCost ? estimatedCost.toString() : '');
  const [expenseCategory, setExpenseCategory] = useState<string>(currentExpenseCategory || '');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{ finalCost?: string; expenseCategory?: string }>({});
  const [showCategoryError, setShowCategoryError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { finalCost?: string; expenseCategory?: string } = {};
    
    if (!finalCost.trim()) {
      newErrors.finalCost = 'Final cost is required';
    } else {
      const costValue = parseFloat(finalCost);
      if (isNaN(costValue) || costValue <= 0) {
        newErrors.finalCost = 'Please enter a valid amount greater than 0';
      }
    }
    
    if (!expenseCategory.trim()) {
      newErrors.expenseCategory = 'Expense category is required';
      setShowCategoryError(true);
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onComplete(parseFloat(finalCost), expenseCategory, notes.trim() || undefined);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setFinalCost(estimatedCost ? estimatedCost.toString() : '');
      setExpenseCategory(currentExpenseCategory || '');
      setNotes('');
      setErrors({});
      setShowCategoryError(false);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getVarianceInfo = () => {
    if (!estimatedCost || !finalCost.trim()) return null;
    
    const finalAmount = parseFloat(finalCost);
    if (isNaN(finalAmount)) return null;
    
    const variance = finalAmount - estimatedCost;
    const percentageVariance = (variance / estimatedCost) * 100;
    
    return {
      amount: variance,
      percentage: percentageVariance,
      isOver: variance > 0
    };
  };

  const variance = getVarianceInfo();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Work Order"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticket Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Completing Work Order
              </h3>
              <p className="text-sm text-blue-700 mb-2">{ticketTitle}</p>
              <p className="text-xs text-blue-600">
                Please confirm the final cost before marking this work as complete.
                This will create an expense forecast for invoice tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Estimated vs Final Cost Comparison */}
        {estimatedCost && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Cost Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Original Estimate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(estimatedCost)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Final Cost</p>
                <p className="text-lg font-semibold text-gray-900">
                  {finalCost.trim() && !isNaN(parseFloat(finalCost)) 
                    ? formatCurrency(parseFloat(finalCost)) 
                    : '—'
                  }
                </p>
              </div>
            </div>
            
            {/* Variance Display */}
            {variance && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Variance:</span>
                  <span className={`font-medium ${
                    variance.isOver ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {variance.isOver ? '+' : ''}{formatCurrency(variance.amount)}
                    {' '}({variance.isOver ? '+' : ''}{variance.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expense Category and Final Cost - Horizontal Layout */}
        <div className="flex gap-4">
          {/* Expense Category Input - 2/3 width */}
          <div className="w-2/3">
            <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <ExpenseCategorySelector
              value={expenseCategory}
              onChange={(category) => {
                setExpenseCategory(category);
                setShowCategoryError(false);
                if (errors.expenseCategory) {
                  setErrors(prev => ({ ...prev, expenseCategory: undefined }));
                }
              }}
              required
              showError={showCategoryError}
              errorMessage="Please select an expense category to track this cost against your budget"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Final Cost Input - 1/3 width */}
          <div className="w-1/3">
            <label htmlFor="finalCost" className="block text-sm font-medium text-gray-700 mb-2">
              Final Cost <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PoundSterling className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="finalCost"
                type="number"
                step="0.01"
                min="0"
                value={finalCost}
                onChange={(e) => {
                  setFinalCost(e.target.value);
                  // Clear error when user types
                  if (errors.finalCost) {
                    setErrors(prev => ({ ...prev, finalCost: undefined }));
                  }
                }}
                disabled={isSubmitting}
                className={`w-full h-10 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errors.finalCost
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                placeholder="Enter final cost (e.g., 150.00)"
              />
            </div>
            {errors.finalCost && (
              <p className="mt-1 text-sm text-red-600">{errors.finalCost}</p>
            )}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label htmlFor="completionNotes" className="block text-sm font-medium text-gray-700 mb-2">
            Completion Notes (Optional)
          </label>
          <textarea
            id="completionNotes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Add any notes about the completion, cost changes, or additional work performed..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TicketCompletionModal;
