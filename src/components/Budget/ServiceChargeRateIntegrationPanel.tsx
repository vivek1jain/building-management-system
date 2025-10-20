import React, { useState, useEffect } from 'react';
import { serviceChargeRateIntegrationService, ServiceChargeRateCalculation, ServiceChargeImpactAnalysis } from '../../services/serviceChargeRateIntegrationService';
import { TrendingUp, TrendingDown, Home, Users, AlertTriangle, CheckCircle, Calculator, Building, DollarSign } from 'lucide-react';
import { Button, Card } from '../UI';

interface ServiceChargeRateIntegrationPanelProps {
  budgetId: string;
  buildingId: string;
  onGenerateCharges?: (period: string) => void;
  className?: string;
}

export const ServiceChargeRateIntegrationPanel: React.FC<ServiceChargeRateIntegrationPanelProps> = ({
  budgetId,
  buildingId,
  onGenerateCharges,
  className = ''
}) => {
  const [rateCalculation, setRateCalculation] = useState<ServiceChargeRateCalculation | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ServiceChargeImpactAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Q1 2024');

  // Load rate calculation and impact analysis
  useEffect(() => {
    const loadRateAnalysis = async () => {
      if (!budgetId || !buildingId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await serviceChargeRateIntegrationService.updateServiceChargeRates(
          budgetId,
          buildingId
        );
        
        setRateCalculation(result.rateCalculation);
        setImpactAnalysis(result.impactAnalysis);
        setRecommendations(result.recommendations);
      } catch (err) {
        console.error('Error loading rate analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load rate analysis');
      } finally {
        setLoading(false);
      }
    };

    loadRateAnalysis();
  }, [budgetId, buildingId]);

  const handleGenerateCharges = async () => {
    try {
      setLoading(true);
      await serviceChargeRateIntegrationService.generateServiceChargesFromBudget(
        budgetId,
        buildingId,
        selectedPeriod
      );
      onGenerateCharges?.(selectedPeriod);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate service charges');
    } finally {
      setLoading(false);
    }
  };

  const getCompetitivenessColor = (competitiveness: string) => {
    switch (competitiveness) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Calculating service charge rates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">Error Loading Rate Analysis</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (!rateCalculation || !impactAnalysis) {
    return (
      <div className={`p-6 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <p className="text-gray-600">No rate analysis available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Service Charge Rate Integration</h3>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="Q1 2024">Q1 2024</option>
            <option value="Q2 2024">Q2 2024</option>
            <option value="Q3 2024">Q3 2024</option>
            <option value="Q4 2024">Q4 2024</option>
          </select>
          <Button onClick={handleGenerateCharges} disabled={loading}>
            <Calculator className="h-4 w-4 mr-2" />
            Generate Service Charges
          </Button>
        </div>
      </div>

      {/* Rate Calculation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Base Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                £{rateCalculation.baseRatePerSqFt.toFixed(2)}/sq ft
              </p>
            </div>
            <Building className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Annual rate</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Adjusted Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                £{rateCalculation.adjustedRatePerSqFt.toFixed(2)}/sq ft
              </p>
            </div>
            <Calculator className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-center mt-1">
            {rateCalculation.comparison.changePercent && (
              <>
                {rateCalculation.comparison.changePercent > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={`text-xs ${rateCalculation.comparison.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {rateCalculation.comparison.changePercent > 0 ? '+' : ''}{rateCalculation.comparison.changePercent.toFixed(1)}% vs last year
                </span>
              </>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quarterly Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                £{rateCalculation.recommendedQuarterlyRate.toFixed(2)}/sq ft
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Per quarter</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Market Position</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCompetitivenessColor(rateCalculation.comparison.competitiveness)}`}>
                {rateCalculation.comparison.competitiveness.toUpperCase()}
              </div>
            </div>
            <div className="flex items-center">
              {rateCalculation.comparison.competitiveness === 'average' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Market avg: £{rateCalculation.comparison.marketRate?.toFixed(2) || 'N/A'}/sq ft
          </p>
        </Card>
      </div>

      {/* Adjustment Factors */}
      {rateCalculation.adjustmentFactors.length > 1 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Rate Adjustments Applied</h4>
          <div className="space-y-2">
            {rateCalculation.adjustmentFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{factor.name}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${factor.factor > 1 ? 'text-red-600' : factor.factor < 1 ? 'text-green-600' : 'text-gray-600'}`}>
                    {factor.factor > 1 ? '+' : ''}{((factor.factor - 1) * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">({factor.reason})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Impact Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flat Size Impact */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Impact by Flat Size</h4>
          <div className="space-y-3">
            {impactAnalysis.impactByFlatSize.map((sizeGroup, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sizeGroup.sqFtRange}</p>
                  <p className="text-xs text-gray-600">{sizeGroup.flatCount} flats</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    £{sizeGroup.quarterlyCharge}/quarter
                  </p>
                  <p className="text-xs text-gray-600">
                    £{sizeGroup.annualCharge}/year
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Affordability Analysis */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Affordability Analysis</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Quarterly Charge</span>
              <span className="text-sm font-medium">£{impactAnalysis.affordabilityAnalysis.averageQuarterlyCharge}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Range</span>
              <span className="text-sm font-medium">
                £{impactAnalysis.affordabilityAnalysis.rangeQuarterlyCharge.min} - £{impactAnalysis.affordabilityAnalysis.rangeQuarterlyCharge.max}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Arrears Risk</span>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(impactAnalysis.affordabilityAnalysis.potentialArrears.riskLevel)}`}>
                  {impactAnalysis.affordabilityAnalysis.potentialArrears.riskLevel.toUpperCase()}
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                Est. {impactAnalysis.affordabilityAnalysis.potentialArrears.estimatedAffectedFlats} flats potentially affected
              </p>
              <p className="text-xs text-gray-600">
                {impactAnalysis.affordabilityAnalysis.potentialArrears.reasoning}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Coverage */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Budget Coverage Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600">Service Charge Income</p>
            <p className="text-lg font-semibold text-green-600">
              £{impactAnalysis.budgetCoverage.totalServiceChargeIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Budget Requirement</p>
            <p className="text-lg font-semibold text-blue-600">
              £{impactAnalysis.budgetCoverage.budgetRequirement.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Surplus/Deficit</p>
            <p className={`text-lg font-semibold ${impactAnalysis.budgetCoverage.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {impactAnalysis.budgetCoverage.surplus >= 0 ? '+' : ''}£{impactAnalysis.budgetCoverage.surplus.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Coverage</p>
            <p className={`text-lg font-semibold ${impactAnalysis.budgetCoverage.coveragePercentage >= 100 ? 'text-green-600' : 'text-red-600'}`}>
              {impactAnalysis.budgetCoverage.coveragePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ServiceChargeRateIntegrationPanel;