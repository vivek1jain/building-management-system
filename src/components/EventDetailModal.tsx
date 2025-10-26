import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertTriangle,
  X,
  Edit,
  Trash2
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { getUserDisplayNames } from '../services/userLookupService'
import { BuildingEvent } from '../types'
import Button from './UI/Button'
import Modal from './UI/Modal'

interface EventDetailModalProps {
  event: BuildingEvent | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (event: BuildingEvent) => void
  onDelete?: (eventId: string) => void
  onStatusUpdate?: (eventId: string, newStatus: string) => void
  getWorkflowActions?: (status: string) => Array<{
    label: string
    action: string
    color: string
  }>
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusUpdate,
  getWorkflowActions
}) => {
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  // Load user names when event changes
  useEffect(() => {
    const loadUserNames = async () => {
      if (!event || !event.assignedTo || event.assignedTo.length === 0) return
      
      try {
        const names = await getUserDisplayNames(event.assignedTo)
        setUserNames(names)
      } catch (error) {
        console.error('Failed to load user names:', error)
      }
    }
    
    loadUserNames()
  }, [event])

  if (!event) return null

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

  const startDate = convertToDate(event.startDate)
  const endDate = convertToDate(event.endDate)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
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

  const isEventPast = (endDate: Date) => {
    return new Date() > endDate
  }

  const isEventCurrent = (startDate: Date, endDate: Date) => {
    const now = new Date()
    return now >= startDate && now <= endDate
  }

  const isPast = isEventPast(endDate)
  const isCurrent = isEventCurrent(startDate, endDate)
  const isEnded = event.status === 'completed' || event.status === 'cancelled'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details"
      size="lg"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {/* Workflow action buttons */}
            {getWorkflowActions && onStatusUpdate && 
              getWorkflowActions(event.status).map((action) => (
                <Button
                  key={action.action}
                  variant={action.color === 'btn-primary' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onStatusUpdate(event.id, action.action)}
                >
                  {action.label}
                </Button>
              ))
            }
          </div>
          <div className="flex items-center space-x-3">
            {/* Hide Edit and Delete buttons for ended events */}
            {!isEnded && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    onDelete(event.id)
                    onClose()
                  }
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            {!isEnded && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(event)
                  onClose()
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Event Header */}
        <div className="border-b border-neutral-200 pb-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-semibold text-neutral-900 font-inter">
              {event.title}
            </h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
              {getStatusIcon(event.status)}
              <span className="ml-1 capitalize">{event.status}</span>
            </span>
          </div>
          
          {event.description && (
            <p className="text-neutral-600 font-inter leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-900 font-inter uppercase tracking-wider">
              Schedule
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-neutral-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 font-inter">
                    {formatDate(startDate)}
                  </p>
                  <p className="text-xs text-neutral-500 font-inter">
                    {isPast ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-neutral-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 font-inter">
                    {formatTime(startDate)} - {formatTime(endDate)}
                  </p>
                  <p className="text-xs text-neutral-500 font-inter">
                    Duration: {formatDuration(startDate, endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-900 font-inter uppercase tracking-wider">
              Details
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-neutral-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 font-inter">
                    {event.location}
                  </p>
                  <p className="text-xs text-neutral-500 font-inter">
                    Location
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Users className="h-5 w-5 text-neutral-400 mr-3 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 font-inter">
                    {event.assignedTo && event.assignedTo.length > 0 ? (
                      <span>
                        {event.assignedTo.map((userId, index) => (
                          <span key={userId}>
                            {getDisplayName(userId)}
                            {index < event.assignedTo.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-neutral-500">Unassigned</span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 font-inter">
                    {event.assignedTo && event.assignedTo.length === 1 
                      ? 'Assigned to' 
                      : event.assignedTo && event.assignedTo.length > 1 
                        ? `Assigned to ${event.assignedTo.length} people`
                        : 'No assignment'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        {(isPast || isCurrent || isEnded) && (
          <div className={`rounded-lg p-4 ${
            isCurrent 
              ? 'bg-blue-50 border border-blue-200' 
              : event.status === 'cancelled'
                ? 'bg-red-50 border border-red-200'
                : event.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-neutral-50 border border-neutral-200'
          }`}>
            <div className="flex items-center">
              {isCurrent ? (
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />
              ) : event.status === 'cancelled' ? (
                <X className="h-5 w-5 text-red-600 mr-3" />
              ) : event.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              ) : (
                <CheckCircle className="h-5 w-5 text-neutral-600 mr-3" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  isCurrent 
                    ? 'text-blue-900' 
                    : event.status === 'cancelled'
                      ? 'text-red-900'
                      : event.status === 'completed'
                        ? 'text-green-900'
                        : 'text-neutral-900'
                } font-inter`}>
                  {isCurrent 
                    ? 'Event is currently in progress'
                    : event.status === 'cancelled'
                      ? `${event.title} was cancelled`
                      : event.status === 'completed'
                        ? `${event.title} was completed`
                        : 'Event has ended'
                  }
                </p>
                <p className={`text-xs ${
                  isCurrent 
                    ? 'text-blue-700' 
                    : event.status === 'cancelled'
                      ? 'text-red-700'
                      : event.status === 'completed'
                        ? 'text-green-700'
                        : 'text-neutral-600'
                } font-inter`}>
                  {isCurrent 
                    ? `Started at ${formatTime(startDate)}, ends at ${formatTime(endDate)}`
                    : event.status === 'cancelled'
                      ? `Scheduled for ${formatDate(startDate)} at ${formatTime(startDate)}`
                      : event.status === 'completed'
                        ? `Completed on ${formatDate(endDate)} at ${formatTime(endDate)}`
                        : `Ended on ${formatDate(endDate)} at ${formatTime(endDate)}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Event Metadata */}
        <div className="border-t border-neutral-200 pt-4">
          <div className="text-xs text-neutral-500 font-inter space-y-1">
            <p>Event ID: {event.id}</p>
            {event.buildingId && <p>Building ID: {event.buildingId}</p>}
            <p>Created: {new Date(event.createdAt || new Date()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
