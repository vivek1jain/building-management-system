import React, { useState, useMemo } from 'react'
import { MapPin, Clock, User, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react'
import { Ticket, TicketStatus, UrgencyLevel } from '../types'

type SortField = 'title' | 'status' | 'urgency' | 'location' | 'createdAt' | 'comments'
type SortDirection = 'asc' | 'desc'

interface TicketTableProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  showApprovalBadge?: boolean
  currentUserId?: string
  userRole?: string
  className?: string
}

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  onTicketClick,
  showApprovalBadge = false,
  currentUserId,
  userRole,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
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
    return text.substring(0, maxLength) + '...'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTickets = useMemo(() => {
    if (!sortField) return tickets

    const sorted = [...tickets].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'urgency':
          // Sort urgency by priority: Critical > High > Medium > Low
          const urgencyOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
          aValue = urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0
          bValue = urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0
          break
        case 'location':
          aValue = a.location.toLowerCase()
          bValue = b.location.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'comments':
          aValue = (a.comments || []).length
          bValue = (b.comments || []).length
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [tickets, sortField, sortDirection])

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => {
    const isActive = sortField === field
    const isAsc = isActive && sortDirection === 'asc'
    const isDesc = isActive && sortDirection === 'desc'

    return (
      <th 
        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-200 transition-colors duration-200 select-none"
        scope="col"
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSort(field)
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Sort by ${field} ${isActive ? (isAsc ? 'descending' : 'ascending') : 'ascending'}`}
      >
        <div className="flex items-center justify-between">
          <span>{children}</span>
          <div className="flex flex-col ml-2">
            <ArrowUp 
              className={`h-3 w-3 ${isAsc ? 'text-primary-600' : 'text-neutral-300'}`} 
            />
            <ArrowDown 
              className={`h-3 w-3 -mt-1 ${isDesc ? 'text-primary-600' : 'text-neutral-300'}`} 
            />
          </div>
        </div>
      </th>
    )
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
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Mobile responsive wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200" role="table" aria-label="Tickets list">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <SortableHeader field="title">
                Title & Description
              </SortableHeader>
              <SortableHeader field="status">
                Status
              </SortableHeader>
              <SortableHeader field="urgency">
                Priority
              </SortableHeader>
              <SortableHeader field="location">
                Location
              </SortableHeader>
              <SortableHeader field="createdAt">
                Created
              </SortableHeader>
              <SortableHeader field="comments">
                Comments
              </SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedTickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onTicketClick(ticket)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onTicketClick(ticket)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View ticket: ${ticket.title}`}
                className="hover:bg-neutral-50 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
              >
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="flex items-start space-x-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 font-inter mb-1 line-clamp-1">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-gray-600 font-inter line-clamp-1">
                          {truncateText(ticket.description, 80)}
                        </p>
                      </div>
                      {/* Show approval badge if needed */}
                      {showApprovalBadge && 
                       userRole === 'manager' && 
                       ticket.requestedBy !== currentUserId && 
                       ticket.status === 'New' && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 font-inter shrink-0">
                          Needs Approval
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(ticket.urgency)}`}>
                    {ticket.urgency}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[120px]" title={ticket.location}>
                      {ticket.location}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTimeAgo(ticket.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {(ticket.comments || []).length}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TicketTable
