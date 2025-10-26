import { CheckCircle, Clock, AlertTriangle, X, Send, MessageSquare, User, Calendar, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { budgetApprovalWorkflowService, BudgetApprovalRequest } from '../../services/budgetApprovalWorkflowService';
import { Button, Modal, Card } from '../UI';

interface BudgetApprovalWorkflowPanelProps {
  budgetId: string;
  buildingId: string;
  currentUserId: string;
  onApprovalComplete?: (approved: boolean) => void;
  className?: string;
}

export const BudgetApprovalWorkflowPanel: React.FC<BudgetApprovalWorkflowPanelProps> = ({
  budgetId,
  buildingId,
  currentUserId,
  onApprovalComplete,
  className = ''
}) => {
  const [approvalRequest, setApprovalRequest] = useState<BudgetApprovalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    justification: '',
    urgency: 'normal' as 'low' | 'normal' | 'high',
    deadline: ''
  });
  const [reviewForm, setReviewForm] = useState({
    decision: 'approved' as 'approved' | 'rejected' | 'requires_changes',
    comments: ''
  });

  // Load current approval request if exists
  useEffect(() => {
    const loadApprovalRequest = async () => {
      if (!buildingId) return;
      
      try {
        setLoading(true);
        const history = await budgetApprovalWorkflowService.getApprovalHistory(buildingId, 10);
        const currentRequest = history.find(req => req.budgetId === budgetId);
        setApprovalRequest(currentRequest || null);
      } catch (err) {
        console.error('Error loading approval request:', err);
        setError(err instanceof Error ? err.message : 'Failed to load approval data');
      } finally {
        setLoading(false);
      }
    };

    loadApprovalRequest();
  }, [budgetId, buildingId]);

  const handleSubmitForApproval = async () => {
    try {
      setLoading(true);
      const deadline = submitForm.deadline ? new Date(submitForm.deadline) : undefined;
      
      const request = await budgetApprovalWorkflowService.submitBudgetForApproval(
        budgetId,
        currentUserId,
        submitForm.justification,
        submitForm.urgency,
        deadline
      );
      
      setApprovalRequest(request);
      setShowSubmitModal(false);
      setSubmitForm({ justification: '', urgency: 'normal', deadline: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for approval');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApproval = async () => {
    if (!approvalRequest?.id) return;
    
    try {
      setLoading(true);
      const updatedRequest = await budgetApprovalWorkflowService.reviewBudgetApproval(
        approvalRequest.id,
        currentUserId,
        reviewForm.decision,
        reviewForm.comments
      );
      
      setApprovalRequest(updatedRequest);
      setShowReviewModal(false);
      setReviewForm({ decision: 'approved', comments: '' });
      
      if (updatedRequest.status === 'approved' || updatedRequest.status === 'rejected') {
        onApprovalComplete?.(updatedRequest.status === 'approved');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'requires_changes': return 'text-amber-600 bg-amber-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'requires_changes': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getApproverStatus = (approver: BudgetApprovalRequest['approvers'][0]) => {
    switch (approver.status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const canUserReview = () => {
    if (!approvalRequest || approvalRequest.status !== 'pending') return false;
    
    return approvalRequest.approvers.some(approver => 
      approver.userId === currentUserId && approver.status === 'pending'
    );
  };

  if (loading && !approvalRequest) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading approval status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">Error</span>
        </div>
        <p className="text-red-700 mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Approval Status</h3>
          {!approvalRequest && (
            <Button onClick={() => setShowSubmitModal(true)} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>

        {!approvalRequest ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Budget has not been submitted for approval yet</p>
            <p className="text-sm text-gray-500">
              Once submitted, the budget will go through the approval workflow
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(approvalRequest.status)}`}>
                  {getStatusIcon(approvalRequest.status)}
                  <span className="ml-2 capitalize">{approvalRequest.status.replace('_', ' ')}</span>
                </div>
                <span className="text-sm text-gray-500">
                  Level {approvalRequest.currentApprovalLevel} of {approvalRequest.totalApprovalLevels}
                </span>
              </div>
              
              {canUserReview() && (
                <Button onClick={() => setShowReviewModal(true)} size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Review
                </Button>
              )}
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Submitted</p>
                <p className="text-sm font-medium">{approvalRequest.requestedAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Urgency</p>
                <p className={`text-sm font-medium capitalize ${
                  approvalRequest.urgency === 'high' ? 'text-red-600' : 
                  approvalRequest.urgency === 'low' ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {approvalRequest.urgency}
                </p>
              </div>
              {approvalRequest.deadline && (
                <div>
                  <p className="text-xs text-gray-600">Deadline</p>
                  <p className="text-sm font-medium">{approvalRequest.deadline.toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Justification */}
            {approvalRequest.justification && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Justification</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {approvalRequest.justification}
                </p>
              </div>
            )}

            {/* Approvers List */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Approval Progress</p>
              <div className="space-y-2">
                {approvalRequest.approvers.map((approver, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{approver.role}</p>
                        <p className="text-xs text-gray-600">User ID: {approver.userId}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-medium capitalize ${getApproverStatus(approver)}`}>
                        {approver.status}
                      </p>
                      {approver.reviewedAt && (
                        <p className="text-xs text-gray-500">
                          {approver.reviewedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments from reviewers */}
            {approvalRequest.approvers.some(a => a.comments) && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">Reviewer Comments</p>
                <div className="space-y-2">
                  {approvalRequest.approvers
                    .filter(approver => approver.comments)
                    .map((approver, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{approver.role}</p>
                        <p className="text-sm text-gray-700">{approver.comments}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Escalation Info */}
            {approvalRequest.escalation && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-800">Escalated</span>
                </div>
                <p className="text-sm text-amber-700">
                  {approvalRequest.escalation.reason}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Escalated on {approvalRequest.escalation.escalatedAt.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Submit for Approval Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Budget for Approval</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={submitForm.justification}
                onChange={(e) => setSubmitForm({ ...submitForm, justification: e.target.value })}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Explain why this budget should be approved..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency
                </label>
                <select
                  value={submitForm.urgency}
                  onChange={(e) => setSubmitForm({ ...submitForm, urgency: e.target.value as any })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={submitForm.deadline}
                  onChange={(e) => setSubmitForm({ ...submitForm, deadline: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowSubmitModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitForApproval}
              disabled={!submitForm.justification.trim() || loading}
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Budget Approval</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: 'approved', label: 'Approve', color: 'text-green-600' },
                  { value: 'requires_changes', label: 'Requires Changes', color: 'text-amber-600' },
                  { value: 'rejected', label: 'Reject', color: 'text-red-600' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="decision"
                      value={option.value}
                      checked={reviewForm.decision === option.value}
                      onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value as any })}
                      className="mr-2"
                    />
                    <span className={`text-sm ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add comments about your decision..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReviewApproval}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetApprovalWorkflowPanel;