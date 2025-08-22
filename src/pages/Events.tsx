import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBuilding } from '../contexts/BuildingContext'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertTriangle,
  X,
  Filter,
  Search,
  Building,
  ChevronDown,
  Edit,
  Trash2
} from 'lucide-react'
import { BuildingEvent } from '../types'
import { eventService } from '../services/eventService'
import Modal, { ModalFooter } from '../components/UI/Modal'
import Button from '../components/UI/Button'
import EventTable from '../components/EventTable'

const Events = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { buildings, selectedBuildingId, selectedBuilding, setSelectedBuildingId, loading: buildingsLoading } = useBuilding()
  
  // Events state management
  const [allEvents, setAllEvents] = useState<BuildingEvent[]>([])
  const [events, setEvents] = useState<BuildingEvent[]>([])
  const [loading, setLoading] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<BuildingEvent | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    assignedTo: [] as string[]
  })
  
  // Separate date and time state for better UX
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  // Form error state
  const [formError, setFormError] = useState('')

  // Load all events from Firebase on component mount
  useEffect(() => {
    loadEvents()
  }, [])

  // Filter events when building selection changes
  useEffect(() => {
    if (selectedBuildingId) {
      const buildingEvents = allEvents.filter(event => event.buildingId === selectedBuildingId)
      setEvents(buildingEvents)
      console.log(`Loaded ${buildingEvents.length} events for building:`, selectedBuildingId)
    } else {
      setEvents([])
    }
  }, [selectedBuildingId, allEvents])

  const loadEvents = async () => {
    try {
      setLoading(true)
      console.log('📅 Loading events from Firebase...')
      const eventsData = await eventService.getEvents()
      console.log('📅 Events loaded:', eventsData.length)
      setAllEvents(eventsData)
    } catch (error) {
      console.error('❌ Error loading events:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load events. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    // Sort chronologically - earliest first
    // Dates should already be converted by eventService, but add safety conversion
    const aDate = a.startDate instanceof Date ? a.startDate : new Date(a.startDate)
    const bDate = b.startDate instanceof Date ? b.startDate : new Date(b.startDate)
    return aDate.getTime() - bDate.getTime()
  })

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

  const formatTimeRange = (startDate: Date, endDate: Date) => {
    const start = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(startDate)
    
    const end = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(endDate)
    
    return `${start} - ${end}`
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('') // Clear any previous errors
    
    if (!selectedBuildingId) {
      const errorMsg = 'Please select a building before creating an event.'
      setFormError(errorMsg)
      addNotification({
        title: 'Error',
        message: errorMsg,
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    // Validate date and time inputs
    if (!eventDate || !startTime || !endTime) {
      const errorMsg = 'Please fill in all date and time fields.'
      setFormError(errorMsg)
      addNotification({
        title: 'Error', 
        message: errorMsg,
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    try {
      setLoading(true)
      console.log('📅 Creating event for building:', selectedBuildingId)
      console.log('📅 Form data:', {
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        eventDate,
        startTime,
        endTime
      })
      
      // Construct proper Date objects from separate date and time inputs
      const startDateTime = new Date(`${eventDate}T${startTime}`)
      const endDateTime = new Date(`${eventDate}T${endTime}`)
      
      console.log('📅 Constructed dates:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        isStartValid: !isNaN(startDateTime.getTime()),
        isEndValid: !isNaN(endDateTime.getTime())
      })
      
      // Log current user info
      console.log('📅 Current user:', {
        id: currentUser?.id,
        exists: !!currentUser
      })
      
      // Validate Date objects
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        const errorMsg = 'Invalid date or time format. Please check your inputs.'
        setFormError(errorMsg)
        addNotification({
          title: 'Invalid Date/Time',
          message: errorMsg,
          type: 'error',
          userId: currentUser?.id || ''
        })
        setLoading(false)
        return
      }
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        const errorMsg = 'End time must be after start time.'
        setFormError(errorMsg)
        addNotification({
          title: 'Invalid Time Range',
          message: errorMsg,
          type: 'error',
          userId: currentUser?.id || ''
        })
        setLoading(false)
        return
      }
      
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        buildingId: selectedBuildingId,
        startDate: startDateTime,
        endDate: endDateTime,
        assignedTo: newEvent.assignedTo || [],
        status: 'scheduled' as const
      }
      
      console.log('📅 Final event data before sending to Firebase:', JSON.stringify(eventData, null, 2))
      console.log('📅 Event data types:', {
        title: typeof eventData.title,
        description: typeof eventData.description,
        location: typeof eventData.location,
        buildingId: typeof eventData.buildingId,
        startDate: eventData.startDate?.constructor?.name,
        endDate: eventData.endDate?.constructor?.name,
        assignedTo: Array.isArray(eventData.assignedTo),
        status: typeof eventData.status
      })
      
      const createdEvent = await eventService.createEvent(eventData)
      console.log('📅 Event created successfully:', createdEvent)
      
      // Reload events to get the latest data
      await loadEvents()
      
      // Reset form and close modal
      setShowCreateForm(false)
      resetForm()
      setFormError('')

      addNotification({
        title: 'Event Created',
        message: 'The event has been scheduled successfully.',
        type: 'success',
        userId: currentUser?.id || ''
      })
    } catch (error) {
      console.error('❌ Full error object:', error)
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('❌ Error code:', (error as any)?.code)
      console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      let errorMessage = 'Failed to create event. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check Firebase security rules for events.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.'
        } else {
          errorMessage = `Event creation failed: ${error.message}`
        }
      }
      
      setFormError(errorMessage)
      addNotification({
        title: 'Error',
        message: errorMessage,
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (eventId: string, newStatus: string) => {
    try {
      setLoading(true)
      console.log('📅 Updating event status:', eventId, newStatus)
      
      await eventService.updateEvent(eventId, {
        status: newStatus as BuildingEvent['status']
      })
      
      // Reload events to get the latest data
      await loadEvents()
      
      addNotification({
        title: 'Event Updated',
        message: `Event status changed to ${newStatus}.`,
        type: 'success',
        userId: currentUser?.id || ''
      })
    } catch (error) {
      console.error('❌ Error updating event status:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update event status. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      location: '',
      assignedTo: []
    })
    
    // Set default date to today and default times
    const today = new Date()
    setEventDate(today.toISOString().split('T')[0])
    setStartTime('09:00')
    setEndTime('10:00')
    setFormError('')
  }

  const handleEditEvent = (event: BuildingEvent) => {
    try {
      // First close any existing modal
      setShowCreateForm(false)
      
      setEditingEvent(event)
      setNewEvent({
        title: event.title,
        description: event.description,
        location: event.location,
        assignedTo: event.assignedTo
      })
      
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
          throw new Error('Invalid timestamp type')
        }
      }
      
      const startDate = convertToDate(event.startDate)
      const endDate = convertToDate(event.endDate)
      
      const eventDateStr = startDate.toISOString().split('T')[0]
      const startTimeStr = startDate.toTimeString().slice(0, 5)
      const endTimeStr = endDate.toTimeString().slice(0, 5)
      
      setEventDate(eventDateStr)
      setStartTime(startTimeStr)
      setEndTime(endTimeStr)
      
      // Clear any form errors
      setFormError('')
      
      setShowEditForm(true)
    } catch (error) {
      console.error('Error in handleEditEvent:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to open edit form. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    }
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingEvent) return

    // Validate date and time inputs
    if (!eventDate || !startTime || !endTime) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all date and time fields.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    try {
      setLoading(true)
      console.log('📅 Updating event:', editingEvent.id)
      
      // Construct proper Date objects from separate date and time inputs
      const startDateTime = new Date(`${eventDate}T${startTime}`)
      const endDateTime = new Date(`${eventDate}T${endTime}`)
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        addNotification({
          title: 'Invalid Time Range',
          message: 'End time must be after start time.',
          type: 'error',
          userId: currentUser?.id || ''
        })
        setLoading(false)
        return
      }
      
      const updateData = {
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        startDate: startDateTime,
        endDate: endDateTime,
        assignedTo: newEvent.assignedTo
      }
      
      await eventService.updateEvent(editingEvent.id, updateData)
      console.log('📅 Event updated successfully')
      
      // Reload events to get the latest data
      await loadEvents()
      
      setShowEditForm(false)
      setEditingEvent(null)
      resetForm()

      addNotification({
        title: 'Event Updated',
        message: 'The event has been updated successfully.',
        type: 'success',
        userId: currentUser?.id || ''
      })
    } catch (error) {
      console.error('❌ Error updating event:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update event. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setLoading(true)
        console.log('📅 Deleting event:', eventId)
        
        await eventService.deleteEvent(eventId)
        console.log('📅 Event deleted successfully')
        
        // Reload events to get the latest data
        await loadEvents()
        
        addNotification({
          title: 'Event Deleted',
          message: 'The event has been deleted successfully.',
          type: 'success',
          userId: currentUser?.id || ''
        })
      } catch (error) {
        console.error('❌ Error deleting event:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete event. Please try again.',
          type: 'error',
          userId: currentUser?.id || ''
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const getWorkflowActions = (status: string) => {
    switch (status) {
      case 'scheduled':
        return [
          { label: 'Start Event', action: 'in-progress', color: 'btn-primary' },
          { label: 'Cancel', action: 'cancelled', color: 'btn-secondary' }
        ]
      case 'in-progress':
        return [
          { label: 'Complete', action: 'completed', color: 'btn-primary' },
          { label: 'Cancel', action: 'cancelled', color: 'btn-secondary' }
        ]
      case 'completed':
        return [
          { label: 'Reopen', action: 'scheduled', color: 'btn-secondary' }
        ]
      case 'cancelled':
        return [
          { label: 'Reschedule', action: 'scheduled', color: 'btn-primary' }
        ]
      default:
        return []
    }
  }

  const handleTicketEventClick = (ticketId: string) => {
    // Navigate to tickets page with ticket detail modal
    navigate(`/tickets?ticketId=${ticketId}`)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Events</h1>
            <p className="text-gray-600 mt-1">
              Chronological view of building events and scheduled work
            </p>
          </div>
        </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
          />
        </div>
        <div className="relative flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
        
        <Button
          onClick={() => {
            resetForm()
            setShowCreateForm(true)
          }}
        >
          New Event
        </Button>
      </div>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Schedule New Event"
        description="Create a new event for the selected building"
        size="lg"
        showCloseButton={true}
        closeOnBackdropClick={true}
        closeOnEscape={true}
        footer={
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-event-form"
              disabled={loading || !newEvent.title || !newEvent.description || !eventDate || !startTime || !endTime}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        }
      >
        <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Enter event description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter event location"
              required
            />
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Form Error Display */}
          {formError && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                {formError}
              </div>
            </div>
          )}

          {/* Timezone Info */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center text-xs text-blue-700">
              <AlertTriangle className="h-3 w-3 mr-2 flex-shrink-0" />
              All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false)
          setEditingEvent(null)
        }}
        title="Edit Event"
        description="Update the event details"
        size="lg"
        showCloseButton={true}
        closeOnBackdropClick={true}
        closeOnEscape={true}
        footer={
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditForm(false)
                setEditingEvent(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-event-form"
              disabled={loading || !newEvent.title || !newEvent.description || !eventDate || !startTime || !endTime}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Update Event'
              )}
            </Button>
          </div>
        }
      >
        <form id="edit-event-form" onSubmit={handleUpdateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Enter event description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter event location"
              required
            />
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Timezone Info */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center text-xs text-blue-700">
              <AlertTriangle className="h-3 w-3 mr-2 flex-shrink-0" />
              All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </div>
          </div>
        </form>
      </Modal>

      {/* Events Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-neutral-600">Loading events...</span>
          </div>
        </div>
      ) : (
        <EventTable
          events={filteredEvents}
          onEditEvent={handleEditEvent}
          onTicketEventClick={handleTicketEventClick}
          onStatusUpdate={handleStatusUpdate}
          getWorkflowActions={getWorkflowActions}
        />
      )}
      </div>
    </div>
  )
}

export default Events 