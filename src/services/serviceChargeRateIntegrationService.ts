import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Budget, 
  BudgetCategoryItem, 
  ServiceChargeDemand, 
  Flat, 
  Building,
  ServiceChargeDemandStatus,
  PaymentFrequency 
} from '../types';
import { handleFirebaseError } from '../utils/errorHandler'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { budgetService } from './budgetService';
import { generateServiceChargeDemands } from './serviceChargeService';
import { handleFirebaseError, createAppError } from '../utils/errorHandler'

export interface ServiceChargeRateCalculation {
  totalBudgetAmount: number;
  totalSqFt: number;
  baseRatePerSqFt: number;
  adjustedRatePerSqFt: number;
  adjustmentFactors: {
    name: string;
    factor: number;
    reason: string;
  }[];
  categorizedRates: {
    categoryName: string;
    categoryType: 'income' | 'expenditure';
    amount: number;
    ratePerSqFt: number;
    percentage: number;
  }[];
  recommendedQuarterlyRate: number;
  recommendedAnnualRate: number;
  comparison: {
    previousYearRate?: number;
    marketRate?: number;
    changePercent?: number;
    competitiveness: 'low' | 'average' | 'high';
  };
}

export interface ServiceChargeImpactAnalysis {
  totalFlats: number;
  impactByFlatSize: {
    sqFtRange: string;
    flatCount: number;
    averageSqFt: number;
    quarterlyCharge: number;
    annualCharge: number;
    changeFromPrevious?: number;
  }[];
  affordabilityAnalysis: {
    averageQuarterlyCharge: number;
    medianQuarterlyCharge: number;
    rangeQuarterlyCharge: { min: number; max: number };
    potentialArrears: {
      riskLevel: 'low' | 'medium' | 'high';
      estimatedAffectedFlats: number;
      reasoning: string;
    };
  };
  budgetCoverage: {
    totalServiceChargeIncome: number;
    budgetRequirement: number;
    surplus: number;
    coveragePercentage: number;
  };
}

class ServiceChargeRateIntegrationService {
  /**
   * Calculate service charge rates from approved budget
   */
  async calculateRatesFromBudget(
    budgetId: string,
    buildingId: string
  ): Promise<ServiceChargeRateCalculation> {
    try {
      // Get budget data
      const budget = await budgetService.getBudget(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const budgetCategories = await budgetService.getBudgetCategories(budgetId);
      
      // Get building and flats data
      const buildingDoc = await getDoc(doc(db, 'buildings', buildingId));
      const building = buildingDoc.exists() ? buildingDoc.data() as Building : null;
      
      const flatsQuery = query(collection(db, 'flats'), where('buildingId', '==', buildingId));
      const flatsSnapshot = await getDocs(flatsQuery);
      const flats = flatsSnapshot.docs.map(doc => doc.data() as Flat);
      
      const totalSqFt = flats.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0);

      if (totalSqFt === 0) {
        throw new Error('No square footage data available for rate calculation');
      }

      // Base rate calculation
      const baseRatePerSqFt = budget.totalBudgetAmount / totalSqFt;
      
      // Calculate adjustment factors
      const adjustmentFactors = this.calculateAdjustmentFactors(budget, building, flats);
      
      // Apply adjustments
      let adjustedRatePerSqFt = baseRatePerSqFt;
      adjustmentFactors.forEach(factor => {
        adjustedRatePerSqFt *= factor.factor;
      });

      // Categorized rate breakdown
      const categorizedRates = budgetCategories.map(category => ({
        categoryName: category.name,
        categoryType: category.type,
        amount: category.budgetAmount,
        ratePerSqFt: category.budgetAmount / totalSqFt,
        percentage: category.percentageOfTotal
      }));

      // Quarterly and annual rates (UK standard)
      const recommendedQuarterlyRate = adjustedRatePerSqFt / 4;
      const recommendedAnnualRate = adjustedRatePerSqFt;

      // Previous year comparison
      const comparison = await this.getComparisonData(buildingId, adjustedRatePerSqFt);

      return {
        totalBudgetAmount: budget.totalBudgetAmount,
        totalSqFt,
        baseRatePerSqFt,
        adjustedRatePerSqFt,
        adjustmentFactors,
        categorizedRates,
        recommendedQuarterlyRate,
        recommendedAnnualRate,
        comparison
      };
    } catch (error: any) {
      handleFirebaseError('Error calculating rates from budget:', error);
      throw error;
    }
  }

