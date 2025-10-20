import React from 'react';
import { BudgetCategoryItem } from '../../types';
import { analyzeBudgetHealth, validateRateChange, validateCategoryDistribution } from '../../utils/budgetValidation';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Shield, Wrench, PiggyBank } from 'lucide-react';

interface BudgetHealthDashboardProps {
  categories: BudgetCategoryItem[];
  totalBudget: number;
  ratePerSqFt: number;
  previousYearRate?: number;
  buildingAge?: number;
  unitCount?: number;
  buildingType?: string;
  className?: string;
}

export const BudgetHealthDashboard: React.FC<BudgetHealthDashboardProps> = ({
  categories,
  totalBudget,
  ratePerSqFt,
  previousYearRate,
  buildingAge,
  unitCount,
  buildingType = 'residential',
  className = ''
}) => {
  // Analyze budget health
  const healthAnalysis = analyzeBudgetHealth(categories, totalBudget, buildingAge, unitCount);
  const distributionValidation = validateCategoryDistribution(categories, buildingType);
  
  // Rate change analysis
  let rateAnalysis = null;
  if (previousYearRate && previousYearRate > 0) {
    rateAnalysis = validateRateChange(ratePerSqFt, previousYearRate, buildingType);
  }

  // Calculate key metrics
  const reservePercent = categories
    .filter(cat => cat.name.toLowerCase().includes('reserve') || cat.name.toLowerCase().includes('contingency'))
    .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

  const maintenancePercent = categories
    .filter(cat => 
      cat.name.toLowerCase().includes('maintenance') ||
      cat.name.toLowerCase().includes('repair') ||
      cat.name.toLowerCase().includes('upkeep')
    )
    .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

  const insurancePercent = categories
    .filter(cat => cat.name.toLowerCase().includes('insurance'))
    .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-5 w-5" />;
      case 'good': return <CheckCircle className="h-5 w-5" />;
      case 'fair': return <Info className="h-5 w-5" />;
      case 'poor': return <AlertTriangle className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Health Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Health Overview</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(healthAnalysis.health)}`}>
            {getHealthIcon(healthAnalysis.health)}
            <span className="ml-2 capitalize">{healthAnalysis.health}</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Rate per sq ft */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rate per sq ft</p>
                <p className="text-xl font-semibold text-gray-900">£{ratePerSqFt.toFixed(2)}</p>
              </div>
              {rateAnalysis && previousYearRate && (
                <div className="flex items-center">
                  {ratePerSqFt > previousYearRate ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : ratePerSqFt < previousYearRate ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            {rateAnalysis && previousYearRate && (
              <p className="text-xs text-gray-500 mt-1">
                {((ratePerSqFt - previousYearRate) / previousYearRate * 100).toFixed(1)}% vs last year
              </p>
            )}
          </div>

          {/* Reserve Fund */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reserve Fund</p>
                <p className="text-xl font-semibold text-gray-900">{reservePercent.toFixed(1)}%</p>
              </div>
              <PiggyBank className={`h-5 w-5 ${reservePercent >= 5 ? 'text-green-500' : 'text-amber-500'}`} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {reservePercent >= 5 ? 'Adequate' : 'Below recommended 5%'}
            </p>
          </div>

          {/* Maintenance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-xl font-semibold text-gray-900">{maintenancePercent.toFixed(1)}%</p>
              </div>
              <Wrench className={`h-5 w-5 ${maintenancePercent >= 15 ? 'text-green-500' : 'text-amber-500'}`} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {buildingAge ? `Age: ${buildingAge} years` : 'Allocation'}
            </p>
          </div>

          {/* Insurance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Insurance</p>
                <p className="text-xl font-semibold text-gray-900">{insurancePercent.toFixed(1)}%</p>
              </div>
              <Shield className={`h-5 w-5 ${insurancePercent >= 2 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {insurancePercent >= 2 ? 'Covered' : 'May be insufficient'}
            </p>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Year-over-year comparison */}
          {rateAnalysis && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Rate Analysis</h4>
              <div className="space-y-2">
                {rateAnalysis.warnings.length > 0 && (
                  <div className="space-y-1">
                    {rateAnalysis.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
                {rateAnalysis.suggestions.length > 0 && (
                  <div className="space-y-1">
                    {rateAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category distribution insights */}
          {(distributionValidation.warnings.length > 0 || distributionValidation.suggestions.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Category Distribution</h4>
              <div className="space-y-2">
                {distributionValidation.warnings.length > 0 && (
                  <div className="space-y-1">
                    {distributionValidation.warnings.slice(0, 3).map((warning, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
                {distributionValidation.suggestions.length > 0 && (
                  <div className="space-y-1">
                    {distributionValidation.suggestions.slice(0, 2).map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Health Analysis Summary */}
        {(healthAnalysis.warnings.length > 0 || healthAnalysis.suggestions.length > 0) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Health Analysis</h4>
            <div className="space-y-2">
              {healthAnalysis.warnings.slice(0, 3).map((warning, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{warning}</span>
                </div>
              ))}
              {healthAnalysis.suggestions.slice(0, 2).map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-unit analysis if available */}
      {unitCount && unitCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Per-Unit Analysis</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Budget per unit:</span>
              <span className="ml-2 font-medium">£{(totalBudget / unitCount).toFixed(0)}</span>
            </div>
            <div>
              <span className="text-gray-600">Units:</span>
              <span className="ml-2 font-medium">{unitCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetHealthDashboard;