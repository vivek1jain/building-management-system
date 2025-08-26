import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Calendar, FileText, ChevronRight, Loader2, Award, DollarSign } from 'lucide-react';
import { Ticket, TicketComment, TicketStatus, EnhancedQuote } from '../types';
import { TicketCommentService } from '../services/ticketCommentService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { ticketService } from '../services/ticketService';
import { ticketEventService } from '../services/ticketEventService';
import { expenseService } from '../services/expenseService';
import { UserBuildingService } from '../services/userBuildingService';
import { getUserDisplayNames } from '../services/userLookupService';
import Modal from './UI/Modal';
import SupplierSelectionModal from './Suppliers/SupplierSelectionModal';
import QuoteComparisonModal from './Tickets/QuoteComparisonModal';
import QuoteManagementModal from './Tickets/QuoteManagementModal';
import ScheduleModal from './Scheduling/ScheduleModal';
import { TicketComments } from './TicketComments';
import TicketCompletionModal from './TicketCompletionModal';

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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [localTicket, setLocalTicket] = useState<Ticket>(ticket);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  
  // Quote workflow states
  const [showSupplierSelection, setShowSupplierSelection] = useState(false);
  const [showQuoteComparison, setShowQuoteComparison] = useState(false);
  const [showQuoteManagement, setShowQuoteManagement] = useState(false);
  
  // Completion workflow state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isCompletingTicket, setIsCompletingTicket] = useState(false);
  
  // Expense tracking state
  const [linkedExpense, setLinkedExpense] = useState<any>(null);
  const [loadingExpense, setLoadingExpense] = useState(false);

  // Debug: Track showQuoteManagement state changes
  useEffect(() => {
    console.log('🔄 showQuoteManagement state changed:', showQuoteManagement)
  }, [showQuoteManagement])

  // Update local ticket when prop changes
  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket]);

  // Load linked expense when ticket is complete
  useEffect(() => {
    const loadLinkedExpense = async () => {
      if (localTicket.status === 'Complete' && isOpen) {
        setLoadingExpense(true);
        try {
          const expenses = await expenseService.getExpensesByTicketId(localTicket.id);
          if (expenses && expenses.length > 0) {
            setLinkedExpense(expenses[0]); // Take the first/main expense linked to this ticket
          }
        } catch (error) {
          console.error('Failed to load linked expense:', error);
        } finally {
          setLoadingExpense(false);
        }
      } else {
        setLinkedExpense(null);
      }
    };

    loadLinkedExpense();
  }, [localTicket.status, localTicket.id, isOpen]);

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
      case 'Ready for Scheduling': return 'bg-green-100 text-green-800' // Historic status
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

  // Simplified workflow transitions
  const getNextStatusOptions = (currentStatus: TicketStatus): TicketStatus[] => {
    switch (currentStatus) {
      case 'New':
        // Manager reviews: Request quotes, Schedule directly (skip quoting), or Cancel
        return ['Quoting', 'Scheduled'];
      case 'Quoting':
        // Quote received and approved: Schedule work or Cancel
        return ['Scheduled'];
      case 'Ready for Scheduling':
        // Historic status - allow scheduling
        return ['Scheduled'];
      case 'Scheduled':
        // Work scheduled and completed: Mark complete
        return ['Complete'];
      case 'Complete':
        // Work complete: Close ticket
        return ['Closed'];
      case 'Closed':
        // Terminal state - but allow re-opening within 7 days for managers
        return canReopenTicket() ? ['Complete'] : [];
      case 'Cancelled':
        // Terminal state - no further transitions
        return [];
      default:
        return [];
    }
  };

  // Check if ticket can be reopened (within 7 days, by managers only)
  const canReopenTicket = (): boolean => {
    console.log('🔍 Checking canReopenTicket:', {
      canUpdateStatus,
      currentUserRole: currentUser?.role,
      ticketStatus: localTicket.status,
      activityLogLength: localTicket.activityLog.length,
      hasCompletedDate: !!(localTicket as any).completedDate
    });
    
    if (!canUpdateStatus || localTicket.status !== 'Complete') {
      console.log('❌ canReopenTicket: Failed basic checks', { canUpdateStatus, status: localTicket.status });
      return false;
    }
    
    // Prefer explicit completedDate if present
    const completedDateFromField = (localTicket as any).completedDate ? new Date((localTicket as any).completedDate as any) : null;

    // Find when the ticket was completed from activity log (more robust matching)
    const completedActivity = localTicket.activityLog.find(log => {
      const action = (log.action || '').toLowerCase();
      const description = (log.description || '').toLowerCase();
      const newStatus = (log as any).metadata?.newStatus;

      const matches = (
        // Status Updated -> ... to Complete (case-insensitive) OR metadata flag
        (log.action === 'Status Updated' && (description.includes('complete') || newStatus === 'Complete')) ||
        // Any action containing the word "completed" (e.g., "Work Completed")
        action.includes('completed') ||
        // Exact action labels sometimes used
        action === 'complete'
      );

      if (matches) {
        console.log('✅ Found completed activity:', log);
      }
      return matches;
    });
    
    console.log('🔍 Activity log search results:', {
      foundCompletedActivity: !!completedActivity,
      allActivities: localTicket.activityLog.map(log => ({ action: log.action, description: log.description, timestamp: log.timestamp }))
    });
    
    if (!completedActivity && !completedDateFromField) {
      console.log('❌ canReopenTicket: No completed activity or completedDate found');
      return false;
    }

    const completionTimestamp = completedDateFromField?.getTime() ?? new Date((completedActivity as any).timestamp).getTime();
    
    // Check if it's within 7 days
    const daysSinceCompleted = Math.floor(
      (Date.now() - completionTimestamp) / (1000 * 60 * 60 * 24)
    );
    
    console.log('📅 Time check:', {
      completedTimestamp: completedDateFromField ?? (completedActivity as any)?.timestamp,
      daysSinceCompleted,
      withinSevenDays: daysSinceCompleted <= 7
    });
    
    const canReopen = daysSinceCompleted <= 7;
    console.log('✅ Final canReopenTicket result:', canReopen);
    return canReopen;
  };

  // Get days remaining for reopening
  const getDaysRemainingForReopen = (): number => {
    if (localTicket.status !== 'Complete') return 0;
    
    const completedDateFromField = (localTicket as any).completedDate ? new Date((localTicket as any).completedDate as any) : null;

    const completedActivity = localTicket.activityLog.find(log => 
      ((log.action === 'Status Updated') && ((log.description || '').toLowerCase().includes('complete') || (log as any).metadata?.newStatus === 'Complete')) ||
      (log.action || '').toLowerCase().includes('completed') ||
      (log.action || '').toLowerCase() === 'complete'
    );
    
    if (!completedActivity && !completedDateFromField) return 0;

    const completionTimestamp = completedDateFromField?.getTime() ?? new Date((completedActivity as any).timestamp).getTime();
    
    const daysSinceCompleted = Math.floor(
      (Date.now() - completionTimestamp) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(0, 7 - daysSinceCompleted);
  };

  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!currentUser) return;

    // If transitioning to Quoting, show supplier selection modal
    if (newStatus === 'Quoting') {
      setShowSupplierSelection(true);
      return;
    }

    // If transitioning to Scheduled, show the enhanced schedule modal
    if (newStatus === 'Scheduled') {
      setShowScheduleModal(true);
      return;
    }

    // If transitioning to Complete, show the completion modal
    if (newStatus === 'Complete') {
      setShowCompletionModal(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await ticketService.updateTicketStatus(ticket.id, newStatus, currentUser.id);
      
      // Handle event updates for status changes  
      if (newStatus === 'Cancelled') {
        await ticketEventService.cancelEventForTicket(ticket.id);
      }
      
      // Update the local ticket object
      const updatedTicket = {
        ...localTicket,
        status: newStatus,
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
  const handleQuotesRequested = async () => {
    console.log('🔄 handleQuotesRequested called');
    setShowSupplierSelection(false);
    
    // Fetch the updated ticket data from Firebase to get the new quote requests
    try {
      console.log('📥 Fetching updated ticket data for:', ticket.id);
      const updatedTicketData = await ticketService.getTicketById(ticket.id);
      console.log('📋 Updated ticket data received:', {
        id: updatedTicketData?.id,
        status: updatedTicketData?.status,
        quoteRequestsLength: updatedTicketData?.quoteRequests?.length || 0,
        quotesLength: updatedTicketData?.quotes?.length || 0
      });
      
      if (updatedTicketData) {
        console.log('✅ Setting localTicket with updated data')
        console.log('🔍 Updated ticket quoteRequests:', updatedTicketData.quoteRequests?.length || 0, 'items')
        console.log('📋 QuoteRequests data sample:', updatedTicketData.quoteRequests?.slice(0, 2))
        setLocalTicket(updatedTicketData)
        if (onUpdate) {
          console.log('✅ Calling onUpdate with updated data')
          onUpdate(updatedTicketData)
        }
      } else {
        console.log('❌ No updated ticket data, using fallback');
        // Fallback: just update the status if we can't fetch the ticket
        const updatedTicket = {
          ...localTicket,
          status: 'Quoting' as TicketStatus,
          updatedAt: new Date()
        };
        setLocalTicket(updatedTicket);
        if (onUpdate) {
          onUpdate(updatedTicket);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch updated ticket data:', error);
      // Fallback: just update the status
      const updatedTicket = {
        ...localTicket,
        status: 'Quoting' as TicketStatus,
        updatedAt: new Date()
      };
      setLocalTicket(updatedTicket);
      if (onUpdate) {
        onUpdate(updatedTicket);
      }
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

  const handleQuoteManagement = async () => {
    // Don't close the modal here - let the modal close itself when needed
    
    // Fetch the updated ticket data from Firebase to get the latest quote requests
    try {
      console.log('📥 Fetching updated ticket data for quote management:', ticket.id);
      const updatedTicketData = await ticketService.getTicketById(ticket.id);
      console.log('📋 Updated ticket data received:', {
        id: updatedTicketData?.id,
        status: updatedTicketData?.status,
        quoteRequestsLength: updatedTicketData?.quoteRequests?.length || 0,
        quotesLength: updatedTicketData?.quotes?.length || 0
      });
      
      if (updatedTicketData) {
        console.log('✅ Setting localTicket with updated data from quote management')
        console.log('🔍 Updated ticket quoteRequests:', updatedTicketData.quoteRequests?.length || 0, 'items')
        setLocalTicket(updatedTicketData)
        if (onUpdate) {
          console.log('✅ Calling onUpdate with updated data from quote management')
          onUpdate(updatedTicketData)
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch updated ticket data in quote management:', error);
      // Fallback: just update the timestamp
      const updatedTicket = {
        ...localTicket,
        updatedAt: new Date()
      };
      setLocalTicket(updatedTicket);
      if (onUpdate) {
        onUpdate(updatedTicket);
      }
    }
  };

  // Handle scheduling from enhanced ScheduleModal
  const handleScheduleWork = async (event: any, supplierInfo?: any) => {
    if (!currentUser) return;

    setIsUpdatingStatus(true);
    try {
      // 1. Schedule the ticket (this updates status, date, and adds activity log)
      await ticketService.scheduleTicket(ticket.id, event.startDate, currentUser.id);
      
      // 2. Create the calendar event
      await ticketEventService.createEventForScheduledTicket(
        localTicket,
        event.startDate,
        currentUser.id
      );
      
      // 3. Add additional activity log entry if supplier info is provided
      if (supplierInfo) {
        await ticketService.addActivityLogEntry(
          ticket.id,
          'Supplier Assigned',
          `Work scheduled with ${supplierInfo.supplier.name} at expected cost: $${supplierInfo.expectedCost}`,
          currentUser.id,
          { 
            supplierName: supplierInfo.supplier.name,
            expectedCost: supplierInfo.expectedCost
          }
        );
      }

      // 5. Fetch the updated ticket data from Firebase to get the latest activity log
      try {
        console.log('📥 Fetching updated ticket data after scheduling:', ticket.id);
        const updatedTicketData = await ticketService.getTicketById(ticket.id);
        console.log('📋 Updated ticket data received after scheduling:', {
          id: updatedTicketData?.id,
          status: updatedTicketData?.status,
          activityLogLength: updatedTicketData?.activityLog?.length || 0
        });
        
        if (updatedTicketData) {
          console.log('✅ Setting localTicket with updated data after scheduling');
          setLocalTicket(updatedTicketData);
          if (onUpdate) {
            console.log('✅ Calling onUpdate with updated data after scheduling');
            onUpdate(updatedTicketData);
          }
        } else {
          // Fallback: Update with basic info if fetch fails
          const fallbackTicket = {
            ...localTicket,
            status: 'Scheduled' as TicketStatus,
            scheduledDate: event.startDate,
            updatedAt: new Date()
          };
          setLocalTicket(fallbackTicket);
          if (onUpdate) {
            onUpdate(fallbackTicket);
          }
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch updated ticket data after scheduling:', fetchError);
        // Fallback: Update with basic info if fetch fails
        const fallbackTicket = {
          ...localTicket,
          status: 'Scheduled' as TicketStatus,
          scheduledDate: event.startDate,
          updatedAt: new Date()
        };
        setLocalTicket(fallbackTicket);
        if (onUpdate) {
          onUpdate(fallbackTicket);
        }
      }

      const message = supplierInfo 
        ? `Work scheduled with ${supplierInfo.supplier.name} for ${event.startDate.toLocaleDateString()}`
        : `Work scheduled for ${event.startDate.toLocaleDateString()}`;
      
      addNotification({
        userId: currentUser.id,
        title: 'Work Scheduled',
        message,
        type: 'success'
      });

      // Close the schedule modal
      setShowScheduleModal(false);
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

  // Handle rescheduling from enhanced ScheduleModal
  const handleRescheduleWork = async (event: any, supplierInfo?: any) => {
    if (!currentUser) return;

    setIsUpdatingStatus(true);
    try {
      // Update the local ticket object
      const updatedTicket = {
        ...localTicket,
        scheduledDate: event.startDate,
        updatedAt: new Date()
      };

      setLocalTicket(updatedTicket);

      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      const message = supplierInfo 
        ? `Work rescheduled with ${supplierInfo.supplier.name} for ${event.startDate.toLocaleDateString()}`
        : `Work rescheduled to ${event.startDate.toLocaleDateString()}`;
        
      addNotification({
        userId: currentUser.id,
        title: 'Work Rescheduled',
        message,
        type: 'success'
      });

      // Close the reschedule modal
      setShowRescheduleModal(false);
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

  // Handle ticket completion with final cost and notes
  const handleCompleteTicket = async (finalCost: number, notes?: string) => {
    if (!currentUser) {
      console.error('No current user found');
      return;
    }

    console.log('🚀 Starting ticket completion:', {
      ticketId: ticket.id,
      finalCost,
      notes,
      currentUser: currentUser.id
    });

    setIsCompletingTicket(true);
    try {
      console.log('📞 Calling ticketService.completeTicket...');
      // Use the new completeTicket service method that handles final cost and expense forecast creation
      await ticketService.completeTicket(ticket.id, currentUser.id, finalCost, notes);
      console.log('✅ ticketService.completeTicket completed successfully');
      
      console.log('📅 Completing calendar event...');
      // Handle calendar event completion
      await ticketEventService.completeEventForTicket(ticket.id);
      console.log('✅ Calendar event completion handled');
      
      // Update the local ticket object to reflect completion
      const updatedTicket = {
        ...localTicket,
        status: 'Complete' as TicketStatus,
        completedDate: new Date(),
        finalCost,
        completionNotes: notes,
        updatedAt: new Date()
      };

      console.log('🔄 Updating local state and parent component');
      // Update local state to immediately reflect changes in the modal
      setLocalTicket(updatedTicket);

      // Call the onUpdate callback to update the parent component
      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      console.log('🎉 Showing success notification');
      addNotification({
        userId: currentUser.id,
        title: 'Ticket Completed',
        message: `Ticket marked as complete with final cost £${finalCost.toLocaleString()}`,
        type: 'success'
      });

      console.log('✅ Closing completion modal');
      // Close the completion modal
      setShowCompletionModal(false);
      console.log('🎯 Ticket completion workflow finished successfully');
    } catch (error) {
      console.error('❌ Failed to complete ticket:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        ticketId: ticket.id,
        finalCost,
        userId: currentUser.id
      });
      
      addNotification({
        userId: currentUser.id,
        title: 'Error',
        message: `Failed to complete ticket: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsCompletingTicket(false);
      console.log('🏁 handleCompleteTicket finally block executed');
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
                className={`inline-flex items-center px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${getButtonColor('Cancelled', true, false)}`}
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
                  {(() => {
                    const winningQuote = localTicket.quoteRequests?.find(req => req.status === 'Accepted')
                    
                    if (winningQuote) {
                      // Winner selected - ready for scheduling
                      return (
                        <>
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div>
                              <p className="text-sm font-medium text-green-800">Quote Selected</p>
                            </div>
                            <Award className="h-5 w-5 text-green-600" />
                          </div>
                        </>
                      )
                    } else {
                      // Regular quoting flow
                      return (
                        <>
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
                        </>
                      )
                    }
                  })()}
                  
                  {/* Quote Requests Summary - Always show for Quoting status */}
                  {localTicket.quoteRequests && localTicket.quoteRequests.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-neutral-700">Quote Requests ({localTicket.quoteRequests.length}):</h5>
                      <div className="space-y-2 overflow-y-auto max-h-48">
                        {[...localTicket.quoteRequests].sort((a, b) => {
                          // Sort by status: Accepted first, then others
                          if (a.status === 'Accepted') return -1;
                          if (b.status === 'Accepted') return 1;
                          return 0;
                        }).map((request, index) => {
                          const isWinner = request.status === 'Accepted'
                          const statusColor = request.status === 'Pending' ? 'text-yellow-600' : 
                                            request.status === 'Received' ? 'text-green-600' : 
                                            request.status === 'Rejected' ? 'text-red-600' : 
                                            request.status === 'Accepted' ? 'text-success-700' : 'text-gray-600'
                          const statusText = request.status === 'Pending' ? 'Pending' :
                                           request.status === 'Received' ? 'Received' :
                                           request.status === 'Rejected' ? 'Rejected' :
                                           request.status === 'Accepted' ? 'Accepted' : request.status
                          
                          return (
                            <div 
                              key={request.id || index} 
                              className={`flex items-center justify-between p-3 rounded-lg border flex-shrink-0 ${
                                isWinner 
                                  ? 'bg-success-25 border-success-300 ring-2 ring-success-200' 
                                  : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <div className="flex items-center flex-1">
                                {isWinner && <Award className="h-4 w-4 mr-2 text-success-600 flex-shrink-0" />}
                                <p className={`text-sm font-medium ${
                                  isWinner ? 'text-success-900' : 'text-neutral-900'
                                } flex-1`}>
                                  {request.supplierName || `Supplier ${index + 1}`}
                                </p>
                              </div>
                              <div className="text-right ml-3 flex-shrink-0">
                                <p className={`text-xs ${statusColor} font-medium`}>
                                  {statusText}
                                </p>
                                {request.quoteAmount && request.quoteAmount > 0 && (
                                  <p className="text-sm font-semibold text-neutral-800">
                                    £{request.quoteAmount.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sticky Action Buttons at bottom of tile */}
                <div className="absolute bottom-6 right-6 flex gap-2">
                  {(() => {
                    const winningQuote = localTicket.quoteRequests?.find(req => req.status === 'Accepted')
                    
                    if (winningQuote) {
                      // Show Edit and Schedule buttons when winner is selected
                      return (
                        <>
                          <button
                            onClick={() => {
                              console.log('🖱️ Edit button clicked - setting showQuoteManagement to true')
                              console.log('🔍 Current showQuoteManagement:', showQuoteManagement)
                              console.log('🎯 Current localTicket.quoteRequests:', localTicket.quoteRequests?.length || 0, 'items')
                              setShowQuoteManagement(true)
                              console.log('✅ setShowQuoteManagement(true) called')
                            }}
                            className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleStatusUpdate('Scheduled')}
                            disabled={isUpdatingStatus}
                            className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 transition-colors duration-200"
                          >
                            {isUpdatingStatus ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Scheduling...
                              </>
                            ) : (
                              'Schedule'
                            )}
                          </button>
                        </>
                      )
                    } else {
                      // Show Manage button for regular quoting
                      return (
                        <button
                          onClick={() => {
                            console.log('🖱️ Manage button clicked - setting showQuoteManagement to true')
                            console.log('🔍 Current showQuoteManagement:', showQuoteManagement)
                            console.log('🎯 Current localTicket.quoteRequests:', localTicket.quoteRequests?.length || 0, 'items')
                            setShowQuoteManagement(true)
                            console.log('✅ setShowQuoteManagement(true) called')
                          }}
                          className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                        >
                          Manage
                        </button>
                      )
                    }
                  })()}
                </div>
              </>
            )}
            
            {/* Ready for Scheduling Ticket (Historic) */}
            {localTicket.status === 'Ready for Scheduling' && (
              <>
                {/* Content Area */}
                <div className="space-y-3 pb-16"> {/* Add bottom padding for button */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-800">Winner Selected (Historic)</p>
                      <p className="text-xs text-green-600">
                        Quote winner was selected and work is ready to be scheduled
                      </p>
                    </div>
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  
                  {/* Selected Winner Summary */}
                  {(() => {
                    const winningQuote = localTicket.quoteRequests?.find(req => req.status === 'Accepted')
                    if (winningQuote) {
                      return (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-neutral-700">Selected Supplier:</h5>
                          <div className="p-3 bg-success-25 rounded-lg border border-success-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-900 flex items-center">
                                  <Award className="h-4 w-4 mr-2 text-success-600" />
                                  {winningQuote.supplierName}
                                </p>
                                <p className="text-xs text-neutral-600">
                                  Quote: {winningQuote.quoteAmount ? `£${winningQuote.quoteAmount.toLocaleString()}` : 'Amount not specified'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                  
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600">
                      A winning supplier was selected. Ready to{' '}
                      <button
                        onClick={() => handleStatusUpdate('Scheduled')}
                        className="text-primary-600 hover:text-primary-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded transition-colors duration-200"
                      >
                        schedule
                      </button>
                      {' '}the work.
                    </p>
                  </div>
                </div>
                
                {/* Sticky Schedule Button at bottom of tile */}
                <div className="absolute bottom-6 right-6">
                  <button
                    onClick={() => handleStatusUpdate('Scheduled')}
                    disabled={isUpdatingStatus}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 transition-colors duration-200"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule'
                    )}
                  </button>
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
                        onClick={() => setShowRescheduleModal(true)}
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
                    onClick={() => setShowRescheduleModal(true)}
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
              <>
                {/* Content Area */}
                <div className="space-y-3 pb-16"> {/* Add bottom padding for buttons */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-800">Work Completed</p>
                      <p className="text-xs text-green-600">
                        {canReopenTicket() ? `Can be reopened for ${getDaysRemainingForReopen()} more days` : 'Auto-closes soon'}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  
                  {/* Expense Information */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-neutral-700">Expense Tracking:</h5>
                    {loadingExpense ? (
                      <div className="flex items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-neutral-600" />
                        <span className="text-sm text-neutral-600">Loading expense details...</span>
                      </div>
                    ) : linkedExpense ? (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1">
                            <DollarSign className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                Expense Record Created
                              </p>
                              <p className="text-xs text-blue-700">
                                Amount: £{linkedExpense.amount?.toLocaleString() || 'N/A'}
                              </p>
                              <p className="text-xs text-blue-600">
                                Status: {linkedExpense.status || 'Committed'}
                              </p>
                              {linkedExpense.description && (
                                <p className="text-xs text-blue-600 mt-1">
                                  {linkedExpense.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              linkedExpense.status === 'Committed' 
                                ? 'bg-orange-100 text-orange-800' 
                                : linkedExpense.status === 'Invoiced'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {linkedExpense.status || 'Committed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <DollarSign className="h-4 w-4 mr-2 text-neutral-500 flex-shrink-0" />
                        <span className="text-sm text-neutral-600">No expense record found for this ticket</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Completion Details */}
                  {(localTicket as any).finalCost && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-neutral-700">Completion Details:</h5>
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">Final Cost:</span> £{((localTicket as any).finalCost as number).toLocaleString()}
                        </p>
                        {(localTicket as any).completionNotes && (
                          <p className="text-sm text-neutral-700 mt-1">
                            <span className="font-medium">Notes:</span> {(localTicket as any).completionNotes}
                          </p>
                        )}
                        {getActualCompletedDate() && (
                          <p className="text-sm text-neutral-600 mt-1">
                            <span className="font-medium">Completed:</span> {formatDate(new Date(getActualCompletedDate()!))}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Re-open option for managers within 7 days */}
                  {canReopenTicket() && canUpdateStatus && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800">Re-open Available</p>
                          <p className="text-xs text-amber-700">
                            You can re-open this ticket for {getDaysRemainingForReopen()} more day{getDaysRemainingForReopen() !== 1 ? 's' : ''} if needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sticky Action Buttons at bottom of tile */}
                <div className="absolute bottom-6 right-6">
                  {canReopenTicket() && canUpdateStatus && (
                    <button
                      onClick={() => {
                        // Reopen means go back to a working status, not to 'Complete'
                        // For this workflow, we'll go back to 'Scheduled' since work was completed
                        handleStatusUpdate('Scheduled');
                      }}
                      disabled={isUpdatingStatus}
                      className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        'Re-Open'
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
            
            {/* Closed Ticket */}
            {localTicket.status === 'Closed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Closed Ticket</p>
                    <p className="text-xs text-gray-600">
                      {canReopenTicket() ? `Can be reopened for ${getDaysRemainingForReopen()} more days` : 'No further actions needed'}
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    This ticket has been completed and closed.
                  </p>
                  
                  {/* Re-open option for managers within 7 days */}
                  {canReopenTicket() && (
                    <>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-800">Re-open Available</p>
                            <p className="text-xs text-amber-700">
                              You can re-open this ticket for {getDaysRemainingForReopen()} more day{getDaysRemainingForReopen() !== 1 ? 's' : ''} in case it was closed in error.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleStatusUpdate('Complete')}
                        disabled={isUpdatingStatus}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        )}
                        Re-open Ticket
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Cancelled Ticket */}
            {localTicket.status === 'Cancelled' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Cancelled Ticket</p>
                    <p className="text-xs text-gray-600">
                      No further actions needed
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    This ticket has been cancelled and no further action is required.
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

      {/* Enhanced Schedule Modal for initial scheduling */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        ticket={localTicket}
        onScheduled={handleScheduleWork}
        allowDirectScheduling={true}
        preSelectedSupplier={(() => {
          const winningQuote = localTicket.quoteRequests?.find(req => req.status === 'Accepted')
          return winningQuote?.supplierName
        })()}
        preSelectedCost={(() => {
          const winningQuote = localTicket.quoteRequests?.find(req => req.status === 'Accepted')
          return winningQuote?.quoteAmount
        })()}
      />

      {/* Enhanced Schedule Modal for rescheduling */}
      <ScheduleModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        ticket={localTicket}
        onScheduled={handleRescheduleWork}
        allowDirectScheduling={false}
      />

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
        quoteRequests={(() => {
          console.log('🎯 Passing quoteRequests to modal:', localTicket.quoteRequests?.length || 0, 'items')
          console.log('📋 LocalTicket status:', localTicket.status)
          return localTicket.quoteRequests || []
        })()}
        onQuotesUpdated={handleQuoteManagement}
      />

      {/* Ticket Completion Modal */}
      <TicketCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        ticketTitle={localTicket.title}
        estimatedCost={(() => {
          // Try to get estimated cost from accepted quote
          const acceptedQuote = localTicket.quoteRequests?.find(req => req.status === 'Accepted');
          return acceptedQuote?.quoteAmount || undefined;
        })()}
        onComplete={handleCompleteTicket}
        isSubmitting={isCompletingTicket}
      />
    </Modal>
  );
};
