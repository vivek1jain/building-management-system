import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BudgetCategoryItem, BudgetValidationResult, Building } from '../types';
import { validateBudget, analyzeBudgetHealth, validateRateChange, validateCategoryDistribution } from '../utils/budgetValidation';

export interface BudgetValidationContext {
  buildingId: string;
  buildingType?: string;
  buildingAge?: number;
  unitCount?: number;
  totalSqFt?: number;
  previousYearBudget?: number;
  previousYearRate?: number;
}

class BudgetValidationService {
  /**
   * Validate budget with full context and store results
   */
  async validateBudgetWithContext(
    categories: BudgetCategoryItem[],
    totalBudget: number,
    context: BudgetValidationContext
  ): Promise<BudgetValidationResult> {
    try {
      // Run comprehensive validation
      const validation = validateBudget(
        categories,
        totalBudget,
        context.previousYearBudget,
        context.buildingType
      );

      // Add additional analyses
      const healthAnalysis = analyzeBudgetHealth(
        categories,
        totalBudget,
        context.buildingAge,
        context.unitCount
      );

      const distributionValidation = validateCategoryDistribution(
        categories,
        context.buildingType || 'residential'
      );

      // Rate analysis if we have previous data
      let rateValidation = null;
      if (context.previousYearRate && context.totalSqFt) {
        const currentRate = totalBudget / context.totalSqFt;
        rateValidation = validateRateChange(
          currentRate,
          context.previousYearRate,
          context.buildingType || 'residential'
        );
      }

      // Merge all validation results
      const mergedValidation: BudgetValidationResult = {
        wizardId: validation.wizardId,
        isValid: validation.isValid,
        hasWarnings: validation.hasWarnings || healthAnalysis.warnings.length > 0 || distributionValidation.warnings.length > 0 || (rateValidation?.warnings.length ?? 0) > 0,
        hasSuggestions: validation.hasSuggestions || healthAnalysis.suggestions.length > 0 || distributionValidation.suggestions.length > 0 || (rateValidation?.suggestions.length ?? 0) > 0,
        totalPercentage: validation.totalPercentage,
        errors: [...validation.errors],
        warnings: [
          ...validation.warnings,
          ...healthAnalysis.warnings,
          ...distributionValidation.warnings,
          ...(rateValidation?.warnings ?? [])
        ],
        suggestions: [
          ...validation.suggestions,
          ...healthAnalysis.suggestions,
          ...distributionValidation.suggestions,
          ...(rateValidation?.suggestions ?? [])
        ],
        validatedAt: new Date()
      };

      // Store validation result
      await this.storeValidationResult(context.buildingId, mergedValidation);

      return mergedValidation;
    } catch (error) {
      console.error('Error validating budget with context:', error);
      throw error;
    }
  }