  /**
   * Analyze service charge impact on residents
   */
  async analyzeServiceChargeImpact(
    rateCalculation: ServiceChargeRateCalculation,
    buildingId: string
  ): Promise<ServiceChargeImpactAnalysis> {
    try {
      // Get flats data
      const flatsQuery = query(collection(db, 'flats'), where('buildingId', '==', buildingId));
      const flatsSnapshot = await getDocs(flatsQuery);
      const flats = flatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flat));

      // Group flats by size ranges
      const sizeRanges = [
        { range: '0-500 sq ft', min: 0, max: 500 },
        { range: '501-750 sq ft', min: 501, max: 750 },
        { range: '751-1000 sq ft', min: 751, max: 1000 },
        { range: '1001-1500 sq ft', min: 1001, max: 1500 },
        { range: '1500+ sq ft', min: 1501, max: Infinity }
      ];

      const impactByFlatSize = sizeRanges.map(sizeRange => {
        const flatsInRange = flats.filter(flat => 
          flat.areaSqFt >= sizeRange.min && flat.areaSqFt <= sizeRange.max
        );
        
        if (flatsInRange.length === 0) {
          return {
            sqFtRange: sizeRange.range,
            flatCount: 0,
            averageSqFt: 0,
            quarterlyCharge: 0,
            annualCharge: 0
          };
        }

        const averageSqFt = flatsInRange.reduce((sum, flat) => sum + flat.areaSqFt, 0) / flatsInRange.length;
        const quarterlyCharge = averageSqFt * rateCalculation.recommendedQuarterlyRate;
        const annualCharge = averageSqFt * rateCalculation.recommendedAnnualRate;

        return {
          sqFtRange: sizeRange.range,
          flatCount: flatsInRange.length,
          averageSqFt: Math.round(averageSqFt),
          quarterlyCharge: Math.round(quarterlyCharge),
          annualCharge: Math.round(annualCharge)
        };
      }).filter(range => range.flatCount > 0);

      // Calculate affordability metrics
      const quarterlyCharges = flats.map(flat => 
        flat.areaSqFt * rateCalculation.recommendedQuarterlyRate
      ).sort((a, b) => a - b);

      const averageQuarterlyCharge = quarterlyCharges.reduce((sum, charge) => sum + charge, 0) / quarterlyCharges.length;
      const medianQuarterlyCharge = quarterlyCharges[Math.floor(quarterlyCharges.length / 2)];
      const rangeQuarterlyCharge = {
        min: quarterlyCharges[0],
        max: quarterlyCharges[quarterlyCharges.length - 1]
      };

      // Affordability risk assessment
      const potentialArrears = this.assessAffordabilityRisk(
        quarterlyCharges,
        rateCalculation.comparison.changePercent || 0
      );

      // Budget coverage analysis
      const totalServiceChargeIncome = flats.reduce((sum, flat) => 
        sum + (flat.areaSqFt * rateCalculation.recommendedAnnualRate), 0
      );

      const budgetCoverage = {
        totalServiceChargeIncome,
        budgetRequirement: rateCalculation.totalBudgetAmount,
        surplus: totalServiceChargeIncome - rateCalculation.totalBudgetAmount,
        coveragePercentage: (totalServiceChargeIncome / rateCalculation.totalBudgetAmount) * 100
      };

