import React, { useState } from 'react';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { TicketComment, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TicketCommentsProps {
  ticketId: string;
  comments: TicketComment[];
  onAddComment: (content: string) => void;
  canComment: boolean;
}

export const TicketComments: React.FC<TicketCommentsProps> = ({
  ticketId,
  comments,
  onAddComment,
  canComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !currentUser) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
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

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'resident':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'manager':
        return 'Manager';
      case 'resident':
        return 'Resident';
      default:
        return 'User';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((comment) => (
              <div key={comment.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {comment.authorName}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(comment.authorRole)}`}>
                          {getRoleLabel(comment.authorRole)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-11">
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add Comment Form */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {currentUser?.role === 'manager' ? 'Commenting as Building Manager' : 'Commenting as Resident'}
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-gray-50 rounded-md p-4 text-center">
            <p className="text-gray-600">
              You don't have permission to comment on this ticket.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
