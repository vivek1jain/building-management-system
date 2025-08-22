import React, { useState, useEffect, useMemo } from 'react'
import { MapPin, Clock, Users, Calendar, CheckCircle, AlertTriangle, X, Ticket, ArrowUp, ArrowDown } from 'lucide-react'
import { BuildingEvent } from '../types'
import Button from './UI/Button'
import { getUserDisplayNames } from '../services/userLookupService'

type SortField = 'title' | 'status' | 'location' | 'startDate' | 'assigned' | 'priority'
type SortDirection = 'asc' | 'desc'

interface EventTableProps {
  events: BuildingEvent[]
  onEditEvent?: (event: BuildingEvent) => void
  onTicketEventClick?: (ticketId: string) => void
  onStatusUpdate?: (eventId: string, newStatus: string) => void
  getWorkflowActions?: (status: string) => Array<{
    label: string
    action: string
    color: string
  }>
  className?: string
}

const EventTable: React.FC<EventTableProps> = ({
  events,
  onEditEvent,
  onTicketEventClick,
  onStatusUpdate,
  getWorkflowActions,
  className = ''
}) => {
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Load user names when events change
  useEffect(() => {
    const loadUserNames = async () => {
      if (events.length === 0) return
      
      try {
        // Collect all user IDs from all events
        const userIds = new Set<string>()
        
        events.forEach(event => {
          if (event.assignedTo) {
            event.assignedTo.forEach(userId => {
              if (userId && typeof userId === 'string') {
                userIds.add(userId)
              }
            })
          }
        })
        
        // Convert to array and fetch names if we have any user IDs
        const userIdArray = Array.from(userIds)
        if (userIdArray.length > 0) {
          const names = await getUserDisplayNames(userIdArray)
          setUserNames(names)
        }
      } catch (error) {
        console.error('Failed to load user names for events:', error)
      }
    }
    
    loadUserNames()
  }, [events])

  // Helper function to get display name for a user ID
  const getDisplayName = (userId: string): string => {
    return userNames[userId] || `User ${userId.substring(0, 8)}...`
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'in-progress': return <AlertTriangle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const formatTimeRange = (startDate: Date, endDate: Date) => {
    const start = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24h format
    }).format(startDate)
    
    const end = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24h format
    }).format(endDate)
    
    return `${start} - ${end}`
  }

  const formatDuration = (startDate: Date, endDate: Date) => {
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes > 0 ? `${diffMinutes}m` : ''}`
    }
    return `${diffMinutes}m`
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  const isEventPast = (endDate: Date) => {
    return new Date() > endDate
  }

  const isEventCurrent = (startDate: Date, endDate: Date) => {
    const now = new Date()
    return now >= startDate && now <= endDate
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Convert Firebase Timestamp to Date
  const convertToDate = (timestamp: any): Date => {
    if (timestamp instanceof Date) {
      return timestamp
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp)
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      // Firebase Timestamp object
      return timestamp.toDate()
    } else if (timestamp && timestamp.seconds) {
      // Firebase Timestamp-like object
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000)
    } else {
      console.warn('Invalid timestamp type:', timestamp, typeof timestamp)
      return new Date() // fallback to current date
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedEvents = useMemo(() => {
    if (!sortField) return events

    const sorted = [...events].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = (a.title || '').toLowerCase()
          bValue = (b.title || '').toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'location':
          aValue = (a.location || '').toLowerCase()
          bValue = (b.location || '').toLowerCase()
          break
        case 'startDate':
          aValue = convertToDate(a.startDate).getTime()
          bValue = convertToDate(b.startDate).getTime()
          break
        case 'assigned':
          // Sort by first assigned person's name or 'Unassigned'
          aValue = a.assignedTo && a.assignedTo.length > 0 ? getDisplayName(a.assignedTo[0]).toLowerCase() : 'unassigned'
          bValue = b.assignedTo && b.assignedTo.length > 0 ? getDisplayName(b.assignedTo[0]).toLowerCase() : 'unassigned'
          break
        case 'priority':
          // Sort by priority if available (for ticket-driven events)
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
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
  }, [events, sortField, sortDirection, userNames])

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

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
          <Calendar className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2 font-inter">No events found</h3>
        <p className="text-gray-600 font-inter">
          No events match your current search criteria
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Mobile responsive wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200" role="table" aria-label="Events list">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <SortableHeader field="title">
                Event Details
              </SortableHeader>
              <SortableHeader field="status">
                Status
              </SortableHeader>
              <SortableHeader field="location">
                Location
              </SortableHeader>
              <SortableHeader field="startDate">
                Schedule
              </SortableHeader>
              <SortableHeader field="assigned">
                Assigned
              </SortableHeader>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                scope="col"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedEvents.map((event) => {
              // Convert dates from Firebase Timestamps to Date objects
              const startDate = convertToDate(event.startDate)
              const endDate = convertToDate(event.endDate)
              
              // Check if event is ticket-driven (has ticketId)
              const isTicketDriven = event.ticketId ? true : false
              const isPast = isEventPast(endDate)
              const isCurrent = isEventCurrent(startDate, endDate)
              
              const handleRowClick = () => {
                if (isTicketDriven && event.ticketId) {
                  onTicketEventClick?.(event.ticketId)
                } else {
                  onEditEvent?.(event)
                }
              }
              
              const handleKeyDown = (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRowClick()
                }
              }
              
              return (
                <tr
                  key={event.id}
                  onClick={handleRowClick}
                  onKeyDown={handleKeyDown}
                  tabIndex={0}
                  role="button"
                  aria-label={isTicketDriven ? `View ticket: ${event.title}` : `Edit event: ${event.title}`}
                  className={`transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset hover:bg-neutral-50 cursor-pointer ${
                    isPast ? 'opacity-60' : ''
                  } ${
                    isCurrent ? 'bg-blue-25 border-l-2 border-l-blue-400' : ''
                  } ${
                    isTicketDriven ? 'bg-blue-50/30' : ''
                  }`}
                >
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isTicketDriven && (
                          <Ticket className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-neutral-900 font-inter line-clamp-1">
                          {/* Remove "Work:" prefix from ticket-driven events */}
                          {isTicketDriven && event.title.startsWith('Work: ') 
                            ? event.title.substring(6)
                            : event.title
                          }
                        </p>
                        {isTicketDriven && event.priority && (
                          <div 
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(event.priority)}`}
                            title={`${event.priority} priority`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-inter line-clamp-1">
                        {truncateText(event.description, 80)}
                      </p>
                      {isTicketDriven && event.ticketId && (
                        <p className="text-xs text-blue-600 font-inter mt-1">
                          Ticket #{event.ticketId.slice(-6)}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    <span className="ml-1 capitalize">{event.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[120px]" title={event.location}>
                      {event.location}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-500 font-inter">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        {formatDate(startDate)}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-xs">
                        {formatTimeRange(startDate, endDate)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <Users className="h-4 w-4 mr-1" />
                    {event.assignedTo.length > 0 ? (
                      <span className="truncate max-w-[120px]" title={
                        event.assignedTo.length > 1 
                          ? event.assignedTo.map(userId => getDisplayName(userId)).join(', ')
                          : getDisplayName(event.assignedTo[0])
                      }>
                        {/* Show first assigned person's name using getUserDisplayNames */}
                        {getDisplayName(event.assignedTo[0])}
                        {event.assignedTo.length > 1 && (
                          <span className="text-neutral-400"> +{event.assignedTo.length - 1}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-neutral-400">Unassigned</span>
                    )}
                  </div>
                </td>
                {!isTicketDriven && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* Workflow action buttons for regular events only - ensure consistent width */}
                      {getWorkflowActions && onStatusUpdate && 
                        getWorkflowActions(event.status).map((action) => (
                          <Button
                            key={action.action}
                            variant={action.color === 'btn-primary' ? 'primary' : 'outline'}
                            size="sm"
                            className="px-3 py-1 min-w-[80px] text-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              onStatusUpdate(event.id, action.action)
                            }}
                          >
                            {action.label}
                          </Button>
                        ))
                      }
                    </div>
                  </td>
                )}
                {isTicketDriven && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center min-w-[80px]">
                      <span className="text-xs text-blue-600 font-inter cursor-pointer hover:text-blue-800 px-3 py-1">
                        View Ticket →
                      </span>
                    </div>
                  </td>
                )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EventTable
