import React, { useState } from 'react';
import { ServiceChargeRateIntegrationPanel } from './ServiceChargeRateIntegrationPanel';
import { BudgetApprovalWorkflowPanel } from './BudgetApprovalWorkflowPanel';
import { BudgetValidationPanel } from './BudgetValidationPanel';
import { BudgetHealthDashboard } from './BudgetHealthDashboard';
import { ArrowRight, CheckCircle, Clock, DollarSign, Users, Building, Zap } from 'lucide-react';
import { Card } from '../UI';

interface Phase3IntegrationDemoProps {
  buildingId: string;
  budgetId: string;
  currentUserId: string;
  className?: string;
}

export const Phase3IntegrationDemo: React.FC<Phase3IntegrationDemoProps> = ({
  buildingId,
  budgetId,
  currentUserId,
  className = ''
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Mock data for demo purposes
  const mockValidation = {
    wizardId: 'demo',
    isValid: true,
    hasWarnings: true,
    hasSuggestions: true,
    totalPercentage: 100,
    errors: [],
    warnings: [
      'Service charge rate increased by 12.5% from previous year',
      'Maintenance allocation (18.5%) below recommended range for building age'
    ],
    suggestions: [
      'Consider phased implementation over multiple quarters to reduce impact',
      'Review budget for potential cost optimization opportunities',
      'Prepare detailed justification documentation for residents'
    ],
    validatedAt: new Date()
  };

  const mockCategories = [
    {
      id: '1',
      budgetId,
      categoryMasterId: '1',
      name: 'Maintenance & Repairs',
      type: 'expenditure' as const,
      budgetAmount: 18500,
      percentageOfTotal: 37,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 18500,
      approvalThreshold: 1000,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      budgetId,
      categoryMasterId: '2',
      name: 'Insurance',
      type: 'expenditure' as const,
      budgetAmount: 7500,
      percentageOfTotal: 15,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 7500,
      approvalThreshold: 1000,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      budgetId,
      categoryMasterId: '3',
      name: 'Management Fees',
      type: 'expenditure' as const,
      budgetAmount: 12000,
      percentageOfTotal: 24,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 12000,
      approvalThreshold: 1000,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      budgetId,
      categoryMasterId: '4',
      name: 'Reserve Fund',
      type: 'expenditure' as const,
      budgetAmount: 6000,
      percentageOfTotal: 12,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 6000,
      approvalThreshold: 1000,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      budgetId,
      categoryMasterId: '5',
      name: 'Utilities',
      type: 'expenditure' as const,
      budgetAmount: 6000,
      percentageOfTotal: 12,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 6000,
      approvalThreshold: 1000,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
    if (stepNumber < 4) {
      setActiveStep(stepNumber + 1);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Budget Validation & Health Check',
      description: 'Comprehensive validation with intelligent warnings and suggestions',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600'
    },
    {
      number: 2,
      title: 'Service Charge Rate Integration',
      description: 'Calculate rates and analyze impact on residents',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      number: 3,
      title: 'Budget Approval Workflow',
      description: 'Submit budget for multi-level approval process',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      number: 4,
      title: 'Service Charge Generation',
      description: 'Generate actual service charge demands from approved budget',
      icon: <Building className="h-5 w-5" />,
      color: 'bg-amber-100 text-amber-600'
    }
  ];

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Zap className="h-8 w-8 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Phase 3 Integration Demo</h1>
        </div>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Experience the complete budget lifecycle: from validation and health analysis, through service charge rate 
          integration and resident impact assessment, to approval workflows and service charge generation.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 py-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                activeStep === step.number
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : completedSteps.has(step.number)
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
              onClick={() => setActiveStep(step.number)}
            >
              <div className={`p-2 rounded-full ${
                completedSteps.has(step.number) ? 'bg-green-100 text-green-600' : step.color
              }`}>
                {completedSteps.has(step.number) ? <CheckCircle className="h-5 w-5" /> : step.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-600">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className={`h-5 w-5 ${
                completedSteps.has(step.number) ? 'text-green-500' : 'text-gray-400'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Budget Validation & Health Check */}
        {activeStep === 1 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Step 1: Budget Validation & Health Check</h2>
              <button
                onClick={() => handleStepComplete(1)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Mark Complete & Continue
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Validation Panel */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Validation</h3>
                <BudgetValidationPanel validation={mockValidation} />
              </div>

              {/* Health Dashboard */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Health Analysis</h3>
                <BudgetHealthDashboard
                  categories={mockCategories}
                  totalBudget={50000}
                  ratePerSqFt={4.25}
                  previousYearRate={3.75}
                  buildingAge={15}
                  unitCount={24}
                  buildingType="residential"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">✅ Key Features Demonstrated:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Real-time validation with intelligent error detection</li>
                <li>• Comprehensive warnings for rate increases and category allocations</li>
                <li>• Smart suggestions based on building type and characteristics</li>
                <li>• Health scoring with visual indicators and key metrics</li>
                <li>• Year-over-year analysis and trend indicators</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Step 2: Service Charge Rate Integration */}
        {activeStep === 2 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Step 2: Service Charge Rate Integration</h2>
              <button
                onClick={() => handleStepComplete(2)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Mark Complete & Continue
              </button>
            </div>

            <ServiceChargeRateIntegrationPanel
              budgetId={budgetId}
              buildingId={buildingId}
              onGenerateCharges={(period) => {
                console.log(`Demo: Service charges generated for ${period}`);
              }}
            />

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">🔍 Key Features Demonstrated:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Automatic rate calculation from approved budgets</li>
                <li>• Building-specific adjustments (age, size, efficiency)</li>
                <li>• Impact analysis by flat size with affordability risk assessment</li>
                <li>• Market competitiveness analysis and benchmarking</li>
                <li>• Budget coverage validation and surplus/deficit tracking</li>
                <li>• Intelligent recommendations for rate implementation</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Step 3: Budget Approval Workflow */}
        {activeStep === 3 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Step 3: Budget Approval Workflow</h2>
              <button
                onClick={() => handleStepComplete(3)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Mark Complete & Continue
              </button>
            </div>

            <BudgetApprovalWorkflowPanel
              budgetId={budgetId}
              buildingId={buildingId}
              currentUserId={currentUserId}
              onApprovalComplete={(approved) => {
                console.log(`Demo: Budget ${approved ? 'approved' : 'rejected'}`);
              }}
            />

            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800 mb-2">⚡ Key Features Demonstrated:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Multi-level approval workflow with configurable thresholds</li>
                <li>• Auto-approval for budgets meeting specific criteria</li>
                <li>• Complete audit trail with timestamped actions</li>
                <li>• Escalation handling for overdue approvals</li>
                <li>• Role-based review capabilities with comments</li>
                <li>• Notification system integration (demo mode)</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Step 4: Service Charge Generation */}
        {activeStep === 4 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Step 4: Service Charge Generation</h2>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-amber-600 font-medium">Workflow Complete!</span>
              </div>
            </div>

            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Budget Process Complete!</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Your budget has been validated, rates calculated, approvals obtained, and is ready for 
                service charge generation. The system has analyzed resident impact and provided 
                intelligent recommendations throughout the process.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Validated</p>
                  <p className="text-xs text-green-600">100% compliant</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">Rate Calculated</p>
                  <p className="text-xs text-blue-600">£4.25/sq ft</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-800">Approved</p>
                  <p className="text-xs text-purple-600">All levels complete</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <Building className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800">Ready</p>
                  <p className="text-xs text-amber-600">For generation</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-2">🎉 Complete Integration Achieved:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Seamless data flow from budget validation to service charge generation</li>
                <li>• Intelligent validation prevents errors and suggests improvements</li>
                <li>• Rate integration ensures accurate and fair charge calculations</li>
                <li>• Approval workflow provides governance and accountability</li>
                <li>• Resident impact analysis supports informed decision-making</li>
                <li>• Complete audit trail maintains regulatory compliance</li>
              </ul>
            </div>
          </Card>
        )}
      </div>

      {/* Demo Reset */}
      <div className="text-center pt-6">
        <button
          onClick={() => {
            setActiveStep(1);
            setCompletedSteps(new Set());
          }}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Reset Demo
        </button>
      </div>
    </div>
  );
};

export default Phase3IntegrationDemo;