import { doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { TicketComment } from '../types';
import { ticketService } from './ticketService';

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

      // Add comment to Firebase ticket
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
      await updateDoc(ticketRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp()
      });

      return newComment;
    } catch (error) {
      console.error('❌ Failed to add comment to Firebase:', error);
      throw new Error('Failed to add comment');
    }
  }

  // Get comments for a specific ticket (Firebase only)
  static async getComments(ticketId: string): Promise<TicketComment[]> {
    try {
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (ticketDoc.exists()) {
        const ticketData = ticketDoc.data();
        const comments = ticketData.comments || [];
        
        // Convert Firebase timestamps to Date objects
        return comments.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt)
        }));
      } else {
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
        return false;
      }

      // Managers can comment on tickets for buildings they manage
      if (userRole === 'manager') {
        // Check for wildcard access (development mode)
        if (userBuildingIds.includes('*')) {
          return true;
        }
        
        // Check specific building access
        return userBuildingIds.includes(ticket.buildingId);
      }

      // Residents can comment on their own tickets
      if (userRole === 'resident' || userRole === 'requester') {
        return ticket.requestedBy === userId;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking comment permissions:', error);
      return false;
    }
  }

  // Update a comment
  static async updateComment(
    ticketId: string,
    commentId: string,
    content: string,
    userId: string
  ): Promise<TicketComment | null> {
    try {
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }
      
      const ticketData = ticketDoc.data();
      const comments = ticketData.comments || [];
      
      // Find the comment and verify ownership
      const commentIndex = comments.findIndex((c: TicketComment) => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }
      
      if (comments[commentIndex].authorId !== userId) {
        throw new Error('Unauthorized: You can only edit your own comments');
      }
      
      // Update the comment
      comments[commentIndex] = {
        ...comments[commentIndex],
        content,
        updatedAt: new Date()
      };
      
      // Update the ticket document
      await updateDoc(ticketRef, {
        comments,
        updatedAt: serverTimestamp()
      });
      
      return comments[commentIndex];
    } catch (error) {
      console.error('❌ Failed to update comment:', error);
      throw error;
    }
  }

  // Delete a comment
  static async deleteComment(
    ticketId: string,
    commentId: string,
    userId: string,
    userRole: 'resident' | 'manager'
  ): Promise<boolean> {
    try {
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }
      
      const ticketData = ticketDoc.data();
      const comments = ticketData.comments || [];
      
      // Find the comment
      const commentIndex = comments.findIndex((c: TicketComment) => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }
      
      // Check permissions: managers can delete any comment, users can only delete their own
      const canDelete = userRole === 'manager' || comments[commentIndex].authorId === userId;
      if (!canDelete) {
        throw new Error('Unauthorized: You can only delete your own comments');
      }
      
      // Remove the comment
      comments.splice(commentIndex, 1);
      
      // Update the ticket document
      await updateDoc(ticketRef, {
        comments,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to delete comment:', error);
      throw error;
    }
  }
}
