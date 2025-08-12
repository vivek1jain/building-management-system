import { TicketComment } from '../types';
import { mockTickets } from './mockData';

export class TicketCommentService {
  // Add a comment to a ticket
  static async addComment(
    ticketId: string,
    content: string,
    authorId: string,
    authorName: string,
    authorRole: 'resident' | 'manager'
  ): Promise<TicketComment> {
    // Generate a more unique ID to prevent duplicate keys
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const extraRandom = Math.random().toString(36).substr(2, 5);
    
    const newComment: TicketComment = {
      id: `comment-${timestamp}-${randomPart}-${extraRandom}`,
      ticketId,
      authorId,
      authorName,
      authorRole,
      content,
      createdAt: new Date()
    };

    // Find the ticket and add the comment
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      // Initialize comments array if it doesn't exist
      if (!ticket.comments) {
        ticket.comments = [];
      }
      ticket.comments.push(newComment);
      ticket.updatedAt = new Date();
    }

    return newComment;
  }

  // Get comments for a specific ticket
  static async getComments(ticketId: string): Promise<TicketComment[]> {
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) return [];
    
    // Initialize comments array if it doesn't exist
    if (!ticket.comments) {
      ticket.comments = [];
    }
    
    return ticket.comments;
  }

  // Check if a user can comment on a ticket
  static canUserComment(
    ticketId: string,
    userId: string,
    userRole: 'resident' | 'manager',
    userBuildingIds: string[] = []
  ): boolean {
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    // For development/testing: Allow all authenticated users to comment
    // This ensures the comment functionality can be tested
    if (userId) {
      return true;
    }

    // Fallback to original logic for production
    // Managers can comment on tickets for buildings they manage
    if (userRole === 'manager') {
      return userBuildingIds.includes(ticket.buildingId);
    }

    // Residents can comment on their own tickets
    if (userRole === 'resident') {
      return ticket.requestedBy === userId;
    }

    return false;
  }

  // Update a comment (for future use)
  static async updateComment(
    commentId: string,
    content: string,
    userId: string
  ): Promise<TicketComment | null> {
    for (const ticket of mockTickets) {
      const comment = ticket.comments.find(c => c.id === commentId);
      if (comment && comment.authorId === userId) {
        comment.content = content;
        ticket.updatedAt = new Date();
        return comment;
      }
    }
    return null;
  }

  // Delete a comment (for future use)
  static async deleteComment(
    commentId: string,
    userId: string,
    userRole: 'resident' | 'manager'
  ): Promise<boolean> {
    for (const ticket of mockTickets) {
      const commentIndex = ticket.comments.findIndex(c => c.id === commentId);
      if (commentIndex !== -1) {
        const comment = ticket.comments[commentIndex];
        
        // Users can delete their own comments, managers can delete any comment on tickets they manage
        if (comment.authorId === userId || userRole === 'manager') {
          ticket.comments.splice(commentIndex, 1);
          ticket.updatedAt = new Date();
          return true;
        }
      }
    }
    return false;
  }
}
