import { Plus, Trash2, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { budgetValidationService } from '../../services/budgetValidationService';
import { BudgetCategoryItem, BudgetValidationResult } from '../../types';
import { calculatePercentage, calculateAmountFromPercentage, autoAdjustPercentages } from '../../utils/budgetValidation';
import { Button } from '../UI';
import { BudgetHealthDashboard } from './BudgetHealthDashboard';
import { BudgetValidationPanel } from './BudgetValidationPanel';

interface BudgetFormWithValidationProps {
  buildingId: string;
  initialCategories?: BudgetCategoryItem[];
  initialTotalBudget?: number;
  onSave?: (categories: BudgetCategoryItem[], totalBudget: number) => void;
  className?: string;
}

export const BudgetFormWithValidation: React.FC<BudgetFormWithValidationProps> = ({
  buildingId,
  initialCategories = [],
  initialTotalBudget = 0,
  onSave,
  className = ''
}) => {
  const [categories, setCategories] = useState<BudgetCategoryItem[]>(initialCategories);
  const [totalBudget, setTotalBudget] = useState(initialTotalBudget);
  const [validation, setValidation] = useState<BudgetValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);
  const [validationContext, setValidationContext] = useState<any>(null);

  // Load building context on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const context = await budgetValidationService.getBuildingContext(buildingId);
        setValidationContext(context);
      } catch (error) {
        console.error('Error loading building context:', error);
      }
    };
    
    if (buildingId) {
      loadContext();
    }
  }, [buildingId]);

  // Real-time validation
  useEffect(() => {
    const validateCategories = async () => {
      if (categories.length === 0 || !buildingId) return;
      
      setIsValidating(true);
      try {
        const result = await budgetValidationService.validateCategoriesRealTime(
          categories,
          totalBudget,
          buildingId
        );
        setValidation(result);
      } catch (error) {
        console.error('Real-time validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation
    const timer = setTimeout(validateCategories, 500);
    return () => clearTimeout(timer);
  }, [categories, totalBudget, buildingId]);

  // Add new category
  const addCategory = () => {
    const newCategory: BudgetCategoryItem = {
      id: `temp-${Date.now()}`,
      budgetId: '',
      categoryMasterId: '',
      name: '',
      type: 'expenditure',
      budgetAmount: 0,
      percentageOfTotal: 0,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 0,
      approvalThreshold: 1000,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCategories([...categories, newCategory]);
  };

  // Remove category
  const removeCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  // Update category
  const updateCategory = (index: number, field: keyof BudgetCategoryItem, value: any) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    
    // Auto-calculate percentage if amount changed
    if (field === 'budgetAmount' && totalBudget > 0) {
      updatedCategories[index].percentageOfTotal = calculatePercentage(value, totalBudget);
    }
    
    // Auto-calculate amount if percentage changed
    if (field === 'percentageOfTotal' && totalBudget > 0) {
      updatedCategories[index].budgetAmount = calculateAmountFromPercentage(value, totalBudget);
    }
    
    setCategories(updatedCategories);
  };

  // Auto-adjust percentages to total 100%
  const handleAutoAdjust = () => {
    const adjustedCategories = autoAdjustPercentages(categories);
    setCategories(adjustedCategories);
  };

  // Update total budget and recalculate amounts
  const handleTotalBudgetChange = (newTotal: number) => {
    setTotalBudget(newTotal);
    
    if (newTotal > 0 && categories.length > 0) {
      const updatedCategories = categories.map(cat => ({
        ...cat,
        budgetAmount: calculateAmountFromPercentage(cat.percentageOfTotal, newTotal)
      }));
      setCategories(updatedCategories);
    }
  };

  // Calculate totals
  const totalAmount = categories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

  // Validation status
  const isValid = validation?.isValid ?? false;
  const hasWarnings = validation?.hasWarnings ?? false;
  const hasSuggestions = validation?.hasSuggestions ?? false;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with validation status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Budget Categories</h2>
        <div className="flex items-center space-x-4">
          {/* Validation status indicator */}
          <div className="flex items-center space-x-2">
            {isValidating ? (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            ) : validation ? (
              isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )
            ) : null}
            <span className="text-sm text-gray-600">
              {isValidating ? 'Validating...' : 
               validation ? (isValid ? 'Valid' : 'Issues Found') : 'Not Validated'}
            </span>
          </div>
          
          <Button
            onClick={() => setShowHealthDashboard(!showHealthDashboard)}
            variant="outline"
            size="sm"
          >
            {showHealthDashboard ? 'Hide' : 'Show'} Health Dashboard
          </Button>
        </div>
      </div>

      {/* Total Budget Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Budget Amount
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => handleTotalBudgetChange(Number(e.target.value))}
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
          />
          {validationContext?.previousYearBudget && (
            <span className="text-sm text-gray-500">
              Last year: £{validationContext.previousYearBudget.toLocaleString()}
            </span>
          )}
          {validationContext?.totalSqFt && totalBudget > 0 && (
            <span className="text-sm text-gray-500">
              Rate: £{(totalBudget / validationContext.totalSqFt).toFixed(2)}/sq ft
            </span>
          )}
        </div>
      </div>

      {/* Budget Health Dashboard */}
      {showHealthDashboard && validationContext && (
        <BudgetHealthDashboard
          categories={categories}
          totalBudget={totalBudget}
          ratePerSqFt={validationContext.totalSqFt ? totalBudget / validationContext.totalSqFt : 0}
          previousYearRate={validationContext.previousYearRate}
          buildingAge={validationContext.buildingAge}
          unitCount={validationContext.unitCount}
          buildingType={validationContext.buildingType}
        />
      )}

      {/* Categories Form */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Budget Categories</h3>
            <div className="flex items-center space-x-3">
              <Button onClick={handleAutoAdjust} variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Auto-Adjust to 100%
              </Button>
              <Button onClick={addCategory} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {categories.map((category, index) => (
            <div key={category.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg">
              <div className="col-span-4">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategory(index, 'name', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Category name"
                />
              </div>
              
              <div className="col-span-3">
                <input
                  type="number"
                  value={category.budgetAmount}
                  onChange={(e) => updateCategory(index, 'budgetAmount', Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Amount (£)"
                />
              </div>
              
              <div className="col-span-2">
                <input
                  type="number"
                  value={category.percentageOfTotal}
                  onChange={(e) => updateCategory(index, 'percentageOfTotal', Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Percentage"
                  step="0.1"
                  max="100"
                />
              </div>
              
              <div className="col-span-2">
                <select
                  value={category.type}
                  onChange={(e) => updateCategory(index, 'type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="income">Income</option>
                  <option value="expenditure">Expenditure</option>
                </select>
              </div>
              
              <div className="col-span-1">
                <Button
                  onClick={() => removeCategory(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No categories added yet. Click "Add Category" to get started.</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {categories.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <div className="space-x-6">
                <span>
                  Total Amount: <span className="font-medium">£{totalAmount.toLocaleString()}</span>
                </span>
                <span>
                  Total Percentage: <span className={`font-medium ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPercentage.toFixed(1)}%
                  </span>
                </span>
              </div>
              {totalBudget > 0 && totalAmount !== totalBudget && (
                <span className="text-amber-600 font-medium">
                  Difference: £{(totalBudget - totalAmount).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {validation && (
        <BudgetValidationPanel 
          validation={validation}
          className="max-w-4xl"
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <span className="text-sm text-gray-500">
          {validation?.errors.length || 0} errors, {validation?.warnings.length || 0} warnings
        </span>
        <Button
          onClick={() => onSave?.(categories, totalBudget)}
          disabled={!isValid || categories.length === 0}
          className="disabled:opacity-50"
        >
          Save Budget
        </Button>
      </div>
    </div>
  );
};

export default BudgetFormWithValidation;