import { BuildingEvent, Ticket } from '../types';
import { eventService } from './eventService';
import { ticketService } from './ticketService';
import { handleFirebaseError } from '../utils/errorHandler';

export const ticketEventService = {
  // Create an event when a ticket is scheduled
  async createEventForScheduledTicket(
    ticket: Ticket, 
    scheduledDate: Date, 
    userId: string
  ): Promise<BuildingEvent | null> {
    try {
      // Calculate end date (2 hours after start by default)
      const endDate = new Date(scheduledDate);
      endDate.setHours(endDate.getHours() + 2);

      const eventData = {
        title: `Work: ${ticket.title}`,
        description: `Scheduled work for ticket: ${ticket.description}`,
        location: ticket.location,
        buildingId: ticket.buildingId,
        startDate: scheduledDate,
        endDate,
        ticketId: ticket.id,
        assignedTo: ticket.assignedTo ? [ticket.assignedTo, userId] : [userId],
        status: 'scheduled' as const
      };

      const event = await eventService.createEvent(eventData);
      return event;
    } catch (error: any) {
      // Log but don't throw - scheduling should still work even if event creation fails
      console.warn('Failed to create event for scheduled ticket:', error);
      return null;
    }
  },

  // Update an existing event when a ticket is rescheduled
  async updateEventForRescheduledTicket(
    ticketId: string, 
    newScheduledDate: Date
  ): Promise<void> {
    try {
      // Find existing events for this ticket
      const events = await eventService.getEventsByTicketId(ticketId);
      
      if (events.length > 0) {
        // Update the most recent event
        const eventToUpdate = events[0];
        
        // Calculate new end date (preserve duration)
        const originalDuration = eventToUpdate.endDate.getTime() - eventToUpdate.startDate.getTime();
        const newEndDate = new Date(newScheduledDate.getTime() + originalDuration);

        await eventService.updateEvent(eventToUpdate.id, {
          startDate: newScheduledDate,
          endDate: newEndDate
        });
      }
    } catch (error: any) {
      // Log but don't throw - rescheduling should still work even if event update fails
      console.warn('Failed to update event for rescheduled ticket:', error);
    }
  },

  // Mark event as completed when ticket is marked as complete
  async completeEventForTicket(ticketId: string): Promise<void> {
    try {
      const events = await eventService.getEventsByTicketId(ticketId);
      
      if (events.length > 0) {
        const eventToUpdate = events[0];
        
        await eventService.updateEvent(eventToUpdate.id, {
          status: 'completed'
        });
      }
    } catch (error: any) {
      // Log but don't throw - ticket completion should still work
      console.warn('Failed to complete event for ticket:', error);
    }
  },

  // Cancel event when ticket is cancelled
  async cancelEventForTicket(ticketId: string): Promise<void> {
    try {
      const events = await eventService.getEventsByTicketId(ticketId);
      
      if (events.length > 0) {
        const eventToUpdate = events[0];
        
        await eventService.updateEvent(eventToUpdate.id, {
          status: 'cancelled'
        });
      }
    } catch (error: any) {
      // Log but don't throw - ticket cancellation should still work
      console.warn('Failed to cancel event for ticket:', error);
    }
  }
};
