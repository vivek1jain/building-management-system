import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Calendar, FileText, ChevronRight, Loader2, Award, DollarSign } from 'lucide-react';
import { Ticket, TicketComment, TicketStatus, EnhancedQuote } from '../types';
import { TicketComments } from './TicketComments';
import { TicketCommentService } from '../services/ticketCommentService';
import { ticketService } from '../services/ticketService';
import { ticketEventService } from '../services/ticketEventService';
import { UserBuildingService } from '../services/userBuildingService';
import { getUserFirstName, getUserDisplayNames } from '../services/userLookupService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Modal } from './UI';
import { DateTimePicker } from './DateTimePicker';
import SupplierSelectionModal from './Suppliers/SupplierSelectionModal';
import QuoteComparisonModal from './Tickets/QuoteComparisonModal';
import QuoteManagementModal from './Tickets/QuoteManagementModal';

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
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isLoadingModalContent, setIsLoadingModalContent] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>();
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<Date | undefined>();
  const [localTicket, setLocalTicket] = useState<Ticket>(ticket);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  
  // Quote workflow states
  const [showSupplierSelection, setShowSupplierSelection] = useState(false);
  const [showQuoteComparison, setShowQuoteComparison] = useState(false);
  const [showQuoteManagement, setShowQuoteManagement] = useState(false);

  // Update local ticket when prop changes
  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket]);

  useEffect(() => {
    if (isOpen && ticket && currentUser) {
      setIsLoadingModalContent(true);
      setIsCheckingPermissions(true);
      Promise.all([
        loadComments(),
        checkCommentPermissions(),
        loadUserNames()
      ]).finally(() => {
        setIsCheckingPermissions(false);
        setIsLoadingModalContent(false);
      });
    } else if (isOpen) {
      // If modal is open but we don't have the required data, still show loading
      setIsLoadingModalContent(true);
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

  const checkCommentPermissions = async () => {
    if (!currentUser) {
      setCanComment(false);
      return;
    }

    // Get user's building associations using the UserBuildingService
    const userBuildingIds = UserBuildingService.getUserBuildingIds(currentUser);
    const userResidentId = UserBuildingService.getUserResidentId(currentUser);
    
    // For debugging - log permission check details
    console.log('🔍 Checking comment permissions:', {
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      ticketId: ticket.id,
      ticketBuildingId: ticket.buildingId,
      ticketRequestedBy: ticket.requestedBy,
      userBuildingIds,
      userResidentId
    });
    
    const canUserComment = await TicketCommentService.canUserComment(
      ticket.id,
      userResidentId || currentUser.id, // Use resident ID if available
      currentUser.role as 'resident' | 'manager',
      userBuildingIds
    );
    
    console.log('✅ Comment permission result:', canUserComment);
    setCanComment(canUserComment);
  };

  const handleAddComment = async (content: string) => {
    if (!currentUser) return;

    try {
      console.log('🔄 Starting comment addition process...');
      const newComment = await TicketCommentService.addComment(
        ticket.id,
        content,
        currentUser.id,
        currentUser.name || 'Unknown User',
        currentUser.role as 'resident' | 'manager'
      );
      console.log('✅ Comment service call completed successfully');

      setComments(prev => [...prev, newComment]);
      console.log('✅ Local comments state updated');
      
      addNotification({
        userId: currentUser.id,
        title: 'Comment Added',
        message: 'Your comment has been posted successfully.',
        type: 'success'
      });
      console.log('✅ Success notification added');

      // Update the ticket's comment count if onUpdate is provided
      if (onUpdate) {
        try {
          const updatedTicket = { ...ticket, comments: [...ticket.comments, newComment] };
          onUpdate(updatedTicket);
          console.log('✅ Parent component notified via onUpdate');
        } catch (updateError) {
          console.error('⚠️ Error in onUpdate callback:', updateError);
          // Don't throw this error as it's not critical for comment posting
        }
      }
      console.log('✅ Comment addition process completed successfully');
    } catch (error) {
      console.error('❌ Failed to add comment:', error);
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
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quoting': return 'bg-yellow-100 text-yellow-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'Complete': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-gray-800';
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

  // Simplified 6-stage workflow transitions
  const getNextStatusOptions = (currentStatus: TicketStatus): TicketStatus[] => {
    switch (currentStatus) {
      case 'New':
        // Manager reviews: Request quotes, Schedule directly (skip quoting), or Cancel
        return ['Quoting', 'Scheduled'];
      case 'Quoting':
        // Quote received and approved: Schedule work or Cancel
        return ['Scheduled'];
      case 'Scheduled':
        // Work scheduled and completed: Mark complete
        return ['Complete'];
      case 'Complete':
        // Work complete: Close ticket
        return ['Closed'];
      case 'Closed':
      case 'Cancelled':
        // Terminal states - no further transitions
        return [];
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!currentUser) return;

    // If transitioning to Quoting, show supplier selection modal
    if (newStatus === 'Quoting') {
      setShowSupplierSelection(true);
      return;
    }

    // If transitioning to Scheduled, show the date picker
    if (newStatus === 'Scheduled') {
      setShowSchedulePicker(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await ticketService.updateTicketStatus(ticket.id, newStatus, currentUser.id);
      
      // Handle event updates for status changes
      if (newStatus === 'Complete') {
        await ticketEventService.completeEventForTicket(ticket.id);
      } else if (newStatus === 'Cancelled') {
        await ticketEventService.cancelEventForTicket(ticket.id);
      }
      
      // Update the local ticket object
      const updatedTicket = {
        ...ticket,
        status: newStatus,
        updatedAt: new Date()
      };

      // Call the onUpdate callback to update the parent component
      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      addNotification({
        userId: currentUser.id,
        title: 'Status Updated',
        message: `Ticket status changed to ${newStatus}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      addNotification({
        userId: currentUser.id,
        title: 'Error',
        message: 'Failed to update ticket status. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle quote workflow events
  const handleQuotesRequested = () => {
    setShowSupplierSelection(false);
    
    // Refresh the ticket to show updated status
    if (onUpdate) {
      const updatedTicket = {
        ...localTicket,
        status: 'Quoting' as TicketStatus,
        updatedAt: new Date()
      };
      setLocalTicket(updatedTicket);
      onUpdate(updatedTicket);
    }
  };

  const handleQuoteSelected = (quoteId: string) => {
    setShowQuoteComparison(false);
    
    // Refresh the ticket data
    if (onUpdate) {
      // In a real implementation, you'd fetch the updated ticket
      // For now, we'll just update the local state
      const updatedTicket = {
        ...localTicket,
        updatedAt: new Date()
      };
      setLocalTicket(updatedTicket);
      onUpdate(updatedTicket);
    }
  };

  const handleQuoteManagement = () => {
    setShowQuoteManagement(false);
    
    // Refresh the ticket data to show any updates
    if (onUpdate) {
      const updatedTicket = {
        ...localTicket,
        updatedAt: new Date()
      };
      setLocalTicket(updatedTicket);
      onUpdate(updatedTicket);
    }
  };

  const handleScheduleWithDate = async () => {
    if (!currentUser || !selectedScheduleDate) return;

    setIsUpdatingStatus(true);
    try {
      // Schedule the ticket with the selected date
      await ticketService.scheduleTicket(ticket.id, selectedScheduleDate, currentUser.id);
      
      // Create an event for the scheduled work
      await ticketEventService.createEventForScheduledTicket(ticket, selectedScheduleDate, currentUser.id);
      
      // Create activity log entry for the local update
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Scheduled',
        description: `Work scheduled for ${selectedScheduleDate.toLocaleString()} by ${currentUser.name || 'Unknown User'}`,
        performedBy: currentUser.id,
        timestamp: new Date(),
        metadata: { scheduledDate: selectedScheduleDate.toISOString() }
      };

      // Update the local ticket object with new activity log
      const updatedTicket = {
        ...localTicket,
        status: 'Scheduled' as TicketStatus,
        scheduledDate: selectedScheduleDate,
        activityLog: [...localTicket.activityLog, activityLogEntry],
        updatedAt: new Date()
      };

      // Update local state to immediately reflect changes in the modal
      setLocalTicket(updatedTicket);

      // Call the onUpdate callback to update the parent component
      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      addNotification({
        userId: currentUser.id,
        title: 'Work Scheduled',
        message: `Work scheduled for ${selectedScheduleDate.toLocaleString()}`,
        type: 'success'
      });

      // Reset state
      setShowSchedulePicker(false);
      setSelectedScheduleDate(undefined);
    } catch (error) {
      console.error('Failed to schedule work:', error);
      addNotification({
        userId: currentUser.id,
        title: 'Error',
        message: 'Failed to schedule work. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRescheduleWithDate = async () => {
    if (!currentUser || !selectedRescheduleDate) return;

    setIsUpdatingStatus(true);
    try {
      // Reschedule the ticket with the new date
      await ticketService.rescheduleTicket(ticket.id, selectedRescheduleDate, currentUser.id);
      
      // Update the associated event
      await ticketEventService.updateEventForRescheduledTicket(ticket.id, selectedRescheduleDate);
      
      // Update the local ticket object
      const updatedTicket = {
        ...ticket,
        scheduledDate: selectedRescheduleDate,
        updatedAt: new Date()
      };

      // Call the onUpdate callback to update the parent component
      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      addNotification({
        userId: currentUser.id,
        title: 'Work Rescheduled',
        message: `Work rescheduled to ${selectedRescheduleDate.toLocaleString()}`,
        type: 'success'
      });

      // Reset state
      setShowReschedulePicker(false);
      setSelectedRescheduleDate(undefined);
    } catch (error) {
      console.error('Failed to reschedule work:', error);
      addNotification({
        userId: currentUser.id,
        title: 'Error',
        message: 'Failed to reschedule work. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReschedule = async () => {
    if (!currentUser) return;

    setIsUpdatingStatus(true);
    try {
      // Add activity log entry for rescheduling using the ticket service
      await ticketService.addActivityLogEntry(
        ticket.id,
        'Rescheduled',
        'Work has been rescheduled',
        currentUser.id,
        {}
      );

      // Create updated ticket with new activity log entry for local update
      const activityLogEntry = {
        id: Date.now().toString(),
        action: 'Rescheduled',
        description: 'Work has been rescheduled',
        performedBy: currentUser.id,
        timestamp: new Date(),
        metadata: {}
      };

      const updatedTicket = {
        ...ticket,
        activityLog: [...ticket.activityLog, activityLogEntry],
        updatedAt: new Date()
      };

      // Call the onUpdate callback to update the parent component
      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      addNotification({
        userId: currentUser.id,
        title: 'Rescheduled',
        message: 'Work has been rescheduled',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to reschedule:', error);
      addNotification({
        userId: currentUser.id,
        title: 'Error',
        message: 'Failed to reschedule work. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Load user names for display
  const loadUserNames = async () => {
    try {
      // Collect all user IDs from the ticket
      const userIds = new Set<string>();
      
      // Add requestedBy and assignedTo
      if (localTicket.requestedBy) userIds.add(localTicket.requestedBy);
      if (localTicket.assignedTo) userIds.add(localTicket.assignedTo);
      
      // Add all user IDs from activity log
      localTicket.activityLog.forEach(activity => {
        if (activity.performedBy) userIds.add(activity.performedBy);
      });
      
      // Convert to array and fetch names
      const userIdArray = Array.from(userIds);
      console.log('🔍 Loading user names for UIDs:', userIdArray);
      console.log('📋 Ticket details:', {
        requestedBy: localTicket.requestedBy,
        assignedTo: localTicket.assignedTo,
        activityLogCount: localTicket.activityLog.length,
        activityPerformers: localTicket.activityLog.map(a => a.performedBy)
      });
      
      if (userIdArray.length > 0) {
        const names = await getUserDisplayNames(userIdArray);
        console.log('✅ Resolved user names from service:', names);
        
        // Enhance with current user info if available
        if (currentUser && currentUser.name) {
          // If current user is in the list and has a fallback name, use their real name
          if (userIdArray.includes(currentUser.id)) {
            const currentUserFallback = names[currentUser.id];
            if (currentUserFallback && currentUserFallback.startsWith('User ')) {
              names[currentUser.id] = currentUser.name;
              console.log(`🔧 Using current user name for ${currentUser.id}: ${currentUser.name}`);
            }
          }
        }
        
        console.log('✅ Final resolved user names:', names);
        setUserNames(names);
      }
    } catch (error) {
      console.error('Failed to load user names:', error);
    }
  };

  // Helper function to get display name for a user ID
  const getDisplayName = (userId: string): string => {
    return userNames[userId] || `User ${userId.substring(0, 8)}...`;
  };

  // Helper function to get first name for a user ID
  const getFirstName = (userId: string): string => {
    const fullName = getDisplayName(userId);
    const parts = fullName.split(' ');
    return parts[0] || 'Unknown';
  };

  const canUpdateStatus = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const nextStatusOptions = getNextStatusOptions(localTicket.status);

  // All possible workflow stages in order (excluding 'New' since it's not actionable)
  const getAllWorkflowStages = (): TicketStatus[] => {
    return ['Quoting', 'Scheduled', 'Complete', 'Closed'];
  };
  
  // Get all workflow stages including Cancel
  const getAllWorkflowStagesWithCancel = (): TicketStatus[] => {
    return ['New', 'Quoting', 'Scheduled', 'Complete', 'Closed', 'Cancelled'];
  };
  
  // Check if a status is available as next step
  const isStatusAvailable = (status: TicketStatus): boolean => {
    return nextStatusOptions.includes(status);
  };
  
  // Render workflow footer with all stages
  const renderStickyFooter = () => {
    if (!canUpdateStatus) return null;

    const allStages = getAllWorkflowStages();
    
    // Map status to user-friendly button text
    const getButtonText = (status: TicketStatus) => {
      switch (status) {
        case 'New': return 'New';
        case 'Quoting': return 'Quote';
        case 'Scheduled': return 'Schedule';
        case 'Complete': return 'Complete';
        case 'Closed': return 'Close';
        case 'Cancelled': return 'Cancel';
        default: return status;
      }
    };
    
    const getButtonColor = (status: TicketStatus, isAvailable: boolean, isCurrent: boolean) => {
      if (isCurrent) {
        return 'bg-primary-600 text-white';
      }
      if (!isAvailable) {
        return 'bg-gray-300 text-gray-500 cursor-not-allowed';
      }
      // Cancel is always red, everything else is primary
      if (status === 'Cancelled') {
        return 'bg-red-600 hover:bg-red-700 text-white';
      }
      return 'bg-primary-600 hover:bg-primary-700 text-white';
    };

    // Debug function to log button state
    const logButtonState = (status: TicketStatus) => {
      const isAvailable = isStatusAvailable(status);
      const isCurrent = localTicket.status === status;
      console.log(`Button ${status}:`, {
        currentTicketStatus: localTicket.status,
        isAvailable,
        isCurrent,
        nextStatusOptions,
        color: getButtonColor(status, isAvailable, isCurrent)
      });
    };

    return (
      <div className="space-y-3 text-center">
        <h4 className="text-sm font-semibold text-neutral-900">Workflow</h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Main workflow stages */}
          {allStages.map((status) => {
            const isAvailable = isStatusAvailable(status);
            const isCurrent = localTicket.status === status;
            
            return (
              <button
                key={status}
                onClick={isAvailable ? () => handleStatusUpdate(status) : undefined}
                disabled={!isAvailable || isUpdatingStatus}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${getButtonColor(status, isAvailable, isCurrent)}`}
              >
                {isUpdatingStatus && isAvailable ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  isAvailable && !isCurrent && <ChevronRight className="w-4 h-4 mr-2" />
                )}
                {getButtonText(status)}
              </button>
            );
          })}
          
          {/* Cancel button - always enabled except for already cancelled/closed tickets */}
          {localTicket.status !== 'Cancelled' && localTicket.status !== 'Closed' && (
            <button
              onClick={() => handleStatusUpdate('Cancelled')}
              disabled={isUpdatingStatus}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${getButtonColor('Cancelled', true, localTicket.status === 'Cancelled')}`}
            >
              {isUpdatingStatus ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  // Get actual scheduled/completed dates from activity log or status changes
  const getActualScheduledDate = () => {
    // Only show scheduled date if ticket is actually scheduled
    if (localTicket.status !== 'Scheduled' && localTicket.status !== 'Complete' && localTicket.status !== 'Closed') {
      return null;
    }
    
    const scheduledActivity = localTicket.activityLog.find(log => 
      log.action.toLowerCase().includes('scheduled') || 
      (log.action === 'Status Updated' && log.description.includes('Scheduled'))
    );
    return scheduledActivity?.timestamp || localTicket.scheduledDate;
  };

  const getActualCompletedDate = () => {
    // Only show completed date if ticket is actually completed
    if (localTicket.status !== 'Complete' && localTicket.status !== 'Closed') {
      return null;
    }
    
    const completedActivity = localTicket.activityLog.find(log => 
      log.action.toLowerCase().includes('completed') || 
      (log.action === 'Status Updated' && log.description.includes('Complete'))
    );
    return completedActivity?.timestamp || localTicket.completedDate;
  };

  // Custom header with status and priority badges
  const customHeader = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-xl font-semibold text-neutral-900 truncate flex-1 mr-4">
        {localTicket.title}
      </h2>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(localTicket.status)}`}>
          {localTicket.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(localTicket.urgency)}`}>
          {localTicket.urgency}
        </span>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customHeader}
      footer={renderStickyFooter()}
      size="xl"
    >
      {isLoadingModalContent ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-600" />
            <p className="text-sm text-neutral-600">Loading ticket details...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Ticket Information Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          {/* Main description - emphasized */}
          <p className="text-neutral-900 text-base leading-relaxed mb-4">
            {localTicket.description}
          </p>
          
          {/* Footer info - inline */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Requested by {getFirstName(localTicket.requestedBy)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{localTicket.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Created {formatDate(localTicket.createdAt)}</span>
            </div>
            {localTicket.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Assigned to {getFirstName(localTicket.assignedTo)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status-specific Information Card - Only show for Completed tickets */}
        {getActualCompletedDate() && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Work Completed</h3>
            <div className="flex items-center gap-2 text-sm text-success-600">
              <Calendar className="w-4 h-4" />
              <span>Completed on {formatDate(getActualCompletedDate())}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Management - Contextual based on status */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm relative">
            <h4 className="text-md font-semibold text-neutral-900 mb-4">Ticket Management</h4>
            
            {/* New Ticket */}
            {localTicket.status === 'New' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-sm font-medium text-blue-800">New Ticket</p>
                    <p className="text-xs text-blue-600">
                      This ticket needs to be reviewed and processed
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    Get{' '}
                    <button
                      onClick={() => handleStatusUpdate('Quoting')}
                      className="text-primary-600 hover:text-primary-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded transition-colors duration-200"
                    >
                      Quotes
                    </button>
                    {' '}or{' '}
                    <button
                      onClick={() => handleStatusUpdate('Scheduled')}
                      className="text-primary-600 hover:text-primary-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded transition-colors duration-200"
                    >
                      Schedule
                    </button>
                    {' '}with a preferred supplier.
                  </p>
                </div>
              </div>
            )}
            
            {/* Quoting Ticket */}
            {localTicket.status === 'Quoting' && (
              <>
                {/* Content Area */}
                <div className="space-y-3 pb-16"> {/* Add bottom padding for buttons */}
                  <p className="text-sm text-neutral-600">
                    Request{' '}
                    <button
                      onClick={() => setShowQuoteManagement(true)}
                      className="text-primary-600 hover:text-primary-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded transition-colors duration-200"
                    >
                      quotes
                    </button>
                    , track responses and select supplier to engage.
                  </p>
                  
                  {/* Quote List with scrolling */}
                  {localTicket.quotes && localTicket.quotes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-neutral-700">Received Quotes ({localTicket.quotes.length}):</h5>
                      <div className="space-y-2 overflow-y-auto max-h-48">
                        {localTicket.quotes.map((quote, index) => (
                          <div key={quote.id || index} className="flex items-center justify-between p-2 bg-neutral-50 rounded border flex-shrink-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-neutral-900">
                                {quote.supplierName || quote.supplier?.name || `Supplier ${index + 1}`}
                              </p>
                            </div>
                            <div className="text-sm font-semibold text-neutral-900">
                              £{typeof quote.amount === 'number' ? quote.amount.toLocaleString() : quote.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sticky Action Buttons at bottom of tile */}
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button
                    onClick={() => setShowQuoteManagement(true)}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                  >
                    Manage
                  </button>
                  
                  {localTicket.quotes && localTicket.quotes.length > 0 && (
                    <button
                      onClick={() => setShowQuoteComparison(true)}
                      className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                    >
                      Select
                    </button>
                  )}
                </div>
              </>
            )}
            
            {/* Scheduled Ticket */}
            {localTicket.status === 'Scheduled' && (
              <>
                {/* Content Area */}
                <div className="space-y-3 pb-16"> {/* Add bottom padding for button */}
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div>
                      <p className="text-sm font-medium text-cyan-800">Work Scheduled</p>
                      <p className="text-xs text-cyan-600">
                        {localTicket.scheduledDate ? formatDate(localTicket.scheduledDate) : 'Date not set'}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-cyan-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600">
                      Work has been scheduled.{' '}
                      <button
                        onClick={() => setShowReschedulePicker(true)}
                        className="text-primary-600 hover:text-primary-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded transition-colors duration-200"
                      >
                        Reschedule
                      </button>
                      {' '}here.
                    </p>
                  </div>
                </div>
                
                {/* Sticky Reschedule Button at bottom of tile */}
                <div className="absolute bottom-6 right-6">
                  <button
                    onClick={() => setShowReschedulePicker(true)}
                    disabled={isUpdatingStatus}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 transition-colors duration-200"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rescheduling...
                      </>
                    ) : (
                      'Reschedule'
                    )}
                  </button>
                </div>
              </>
            )}
            
            {/* Complete Ticket */}
            {localTicket.status === 'Complete' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-green-800">Work Completed</p>
                    <p className="text-xs text-green-600">
                      {localTicket.completedDate ? formatDate(localTicket.completedDate) : 'Recently completed'}
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    The work has been completed. Close this ticket when you're ready.
                  </p>
                  {canUpdateStatus && (
                    <button
                      onClick={() => handleStatusUpdate('Closed')}
                      disabled={isUpdatingStatus}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 transition-colors duration-200"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      Close Ticket
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Closed or Cancelled Ticket */}
            {(localTicket.status === 'Closed' || localTicket.status === 'Cancelled') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{localTicket.status} Ticket</p>
                    <p className="text-xs text-gray-600">
                      No further actions needed
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    {localTicket.status === 'Closed' ? 
                      'This ticket has been completed and closed.' : 
                      'This ticket has been cancelled and no further action is required.'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Comments Section */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <TicketComments
              ticketId={ticket.id}
              comments={comments}
              onAddComment={handleAddComment}
              canComment={canComment}
              isCheckingPermissions={isCheckingPermissions}
              hideCommentIcon={true}
              postButtonTitle="Post"
              hideCommentAsDescription={true}
            />
          </div>
        </div>

        {/* Activity Log - Full Width at Bottom */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-md font-semibold text-neutral-900 mb-4">Activity Log</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {localTicket.activityLog.map((activity) => (
              <div key={activity.id} className="border-l-2 border-primary-200 pl-4 py-2 flex items-center justify-between hover:bg-neutral-25 transition-colors duration-150">
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="font-medium text-neutral-900 text-sm">{activity.action}</span>
                  <span className="text-sm text-neutral-600 truncate">
                    {activity.description === 'Ticket created by user' ? 
                      `Ticket created by ${getFirstName(activity.performedBy)}` : 
                      activity.description}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 flex-shrink-0">
                  <span>by {getFirstName(activity.performedBy)}</span>
                  <span>{formatDate(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Schedule Date Picker Modal */}
      {showSchedulePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Schedule Work</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Select the date and time when the work should be performed.
            </p>
            <DateTimePicker
              selectedDate={selectedScheduleDate}
              onDateTimeChange={setSelectedScheduleDate}
              minDate={new Date()}
              label="Scheduled Date & Time"
              className="mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSchedulePicker(false);
                  setSelectedScheduleDate(undefined);
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleWithDate}
                disabled={!selectedScheduleDate || isUpdatingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Work'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Date Picker Modal */}
      {showReschedulePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reschedule Work</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Select the new date and time for the work.
            </p>
            <DateTimePicker
              selectedDate={selectedRescheduleDate}
              onDateTimeChange={setSelectedRescheduleDate}
              minDate={new Date()}
              label="New Scheduled Date & Time"
              className="mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReschedulePicker(false);
                  setSelectedRescheduleDate(undefined);
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleWithDate}
                disabled={!selectedRescheduleDate || isUpdatingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Work'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Selection Modal */}
      <SupplierSelectionModal
        isOpen={showSupplierSelection}
        onClose={() => setShowSupplierSelection(false)}
        ticketId={ticket.id}
        onQuotesRequested={handleQuotesRequested}
      />

      {/* Quote Comparison Modal */}
      <QuoteComparisonModal
        isOpen={showQuoteComparison}
        onClose={() => setShowQuoteComparison(false)}
        ticketId={ticket.id}
        quotes={localTicket.quotes as EnhancedQuote[] || []}
        onQuoteSelected={handleQuoteSelected}
      />

      {/* Quote Management Modal */}
      <QuoteManagementModal
        isOpen={showQuoteManagement}
        onClose={() => setShowQuoteManagement(false)}
        ticketId={ticket.id}
        quoteRequests={localTicket.quoteRequests || []}
        onQuotesUpdated={handleQuoteManagement}
      />
    </Modal>
  );
};
