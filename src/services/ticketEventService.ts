import { eventService } from './eventService';
import { ticketService } from './ticketService';
import { BuildingEvent, Ticket } from '../types';

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
        endDate: endDate,
        ticketId: ticket.id,
        assignedTo: ticket.assignedTo ? [ticket.assignedTo, userId] : [userId],
        status: 'scheduled' as const
      };

      const event = await eventService.createEvent(eventData);
      console.log('Created event for scheduled ticket:', event.id);
      return event;
    } catch (error) {
      console.error('Failed to create event for scheduled ticket:', error);
      // Don't throw error - scheduling should still work even if event creation fails
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

        console.log('Updated event for rescheduled ticket:', eventToUpdate.id);
      }
    } catch (error) {
      console.error('Failed to update event for rescheduled ticket:', error);
      // Don't throw error - rescheduling should still work even if event update fails
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

        console.log('Marked event as completed for ticket:', ticketId);
      }
    } catch (error) {
      console.error('Failed to complete event for ticket:', error);
      // Don't throw error - ticket completion should still work
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

        console.log('Cancelled event for ticket:', ticketId);
      }
    } catch (error) {
      console.error('Failed to cancel event for ticket:', error);
      // Don't throw error - ticket cancellation should still work
    }
  }
};
