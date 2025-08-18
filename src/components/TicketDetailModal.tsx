import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Calendar, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { Ticket, TicketComment, TicketStatus } from '../types';
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>();
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<Date | undefined>();
  const [localTicket, setLocalTicket] = useState<Ticket>(ticket);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Update local ticket when prop changes
  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket]);

  useEffect(() => {
    if (isOpen && ticket) {
      loadComments();
      checkCommentPermissions();
      loadUserNames();
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
    switch (priority) {
      case 'low':
        return 'bg-success-100 text-success-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
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
        return ['Quoting', 'Scheduled', 'Cancelled'];
      case 'Quoting':
        // Quote received and approved: Schedule work or Cancel
        return ['Scheduled', 'Cancelled'];
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={localTicket.title}
      description={
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(localTicket.status)}`}>
            {localTicket.status}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(localTicket.urgency)}`}>
            {localTicket.urgency} priority
          </span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Ticket Information Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ticket Details</h3>
          <p className="text-neutral-700 mb-4">
            {localTicket.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="w-4 h-4" />
              <span>{localTicket.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4" />
              <span>Created {formatDate(localTicket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <User className="w-4 h-4" />
              <span>Requested by {getFirstName(localTicket.requestedBy)}</span>
            </div>
            {localTicket.assignedTo && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User className="w-4 h-4" />
                <span>Assigned to {getFirstName(localTicket.assignedTo)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status-specific Information Card */}
        {(getActualScheduledDate() || getActualCompletedDate()) && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Schedule Information</h3>
            {getActualScheduledDate() && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Scheduled for {formatDate(getActualScheduledDate())}</span>
              </div>
            )}

            {getActualCompletedDate() && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <Calendar className="w-4 h-4" />
                <span>Completed on {formatDate(getActualCompletedDate())}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Log Card */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h4 className="text-md font-semibold text-neutral-900 mb-4">Activity Log</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {localTicket.activityLog.map((activity) => (
                <div key={activity.id} className="border-l-2 border-primary-200 pl-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-neutral-900">{activity.action}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">
                    {activity.description === 'Ticket created by user' ? 
                      `Ticket created by ${getFirstName(activity.performedBy)}` : 
                      activity.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>by {getFirstName(activity.performedBy)}</span>
                    <span>{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Status Update Card */}
          {canUpdateStatus && nextStatusOptions.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-md font-semibold text-neutral-900 mb-4">Move to Next Stage</h4>
              <div className="flex flex-wrap gap-2">
                {nextStatusOptions.map((status) => {
                  // Map status to user-friendly button text
                  const getButtonText = (status: TicketStatus) => {
                    switch (status) {
                      case 'Quoting': return 'Request Quote';
                      case 'Scheduled': 
                        return localTicket.status === 'New' ? 'Schedule Work (Skip Quoting)' : 'Schedule Work';
                      case 'Cancelled': return 'Cancel';
                      default: return status;
                    }
                  };
                  
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isUpdatingStatus}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      {getButtonText(status)}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Select the next status to move this ticket along the workflow
              </p>
            </div>
          )}

          {/* Reschedule Option for Scheduled Tickets */}
          {canUpdateStatus && localTicket.status === 'Scheduled' && (
            <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-md font-semibold text-neutral-900 mb-4">Reschedule Work</h4>
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Need to reschedule the work? This will add an entry to the activity log.
                </p>
                <button
                  onClick={() => setShowReschedulePicker(true)}
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Reschedule Work
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section - Wrapped in Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          <TicketComments
            ticketId={ticket.id}
            comments={comments}
            onAddComment={handleAddComment}
            canComment={canComment}
          />
        </div>
      </div>

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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </Modal>
  );
};
