import { TicketComment } from '../types';
import { ticketService } from './ticketService';
import { db } from '../firebase/config';
import { doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';

const TICKETS_COLLECTION = 'tickets';

export class TicketCommentService {
  // Add a comment to a ticket (Firebase only)
  static async addComment(
    ticketId: string,
    content: string,
    authorId: string,
    authorName: string,
    authorRole: 'resident' | 'manager'
  ): Promise<TicketComment> {
    try {
      // Generate a unique comment ID
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substr(2, 9);
      
      const newComment: TicketComment = {
        id: `comment-${timestamp}-${randomPart}`,
        ticketId,
        authorId,
        authorName,
        authorRole,
        content,
        createdAt: new Date()
      };

      console.log('💾 Adding comment to Firebase:', { ticketId, commentId: newComment.id });

      // Add comment to Firebase ticket
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
      await updateDoc(ticketRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Comment added successfully to Firebase');
      return newComment;
    } catch (error) {
      console.error('❌ Failed to add comment to Firebase:', error);
      throw new Error('Failed to add comment');
    }
  }

  // Get comments for a specific ticket (Firebase only)
  static async getComments(ticketId: string): Promise<TicketComment[]> {
    try {
      console.log('📖 Loading comments from Firebase for ticket:', ticketId);
      
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (ticketDoc.exists()) {
        const ticketData = ticketDoc.data();
        const comments = ticketData.comments || [];
        
        console.log(`📖 Loaded ${comments.length} comments from Firebase`);
        
        // Convert Firebase timestamps to Date objects
        return comments.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt)
        }));
      } else {
        console.log('⚠️ Ticket not found in Firebase:', ticketId);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to load comments from Firebase:', error);
      return [];
    }
  }

  // Check if a user can comment on a ticket (Firebase only)
  static async canUserComment(
    ticketId: string,
    userId: string,
    userRole: 'resident' | 'manager',
    userBuildingIds: string[] = []
  ): Promise<boolean> {
    try {
      // Get ticket from Firebase
      const ticket = await ticketService.getTicketById(ticketId);
      if (!ticket) {
        console.log('❌ Ticket not found in Firebase:', ticketId);
        return false;
      }

      console.log('🎯 Permission check details:', {
        ticketId,
        ticketBuildingId: ticket.buildingId,
        ticketRequestedBy: ticket.requestedBy,
        userId,
        userRole,
        userBuildingIds
      });

      // Managers can comment on tickets for buildings they manage
      if (userRole === 'manager') {
        // Check for wildcard access (development mode)
        if (userBuildingIds.includes('*')) {
          console.log(`👔 Manager permission: GRANTED - Universal access (development mode)`);
          return true;
        }
        
        // Check specific building access
        const hasAccess = userBuildingIds.includes(ticket.buildingId);
        console.log(`👔 Manager permission: ${hasAccess ? 'GRANTED' : 'DENIED'} - Building access check`);
        return hasAccess;
      }

      // Residents can comment on their own tickets
      if (userRole === 'resident' || userRole === 'requester') {
        const isOwnTicket = ticket.requestedBy === userId;
        console.log(`🏠 Resident permission: ${isOwnTicket ? 'GRANTED' : 'DENIED'} - Own ticket check`);
        return isOwnTicket;
      }

      console.log('❌ No permission granted - unknown role or condition');
      return false;
    } catch (error) {
      console.error('❌ Error checking comment permissions:', error);
      return false;
    }
  }

  // Update a comment (Firebase - for future implementation)
  static async updateComment(
    commentId: string,
    content: string,
    userId: string
  ): Promise<TicketComment | null> {
    // TODO: Implement Firebase comment updating
    console.log('⚠️ Comment updating not yet implemented for Firebase');
    return null;
  }

  // Delete a comment (Firebase - for future implementation)
  static async deleteComment(
    commentId: string,
    userId: string,
    userRole: 'resident' | 'manager'
  ): Promise<boolean> {
    // TODO: Implement Firebase comment deletion
    console.log('⚠️ Comment deletion not yet implemented for Firebase');
    return false;
  }
}
