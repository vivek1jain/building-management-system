import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Budget, BudgetStatus, User } from '../types';
import { handleFirebaseError, createAppError } from '../utils/errorHandler'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { budgetService } from './budgetService';

export interface BudgetApprovalRequest {
  id?: string;
  budgetId: string;
  buildingId: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'requires_changes';
  approvers: {
    userId: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    reviewedAt?: Date;
  }[];
  currentApprovalLevel: number;
  totalApprovalLevels: number;
  justification: string;
  attachments: string[];
  urgency: 'low' | 'normal' | 'high';
  deadline?: Date;
  escalation?: {
    escalatedAt: Date;
    escalatedBy: string;
    reason: string;
  };
  auditTrail: {
    action: string;
    performedBy: string;
    performedAt: Date;
    details: string;
    previousData?: any;
  }[];
  notifications: {
    sent: boolean;
    sentAt?: Date;
    recipients: string[];
    type: 'approval_request' | 'reminder' | 'approved' | 'rejected';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalWorkflowConfig {
  buildingId: string;
  levels: {
    level: number;
    name: string;
    approvers: {
      userId: string;
      role: string;
      required: boolean;
    }[];
    budgetThreshold?: number;
    timeoutDays: number;
    escalateAfterDays: number;
  }[];
  notifications: {
    enabled: boolean;
    reminderDays: number[];
    escalationDays: number;
  };
  autoApproval: {
    enabled: boolean;
    maxBudgetAmount?: number;
    conditions: string[];
  };
}

class BudgetApprovalWorkflowService {
  /**
   * Submit budget for approval
   */
  async submitBudgetForApproval(
    budgetId: string,
    requestedBy: string,
    justification: string,
    urgency: 'low' | 'normal' | 'high' = 'normal',
    deadline?: Date
  ): Promise<BudgetApprovalRequest> {
    try {
      // Get budget details
      const budget = await budgetService.getBudget(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      if (budget.status !== 'draft') {
        throw new Error('Only draft budgets can be submitted for approval');
      }

      // Get approval workflow configuration
      const workflowConfig = await this.getApprovalWorkflowConfig(budget.buildingId);
      
      // Determine approval levels needed
      const requiredLevels = this.determineApprovalLevels(budget, workflowConfig);
      
      // Check for auto-approval
      if (this.isEligibleForAutoApproval(budget, workflowConfig)) {
        return await this.autoApproveBudget(budgetId, requestedBy);
      }

      // Create approval request
      const approvalRequest: Omit<BudgetApprovalRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        budgetId,
        buildingId: budget.buildingId,
        requestedBy,
        requestedAt: new Date(),
        status: 'pending',
        approvers: requiredLevels.flatMap(level => 
          level.approvers.map(approver => ({
            userId: approver.userId,
            role: approver.role,
            status: 'pending' as const
          }))
        ),
        currentApprovalLevel: 1,
        totalApprovalLevels: requiredLevels.length,
        justification,
        attachments: [],
        urgency,
        deadline,
        auditTrail: [{
          action: 'SUBMITTED_FOR_APPROVAL',
          performedBy: requestedBy,
          performedAt: new Date(),
          details: `Budget submitted for approval with ${requiredLevels.length} approval levels required`
        }],
        notifications: []
      };

      // Store approval request
      const docRef = await addDoc(collection(db, 'budgetApprovalRequests'), {
        ...approvalRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const savedRequest: BudgetApprovalRequest = {
        id: docRef.id,
        ...approvalRequest,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update budget status
      // Update budget status to pending approval (note: may need to add this status to BudgetStatus enum)
      // await budgetService.updateBudgetStatus(budgetId, 'pending_approval');

      // Send notifications
      await this.sendApprovalNotifications(savedRequest, 'approval_request');

      return savedRequest;
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'submitBudgetForApproval',
        budgetId,
      })
    }
  }

  /**
   * Approve or reject budget at current level
   */
  async reviewBudgetApproval(
    approvalRequestId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected' | 'requires_changes',
    comments?: string
  ): Promise<BudgetApprovalRequest> {
    try {
      // Get current approval request
      const approvalDoc = await getDoc(doc(db, 'budgetApprovalRequests', approvalRequestId));
      if (!approvalDoc.exists()) {
        throw new Error('Approval request not found');
      }

      const approvalRequest = { id: approvalDoc.id, ...approvalDoc.data() } as BudgetApprovalRequest;
      
      // Find reviewer in approvers list
      const reviewerIndex = approvalRequest.approvers.findIndex(
        approver => approver.userId === reviewerId && approver.status === 'pending'
      );
      
      if (reviewerIndex === -1) {
        throw new Error('Reviewer not authorized or already reviewed');
      }

      // Update reviewer status
      approvalRequest.approvers[reviewerIndex] = {
        ...approvalRequest.approvers[reviewerIndex],
        status: decision === 'approved' ? 'approved' : 'rejected',
        comments,
        reviewedAt: new Date()
      };

      // Add to audit trail
      approvalRequest.auditTrail.push({
        action: `REVIEW_${decision.toUpperCase()}`,
        performedBy: reviewerId,
        performedAt: new Date(),
        details: `Budget ${decision} by ${approvalRequest.approvers[reviewerIndex].role}${comments ? `: ${comments}` : ''}`
      });

      // Check if all current level approvers have reviewed
      const currentLevelApprovers = this.getCurrentLevelApprovers(approvalRequest);
      const currentLevelComplete = currentLevelApprovers.every(
        approver => approver.status !== 'pending'
      );

      if (currentLevelComplete) {
        const currentLevelApproved = currentLevelApprovers.every(
          approver => approver.status === 'approved'
        );

        if (!currentLevelApproved || decision === 'requires_changes') {
          // Current level rejected or requires changes
          approvalRequest.status = decision === 'requires_changes' ? 'requires_changes' : 'rejected';
          
          // Update budget status
          await budgetService.updateBudgetStatus(
            approvalRequest.budgetId, 
            decision === 'requires_changes' ? 'draft' : 'rejected'
          );

          await this.sendApprovalNotifications(approvalRequest, decision === 'requires_changes' ? 'requires_changes' as any : 'rejected');
        } else {
          // Current level approved, check if more levels needed
          if (approvalRequest.currentApprovalLevel >= approvalRequest.totalApprovalLevels) {
            // All levels complete - final approval
            approvalRequest.status = 'approved';
            
            // Update budget status to approved
            await budgetService.updateBudgetStatus(approvalRequest.budgetId, 'approved', reviewerId);
            
            await this.sendApprovalNotifications(approvalRequest, 'approved');
          } else {
            // Move to next approval level
            approvalRequest.currentApprovalLevel += 1;
            await this.sendApprovalNotifications(approvalRequest, 'approval_request');
          }
        }
      }

      // Update approval request
      approvalRequest.updatedAt = new Date();
      await updateDoc(doc(db, 'budgetApprovalRequests', approvalRequestId), {
        ...approvalRequest,
        updatedAt: serverTimestamp()
      });

      return approvalRequest;
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'reviewBudgetApproval',
        approvalRequestId,
      })
    }
  }

  /**
   * Get approval requests for a user
   */
  async getApprovalRequestsForUser(userId: string, status?: string): Promise<BudgetApprovalRequest[]> {
    try {
      let requestsQuery = query(
        collection(db, 'budgetApprovalRequests'),
        where('approvers', 'array-contains', { userId, status: 'pending' })
      );

      if (status) {
        requestsQuery = query(requestsQuery, where('status', '==', status));
      }

      const querySnapshot = await getDocs(requestsQuery);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? fromFirestoreTimestamp(doc.data().createdAt) : new Date(),
        updatedAt: doc.data().updatedAt ? fromFirestoreTimestamp(doc.data().updatedAt) : new Date(),
        requestedAt: doc.data().requestedAt ? fromFirestoreTimestamp(doc.data().requestedAt) : new Date()
      })) as BudgetApprovalRequest[];