  /**
   * Get building context for validation
   */
  async getBuildingContext(buildingId: string): Promise<BudgetValidationContext> {
    try {
      // Get building details
      const buildingDoc = await getDoc(doc(db, 'buildings', buildingId));
      const building = buildingDoc.exists() ? buildingDoc.data() as Building : null;

      // Get flats count and total sq ft
      const flatsQuery = query(collection(db, 'flats'), where('buildingId', '==', buildingId));
      const flatsSnapshot = await getDocs(flatsQuery);
      const flats = flatsSnapshot.docs.map(doc => doc.data());
      
      const unitCount = flats.length;
      const totalSqFt = flats.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0);

      // Get previous year budget data
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      const prevBudgetQuery = query(
        collection(db, 'budgets'),
        where('buildingId', '==', buildingId),
        where('year', '==', previousYear)
      );
      const prevBudgetSnapshot = await getDocs(prevBudgetQuery);
      
      let previousYearBudget = 0;
      let previousYearRate = 0;
      
      if (!prevBudgetSnapshot.empty) {
        const prevBudget = prevBudgetSnapshot.docs[0].data();
        previousYearBudget = prevBudget.totalAmount || 0;
        if (totalSqFt > 0) {
          previousYearRate = previousYearBudget / totalSqFt;
        }
      }

      return {
        buildingId,
        buildingType: building?.buildingType || 'residential',
        buildingAge: building?.yearBuilt ? currentYear - building.yearBuilt : undefined,
        unitCount,
        totalSqFt,
        previousYearBudget,
        previousYearRate
      };
    } catch (error) {
      console.error('Error getting building context:', error);
      // Return basic context if we can't get full details
      return { buildingId };
    }
  }

  /**
   * Store validation result in database
   */
  private async storeValidationResult(
    buildingId: string, 
    validation: BudgetValidationResult
  ): Promise<string> {
    try {
      const validationDoc = await addDoc(collection(db, 'budgetValidations'), {
        buildingId,
        ...validation,
        createdAt: serverTimestamp()
      });

      return validationDoc.id;
    } catch (error) {
      console.error('Error storing validation result:', error);
      throw error;
    }
  }

  /**
   * Get recent validation results for a building
   */
  async getValidationHistory(buildingId: string, limit: number = 10): Promise<BudgetValidationResult[]> {
    try {
      const validationsQuery = query(
        collection(db, 'budgetValidations'),
        where('buildingId', '==', buildingId)
      );
      
      const querySnapshot = await getDocs(validationsQuery);
      const validations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          wizardId: data.wizardId || '',
          isValid: data.isValid || false,
          totalPercentage: data.totalPercentage || 0,
          hasWarnings: data.hasWarnings || false,
          hasSuggestions: data.hasSuggestions || false,
          errors: data.errors || [],
          warnings: data.warnings || [],
          suggestions: data.suggestions || [],
          validatedAt: data.validatedAt?.toDate ? data.validatedAt.toDate() : new Date(data.validatedAt || Date.now()),
          ...data
        } as BudgetValidationResult;
      });

      // Sort by validation date (most recent first)
      return validations
        .sort((a, b) => b.validatedAt.getTime() - a.validatedAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting validation history:', error);
      throw error;
    }
  }

  /**
   * Validate categories in real-time during budget creation
   */
  async validateCategoriesRealTime(
    categories: BudgetCategoryItem[],
    totalBudget: number,
    buildingId: string
  ): Promise<BudgetValidationResult> {
    try {
      const context = await this.getBuildingContext(buildingId);
      
      // Run basic validation without storing result (for real-time feedback)
      const validation = validateBudget(
        categories,
        totalBudget,
        context.previousYearBudget,
        context.buildingType
      );

      return {
        ...validation,
        wizardId: '', // Not stored for real-time validation
        validatedAt: new Date()
      };
    } catch (error) {
      console.error('Error in real-time validation:', error);
      
      // Return basic validation on error
      return {
        wizardId: '',
        isValid: false,
        hasWarnings: false,
        hasSuggestions: false,
        totalPercentage: categories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0),
        errors: ['Validation service temporarily unavailable'],
        warnings: [],
        suggestions: [],
        validatedAt: new Date()
      };
    }
  }

  /**
   * Get budget health score and recommendations
   */
  async getBudgetHealthReport(
    categories: BudgetCategoryItem[],
    totalBudget: number,
    buildingId: string
  ): Promise<{
    health: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    warnings: string[];
    suggestions: string[];
    keyMetrics: {
      reservePercent: number;
      maintenancePercent: number;
      insurancePercent: number;
      ratePerSqFt?: number;
      budgetPerUnit?: number;
    };
  }> {
    try {
      const context = await this.getBuildingContext(buildingId);
      const healthAnalysis = analyzeBudgetHealth(
        categories,
        totalBudget,
        context.buildingAge,
        context.unitCount
      );

      // Calculate key metrics
      const reservePercent = categories
        .filter(cat => cat.name.toLowerCase().includes('reserve') || cat.name.toLowerCase().includes('contingency'))
        .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

      const maintenancePercent = categories
        .filter(cat => 
          cat.name.toLowerCase().includes('maintenance') ||
          cat.name.toLowerCase().includes('repair')
        )
        .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

      const insurancePercent = categories
        .filter(cat => cat.name.toLowerCase().includes('insurance'))
        .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);

      const keyMetrics = {
        reservePercent,
        maintenancePercent,
        insurancePercent,
        ratePerSqFt: context.totalSqFt ? totalBudget / context.totalSqFt : undefined,
        budgetPerUnit: context.unitCount ? totalBudget / context.unitCount : undefined
      };

      // Calculate numerical score
      let score = 100;
      if (healthAnalysis.health === 'good') score = 85;
      else if (healthAnalysis.health === 'fair') score = 70;
      else if (healthAnalysis.health === 'poor') score = 50;

      return {
        health: healthAnalysis.health,
        score,
        warnings: healthAnalysis.warnings,
        suggestions: healthAnalysis.suggestions,
        keyMetrics
      };
    } catch (error) {
      console.error('Error generating budget health report:', error);
      throw error;
    }
  }
}

export const budgetValidationService = new BudgetValidationService();
export default budgetValidationService;