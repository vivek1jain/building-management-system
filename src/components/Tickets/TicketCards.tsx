import { MapPin, Clock, MessageSquare } from 'lucide-react'
import React from 'react'
import { Ticket, TicketStatus, UrgencyLevel } from '../../types'

interface TicketCardsProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  showApprovalBadge?: boolean
  currentUserId?: string
  userRole?: string
  className?: string
}

const TicketCards: React.FC<TicketCardsProps> = ({
  tickets,
  onTicketClick,
  showApprovalBadge = false,
  currentUserId,
  userRole,
  className = ''
}) => {
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quoting': return 'bg-yellow-100 text-yellow-800'
      case 'Quote Requested': return 'bg-yellow-100 text-yellow-800'
      case 'Quote Received': return 'bg-purple-100 text-purple-800'
      case 'PO Sent': return 'bg-indigo-100 text-indigo-800'
      case 'Contracted': return 'bg-orange-100 text-orange-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Complete': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-neutral-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriorityColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return `${text.substring(0, maxLength)  }...`
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
          <MessageSquare className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2 font-inter">No tickets found</h3>
        <p className="text-gray-600 font-inter">
          No tickets match your current search criteria
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => onTicketClick(ticket)}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300 active:scale-[0.98]"
        >
          {/* Header with Title, Urgency Badge, and Approval Badge */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-900 font-inter line-clamp-2 flex-1 pr-2">
              {ticket.title}
            </h3>
            <div className="flex items-start gap-2 shrink-0">
              {/* Urgency Badge - Top Right */}
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(ticket.urgency)}`}>
                {ticket.urgency}
              </span>
              {/* Approval Badge */}
              {showApprovalBadge && 
               userRole === 'manager' && 
               ticket.requestedBy !== currentUserId && 
               ticket.status === 'New' && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 font-inter">
                  Needs Approval
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 font-inter mb-4 line-clamp-2">
            {truncateText(ticket.description, 100)}
          </p>


          {/* Location, Time, and Comments */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[80px]" title={ticket.location}>
                  {ticket.location}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatTimeAgo(ticket.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              <span>{(ticket.comments || []).length}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TicketCards