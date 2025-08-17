import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Calendar, FileText } from 'lucide-react';
import { Ticket, TicketComment } from '../types';
import { TicketComments } from './TicketComments';
import { TicketCommentService } from '../services/ticketCommentService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Modal } from './UI';

interface TicketDetailModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedTicket: Ticket) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [canComment, setCanComment] = useState(false);

  useEffect(() => {
    if (isOpen && ticket) {
      loadComments();
      checkCommentPermissions();
    }
  }, [isOpen, ticket, currentUser]);

  const loadComments = async () => {
    try {
      const ticketComments = await TicketCommentService.getComments(ticket.id);
      setComments(ticketComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const checkCommentPermissions = () => {
    if (!currentUser) {
      setCanComment(false);
      return;
    }

    // For development, assume managers can comment on all tickets in their buildings
    // and residents can comment on their own tickets
    const userBuildingIds = currentUser.role === 'manager' ? ['building-1', 'building-2', 'building-3'] : [];
    
    const canUserComment = TicketCommentService.canUserComment(
      ticket.id,
      currentUser.id,
      currentUser.role as 'resident' | 'manager',
      userBuildingIds
    );
    
    setCanComment(canUserComment);
  };

  const handleAddComment = async (content: string) => {
    if (!currentUser) return;

    try {
      const newComment = await TicketCommentService.addComment(
        ticket.id,
        content,
        currentUser.id,
        currentUser.name || 'Unknown User',
        currentUser.role as 'resident' | 'manager'
      );

      setComments(prev => [...prev, newComment]);
      
      addNotification({
        userId: currentUser.id,
        title: 'Comment Added',
        message: 'Your comment has been posted successfully.',
        type: 'success'
      });

      // Update the ticket's comment count if onUpdate is provided
      if (onUpdate) {
        const updatedTicket = { ...ticket, comments: [...ticket.comments, newComment] };
        onUpdate(updatedTicket);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to add comment. Please try again.',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Ticket':
        return 'bg-info-100 text-info-800';
      case 'Manager Review':
        return 'bg-warning-100 text-warning-800';
      case 'Quote Management':
        return 'bg-info-100 text-info-800';
      case 'Work Order':
        return 'bg-warning-100 text-warning-800';
      case 'Complete':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger-100 text-danger-800';
      case 'medium':
        return 'bg-warning-100 text-warning-800';
      case 'low':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ticket Details"
      description={
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
            {ticket.status}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.urgency)}`}>
            {ticket.urgency} priority
          </span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Ticket Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {ticket.title}
              </h3>
              <p className="text-neutral-700">
                {ticket.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="w-4 h-4" />
                <span>{ticket.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Clock className="w-4 h-4" />
                <span>Created {formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User className="w-4 h-4" />
                <span>Requested by {ticket.requestedBy}</span>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <User className="w-4 h-4" />
                  <span>Assigned to {ticket.assignedTo}</span>
                </div>
              )}
            </div>

            {ticket.scheduledDate && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Calendar className="w-4 h-4" />
                <span>Scheduled for {formatDate(ticket.scheduledDate)}</span>
              </div>
            )}

            {ticket.completedDate && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <Calendar className="w-4 h-4" />
                <span>Completed on {formatDate(ticket.completedDate)}</span>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div>
            <h4 className="text-md font-semibold text-neutral-900 mb-3">Activity Log</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {ticket.activityLog.map((activity) => (
                <div key={activity.id} className="border-l-2 border-primary-200 pl-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-neutral-900">{activity.action}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">{activity.description}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>by {activity.performedBy}</span>
                    <span>{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <TicketComments
          ticketId={ticket.id}
          comments={comments}
          onAddComment={handleAddComment}
          canComment={canComment}
        />
      </div>
    </Modal>
  );
};
