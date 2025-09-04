// Budget Year Range Workflow - Complete Backend Implementation
// This module provides a comprehensive multi-year budget setup workflow

export { budgetWizardService } from '../budgetWizardService'
export { budgetYearRangeService } from '../budgetYearRangeService'
export { budgetReviewService } from '../budgetReviewService'
export { budgetCompletionService } from '../budgetCompletionService'

// Re-export key types for convenience
export type {
  BudgetSetupWizard,
  BudgetSetupStep,
  BudgetSetupStatus,
  BudgetYearRange,
  BudgetCategoryTemplate,
  BudgetYearAllocation,
  BudgetCategoryAllocation,
  BudgetSetupProgress,
  BudgetReviewSummary,
  BudgetValidationResult,
  BudgetCompletionSummary
} from '../../types'

import {
  BudgetSetupStep,
  BudgetSetupStatus,
  BudgetSetupWizard
} from '../../types'

/**
 * Complete Budget Year Range Workflow API
 * 
 * This workflow enables multi-year budget planning with the following steps:
 * 
 * 1. YEAR_RANGE_SELECTION - Select start/end years for budget planning
 * 2. CATEGORY_CONFIGURATION - Configure budget categories and templates
 * 3. BUDGET_ALLOCATION - Allocate amounts across years and categories
 * 4. REVIEW_AND_APPROVAL - Review, validate, and approve the budget plan
 * 5. SETUP_COMPLETION - Create actual budgets and categories in the system
 * 
 * Key Features:
 * - Multi-year budget range selection (2-10 years)
 * - Default category templates for income and expenditure
 * - Year-over-year budget copying with adjustments
 * - Bulk category updates across all years
 * - Comprehensive validation and review process
 * - Approval workflow with rejection and change requests
 * - Automatic budget and category creation upon completion
 * - Progress tracking and step navigation
 * - Rollback capabilities for completed wizards
 * 
 * Usage Example:
 * 
 * ```typescript
 * import { budgetWizardService, budgetYearRangeService } from './services/budgetWorkflow'
 * 
 * // 1. Create a new budget setup wizard
 * const wizard = await budgetWizardService.createBudgetSetupWizard({
 *   buildingId: 'building-123',
 *   yearRange: { startYear: 2024, endYear: 2026 },
 *   createdBy: 'user-456'
 * })
 * 
 * // 2. Generate allocations for all years
 * const allocations = await budgetYearRangeService.generateAllocationsForAllYears(wizard.id)
 * 
 * // 3. Submit for approval
 * await budgetReviewService.submitForApproval(wizard.id, 'user-456', 'Ready for review')
 * 
 * // 4. Approve and complete
 * await budgetReviewService.approveBudgetWizard(wizard.id, 'manager-789')
 * const summary = await budgetCompletionService.completeBudgetSetup(wizard.id, 'manager-789')
 * ```
 */

// Workflow orchestration helpers
export const budgetWorkflowHelpers = {
  /**
   * Get the next step in the workflow
   */
  getNextStep: (currentStep: BudgetSetupStep): BudgetSetupStep | null => {
    const stepOrder = [
      BudgetSetupStep.YEAR_RANGE_SELECTION,
      BudgetSetupStep.CATEGORY_CONFIGURATION,
      BudgetSetupStep.BUDGET_ALLOCATION,
      BudgetSetupStep.REVIEW_AND_APPROVAL,
      BudgetSetupStep.SETUP_COMPLETION
    ]
    
    const currentIndex = stepOrder.indexOf(currentStep)
    return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null
  },

  /**
   * Get the previous step in the workflow
   */
  getPreviousStep: (currentStep: BudgetSetupStep): BudgetSetupStep | null => {
    const stepOrder = [
      BudgetSetupStep.YEAR_RANGE_SELECTION,
      BudgetSetupStep.CATEGORY_CONFIGURATION,
      BudgetSetupStep.BUDGET_ALLOCATION,
      BudgetSetupStep.REVIEW_AND_APPROVAL,
      BudgetSetupStep.SETUP_COMPLETION
    ]
    
    const currentIndex = stepOrder.indexOf(currentStep)
    return currentIndex > 0 ? stepOrder[currentIndex - 1] : null
  },

  /**
   * Check if a step is completed based on wizard state
   */
  isStepCompleted: (wizard: BudgetSetupWizard, step: BudgetSetupStep): boolean => {
    const stepOrder = [
      BudgetSetupStep.YEAR_RANGE_SELECTION,
      BudgetSetupStep.CATEGORY_CONFIGURATION,
      BudgetSetupStep.BUDGET_ALLOCATION,
      BudgetSetupStep.REVIEW_AND_APPROVAL,
      BudgetSetupStep.SETUP_COMPLETION
    ]
    
    const currentIndex = stepOrder.indexOf(wizard.currentStep)
    const checkIndex = stepOrder.indexOf(step)
    
    return checkIndex < currentIndex || 
           (checkIndex === currentIndex && wizard.status === BudgetSetupStatus.COMPLETED)
  },

  /**
   * Get human-readable step name
   */
  getStepName: (step: BudgetSetupStep): string => {
    const stepNames = {
      [BudgetSetupStep.YEAR_RANGE_SELECTION]: 'Year Range Selection',
      [BudgetSetupStep.CATEGORY_CONFIGURATION]: 'Category Configuration',
      [BudgetSetupStep.BUDGET_ALLOCATION]: 'Budget Allocation',
      [BudgetSetupStep.REVIEW_AND_APPROVAL]: 'Review and Approval',
      [BudgetSetupStep.SETUP_COMPLETION]: 'Setup Completion'
    }
    
    return stepNames[step] || 'Unknown Step'
  },

  /**
   * Get human-readable status name
   */
  getStatusName: (status: BudgetSetupStatus): string => {
    const statusNames = {
      [BudgetSetupStatus.DRAFT]: 'Draft',
      [BudgetSetupStatus.IN_PROGRESS]: 'In Progress',
      [BudgetSetupStatus.PENDING_APPROVAL]: 'Pending Approval',
      [BudgetSetupStatus.APPROVED]: 'Approved',
      [BudgetSetupStatus.REJECTED]: 'Rejected',
      [BudgetSetupStatus.CHANGES_REQUESTED]: 'Changes Requested',
      [BudgetSetupStatus.COMPLETED]: 'Completed',
      [BudgetSetupStatus.CANCELLED]: 'Cancelled'
    }
    
    return statusNames[status] || 'Unknown Status'
  }
}