      return {
        totalFlats: flats.length,
        impactByFlatSize,
        affordabilityAnalysis: {
          averageQuarterlyCharge: Math.round(averageQuarterlyCharge),
          medianQuarterlyCharge: Math.round(medianQuarterlyCharge),
          rangeQuarterlyCharge: {
            min: Math.round(rangeQuarterlyCharge.min),
            max: Math.round(rangeQuarterlyCharge.max)
          },
          potentialArrears
        },
        budgetCoverage
      };
    } catch (error: any) {
      handleFirebaseError('Error analyzing service charge impact:', error);
      throw error;
    }
  }

  /**
   * Generate service charges based on approved budget
   */
  async generateServiceChargesFromBudget(
    budgetId: string,
    buildingId: string,
    period: string,
    options: {
      effectiveDate?: Date;
      dueDate?: Date;
      includeAdjustments?: boolean;
    } = {}
  ): Promise<ServiceChargeDemand[]> {
    try {
      // Calculate rates from budget
      const rateCalculation = await this.calculateRatesFromBudget(budgetId, buildingId);
      
      // Get flats
      const flatsQuery = query(collection(db, 'flats'), where('buildingId', '==', buildingId));
      const flatsSnapshot = await getDocs(flatsQuery);
      const flats = flatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flat));

      // Generate service charge demands
      const demands = await generateServiceChargeDemands(
        buildingId,
        period,
        rateCalculation.recommendedQuarterlyRate,
        flats
      );

      // Store rate calculation reference in demands
      const batch = [];
      for (const demand of demands) {
        batch.push(updateDoc(doc(db, 'serviceChargeDemands', demand.id), {
          budgetId,
          rateCalculation: {
            baseRate: rateCalculation.baseRatePerSqFt,
            adjustedRate: rateCalculation.adjustedRatePerSqFt,
            calculatedAt: new Date()
          }
        }));
      }

      // Execute batch updates
      await Promise.all(batch);

      return demands;
    } catch (error: any) {
      handleFirebaseError('Error generating service charges from budget:', error);
      throw error;
    }
  }

  /**
   * Update service charge rates when budget changes
   */
  async updateServiceChargeRates(
    budgetId: string,
    buildingId: string
  ): Promise<{
    rateCalculation: ServiceChargeRateCalculation;
    impactAnalysis: ServiceChargeImpactAnalysis;
    recommendations: string[];
  }> {
    try {
      const rateCalculation = await this.calculateRatesFromBudget(budgetId, buildingId);
      const impactAnalysis = await this.analyzeServiceChargeImpact(rateCalculation, buildingId);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(rateCalculation, impactAnalysis);

      return {
        rateCalculation,
        impactAnalysis,
        recommendations
      };
    } catch (error: any) {
      handleFirebaseError('Error updating service charge rates:', error);
      throw error;
    }
  }

  /**
   * Calculate adjustment factors based on building characteristics
   */
  private calculateAdjustmentFactors(
    budget: Budget,
    building: Building | null,
    flats: Flat[]
  ): { name: string; factor: number; reason: string }[] {
    const factors = [];

    // Building age adjustment
    if (building?.yearBuilt) {
      const buildingAge = new Date().getFullYear() - building.yearBuilt;
      if (buildingAge > 50) {
        factors.push({
          name: 'Age Adjustment',
          factor: 1.1,
          reason: `Building is ${buildingAge} years old - higher maintenance needs`
        });
      } else if (buildingAge < 10) {
        factors.push({
          name: 'New Building Adjustment',
          factor: 0.95,
          reason: 'New building - lower maintenance requirements'
        });
      }
    }

    // Size efficiency adjustment
    if (flats.length > 50) {
      factors.push({
        name: 'Scale Efficiency',
        factor: 0.95,
        reason: 'Large building benefits from economies of scale'
      });
    } else if (flats.length < 10) {
      factors.push({
        name: 'Small Building Premium',
        factor: 1.05,
        reason: 'Smaller buildings have proportionally higher fixed costs'
      });
    }

    // Budget health adjustment
    const reservePercent = budget.categories?.filter(cat => 
      cat.name.toLowerCase().includes('reserve')
    ).reduce((sum, cat) => sum + cat.percentageOfTotal, 0) || 0;

    if (reservePercent < 5) {
      factors.push({
        name: 'Low Reserves Adjustment',
        factor: 1.02,
        reason: 'Low reserve fund - slight increase for financial stability'
      });
    }

    // If no factors, return identity
    if (factors.length === 0) {
      factors.push({
        name: 'No Adjustments',
        factor: 1.0,
        reason: 'No adjustments needed based on building characteristics'
      });
    }

    return factors;
  }

  /**
   * Get comparison data with previous years and market rates
   */
  private async getComparisonData(
    buildingId: string,
    currentRate: number
  ): Promise<ServiceChargeRateCalculation['comparison']> {
    try {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // Get previous year budget
      const prevBudgetQuery = query(
        collection(db, 'budgets'),
        where('buildingId', '==', buildingId),
        where('year', '==', previousYear)
      );
      const prevBudgetSnapshot = await getDocs(prevBudgetQuery);

      let previousYearRate: number | undefined;
      let changePercent: number | undefined;

      if (!prevBudgetSnapshot.empty) {
        const prevBudget = prevBudgetSnapshot.docs[0].data() as Budget;
        
        // Get flats data for rate calculation
        const flatsQuery = query(collection(db, 'flats'), where('buildingId', '==', buildingId));
        const flatsSnapshot = await getDocs(flatsQuery);
        const totalSqFt = flatsSnapshot.docs.reduce((sum, doc) => 
          sum + (doc.data().areaSqFt || 0), 0
        );

        if (totalSqFt > 0 && prevBudget.totalBudgetAmount) {
          previousYearRate = prevBudget.totalBudgetAmount / totalSqFt;
          changePercent = ((currentRate - previousYearRate) / previousYearRate) * 100;
        }
      }

      // Market rate comparison (simplified)
      const marketRate = 4.50; // £4.50/sq ft average for residential buildings
      let competitiveness: 'low' | 'average' | 'high' = 'average';

      if (currentRate < marketRate * 0.8) {
        competitiveness = 'low';
      } else if (currentRate > marketRate * 1.2) {
        competitiveness = 'high';
      }

      return {
        previousYearRate,
        marketRate,
        changePercent,
        competitiveness
      };
    } catch (error: any) {
      handleFirebaseError('Error getting comparison data:', error);
      return {
        competitiveness: 'average'
      };
    }
  }

  /**
   * Assess affordability risk based on charge levels and increases
   */
  private assessAffordabilityRisk(
    quarterlyCharges: number[],
    changePercent: number
  ): ServiceChargeImpactAnalysis['affordabilityAnalysis']['potentialArrears'] {
    const averageCharge = quarterlyCharges.reduce((sum, charge) => sum + charge, 0) / quarterlyCharges.length;
    
    // Risk factors
    let riskScore = 0;
    const reasoning = [];

    // High average charge
    if (averageCharge > 1500) {
      riskScore += 2;
      reasoning.push('high quarterly charges (>£1,500)');
    } else if (averageCharge > 1000) {
      riskScore += 1;
      reasoning.push('moderate quarterly charges (£1,000-£1,500)');
    }

    // Significant increase
    if (changePercent > 20) {
      riskScore += 3;
      reasoning.push(`large increase (${changePercent.toFixed(1)}%)from previous year`);
    } else if (changePercent > 10) {
      riskScore += 1;
      reasoning.push(`moderate increase (${changePercent.toFixed(1)}%) from previous year`);
    }

    // Charge variation (inequality indicator)
    const maxCharge = Math.max(...quarterlyCharges);
    const minCharge = Math.min(...quarterlyCharges);
    const variation = (maxCharge - minCharge) / averageCharge;
    
    if (variation > 1.5) {
      riskScore += 1;
      reasoning.push('high variation in charges between flats');
    }

    // Determine risk level and affected flats
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let estimatedAffectedFlats = 0;

    if (riskScore >= 4) {
      riskLevel = 'high';
      estimatedAffectedFlats = Math.ceil(quarterlyCharges.length * 0.15); // 15% of flats
    } else if (riskScore >= 2) {
      riskLevel = 'medium';
      estimatedAffectedFlats = Math.ceil(quarterlyCharges.length * 0.08); // 8% of flats
    } else {
      estimatedAffectedFlats = Math.ceil(quarterlyCharges.length * 0.03); // 3% of flats
    }

    return {
      riskLevel,
      estimatedAffectedFlats,
      reasoning: reasoning.join(', ') || 'charges within normal ranges'
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    rateCalculation: ServiceChargeRateCalculation,
    impactAnalysis: ServiceChargeImpactAnalysis
  ): string[] {
    const recommendations = [];

    // Rate change recommendations
    if (rateCalculation.comparison.changePercent) {
      if (rateCalculation.comparison.changePercent > 20) {
        recommendations.push('Consider phased implementation over multiple quarters to reduce impact');
        recommendations.push('Prepare detailed justification documentation for residents');
      } else if (rateCalculation.comparison.changePercent > 10) {
        recommendations.push('Communicate reasons for increase clearly to residents');
      }
    }

    // Market competitiveness
    if (rateCalculation.comparison.competitiveness === 'high') {
      recommendations.push('Rates are above market average - review budget for optimization opportunities');
    } else if (rateCalculation.comparison.competitiveness === 'low') {
      recommendations.push('Rates are below market average - verify all necessary services are included');
    }

    // Affordability concerns
    if (impactAnalysis.affordabilityAnalysis.potentialArrears.riskLevel === 'high') {
      recommendations.push('High arrears risk - consider payment plan options for affected residents');
      recommendations.push('Schedule resident meeting to explain charges and payment support');
    } else if (impactAnalysis.affordabilityAnalysis.potentialArrears.riskLevel === 'medium') {
      recommendations.push('Monitor payment patterns closely after implementation');
    }

    // Budget coverage
    if (impactAnalysis.budgetCoverage.coveragePercentage < 95) {
      recommendations.push('Service charge income may not fully cover budget - review calculations');
    } else if (impactAnalysis.budgetCoverage.coveragePercentage > 110) {
      recommendations.push('Significant surplus projected - consider reducing rates or increasing reserves');
    }

    return recommendations;
  }
}

export const serviceChargeRateIntegrationService = new ServiceChargeRateIntegrationService();
export default serviceChargeRateIntegrationService;