      // Filter to only include requests where user is pending reviewer
      return requests.filter(request => 
        request.approvers.some(approver => 
          approver.userId === userId && approver.status === 'pending'
        )
      );
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getApprovalRequestsForUser',
        userId,
      })
    }
  }

  /**
   * Get approval history for a building
   */
  async getApprovalHistory(buildingId: string, limit: number = 50): Promise<BudgetApprovalRequest[]> {
    try {
      const historyQuery = query(
        collection(db, 'budgetApprovalRequests'),
        where('buildingId', '==', buildingId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(historyQuery);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? fromFirestoreTimestamp(doc.data().createdAt) : new Date(),
        updatedAt: doc.data().updatedAt ? fromFirestoreTimestamp(doc.data().updatedAt) : new Date(),
        requestedAt: doc.data().requestedAt ? fromFirestoreTimestamp(doc.data().requestedAt) : new Date()
      })) as BudgetApprovalRequest[];

      return history.slice(0, limit);
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getApprovalHistory',
        buildingId,
      })
    }
  }

  /**
   * Escalate overdue approvals
   */
  async escalateOverdueApprovals(): Promise<void> {
    try {
      const overdueQuery = query(
        collection(db, 'budgetApprovalRequests'),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(overdueQuery);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? fromFirestoreTimestamp(doc.data().createdAt) : new Date(),
        requestedAt: doc.data().requestedAt ? fromFirestoreTimestamp(doc.data().requestedAt) : new Date()
      })) as BudgetApprovalRequest[];

      for (const request of requests) {
        const workflowConfig = await this.getApprovalWorkflowConfig(request.buildingId);
        const currentLevel = workflowConfig.levels.find(level => level.level === request.currentApprovalLevel);
        
        if (currentLevel) {
          const daysSinceSubmission = Math.floor(
            (new Date().getTime() - request.requestedAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceSubmission >= currentLevel.escalateAfterDays && !request.escalation) {
            await this.escalateApprovalRequest(request.id!);
          }
        }
      }
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'escalateOverdueApprovals',
      })
    }
  }

  /**
   * Get approval workflow configuration for building
   */
  private async getApprovalWorkflowConfig(buildingId: string): Promise<ApprovalWorkflowConfig> {
    try {
      // Try to get building-specific config
      const configQuery = query(
        collection(db, 'approvalWorkflowConfigs'),
        where('buildingId', '==', buildingId)
      );
      const configSnapshot = await getDocs(configQuery);

      if (!configSnapshot.empty) {
        return configSnapshot.docs[0].data() as ApprovalWorkflowConfig;
      }

      // Return default configuration
      return {
        buildingId,
        levels: [
          {
            level: 1,
            name: 'Property Manager Review',
            approvers: [
              { userId: 'property-manager', role: 'Property Manager', required: true }
            ],
            timeoutDays: 7,
            escalateAfterDays: 5
          },
          {
            level: 2,
            name: 'Board Approval',
            approvers: [
              { userId: 'board-chair', role: 'Board Chair', required: true }
            ],
            budgetThreshold: 50000,
            timeoutDays: 14,
            escalateAfterDays: 10
          }
        ],
        notifications: {
          enabled: true,
          reminderDays: [3, 7],
          escalationDays: 5
        },
        autoApproval: {
          enabled: true,
          maxBudgetAmount: 10000,
          conditions: ['no_rate_increase', 'within_historical_range']
        }
      };
    } catch (error: any) {
      // Return minimal default config on error - don't throw
      console.warn('Could not get approval workflow config, using defaults:', error);
      return {
        buildingId,
        levels: [{
          level: 1,
          name: 'Manager Approval',
          approvers: [{ userId: 'manager', role: 'Manager', required: true }],
          timeoutDays: 7,
          escalateAfterDays: 5
        }],
        notifications: { enabled: true, reminderDays: [3], escalationDays: 5 },
        autoApproval: { enabled: false, conditions: [] }
      };
    }
  }

  /**
   * Determine required approval levels based on budget
   */
  private determineApprovalLevels(
    budget: Budget, 
    config: ApprovalWorkflowConfig
  ): ApprovalWorkflowConfig['levels'] {
    return config.levels.filter(level => {
      // Include level if no threshold or budget exceeds threshold
      return !level.budgetThreshold || budget.totalBudgetAmount >= level.budgetThreshold;
    });
  }

  /**
   * Check if budget is eligible for auto-approval
   */
  private isEligibleForAutoApproval(budget: Budget, config: ApprovalWorkflowConfig): boolean {
    if (!config.autoApproval.enabled) return false;
    
    if (config.autoApproval.maxBudgetAmount && 
        budget.totalBudgetAmount > config.autoApproval.maxBudgetAmount) {
      return false;
    }

    // Additional auto-approval conditions would be checked here
    return true;
  }

  /**
   * Auto-approve budget
   */
  private async autoApproveBudget(budgetId: string, requestedBy: string): Promise<BudgetApprovalRequest> {
    const approvalRequest: Omit<BudgetApprovalRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      budgetId,
      buildingId: '',
      requestedBy,
      requestedAt: new Date(),
      status: 'approved',
      approvers: [],
      currentApprovalLevel: 1,
      totalApprovalLevels: 0,
      justification: 'Auto-approved based on workflow rules',
      attachments: [],
      urgency: 'normal',
      auditTrail: [{
        action: 'AUTO_APPROVED',
        performedBy: 'system',
        performedAt: new Date(),
        details: 'Budget automatically approved based on workflow configuration'
      }],
      notifications: []
    };

    // Update budget status
    await budgetService.updateBudgetStatus(budgetId, 'approved', 'system');

    const docRef = await addDoc(collection(db, 'budgetApprovalRequests'), {
      ...approvalRequest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { 
      id: docRef.id, 
      ...approvalRequest, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
  }

  /**
   * Get current level approvers
   */
  private getCurrentLevelApprovers(request: BudgetApprovalRequest) {
    // This is a simplified version - in practice, you'd match by level
    return request.approvers.filter(approver => approver.status !== 'approved');
  }

  /**
   * Escalate approval request
   */
  private async escalateApprovalRequest(requestId: string): Promise<void> {
    const escalation = {
      escalatedAt: new Date(),
      escalatedBy: 'system',
      reason: 'Approval timeout exceeded'
    };

    await updateDoc(doc(db, 'budgetApprovalRequests', requestId), {
      escalation,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Send approval notifications
   */
  private async sendApprovalNotifications(
    request: BudgetApprovalRequest, 
    type: 'approval_request' | 'approved' | 'rejected' | 'reminder'
  ): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Sending ${type} notification for approval request ${request.id}`);
    
    // In practice, this would:
    // 1. Get user contact details
    // 2. Send emails/push notifications
    // 3. Record notification sent
    
    const notification = {
      sent: true,
      sentAt: new Date(),
      recipients: request.approvers.map(a => a.userId),
      type
    };

    request.notifications.push(notification);
  }
}

export const budgetApprovalWorkflowService = new BudgetApprovalWorkflowService();
export default budgetApprovalWorkflowService;