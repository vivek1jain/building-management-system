import React, { useState, useEffect } from 'react'
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

const Events = () => {
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



  return (
    <div className="space-y-6">
      {/* Header with Building Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Events</h1>
          <p className="text-gray-600 mt-1">
            Manage scheduled work and building events
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateForm(true)
          }}
        >
          Schedule Event
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('all')
            }}
            className="flex items-center justify-center space-x-2 text-sm"
          >
            <Filter className="h-4 w-4" />
            <span>Clear Filters</span>
          </Button>
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Schedule New Event"
        description="Create a new event for the selected building"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Enter event description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter event location"
              required
            />
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Form Error Display */}
          {formError && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
              <div className="flex items-center text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {formError}
              </div>
            </div>
          )}

          {/* Timezone Info */}
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
            <div className="flex items-center text-xs text-blue-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !newEvent.title || !newEvent.description || !eventDate || !startTime || !endTime}
              className="px-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Submit'
              )}
            </Button>
          </ModalFooter>
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
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Enter event description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter event location"
              required
            />
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Timezone Info */}
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
            <div className="flex items-center text-xs text-blue-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditForm(false)
                setEditingEvent(null)
              }}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !newEvent.title || !newEvent.description || !eventDate || !startTime || !endTime}
              className="px-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Update Event'
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    <span className="ml-1 capitalize">{event.status}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3 text-sm">{event.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">{formatTimeRange(event.startDate, event.endDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">{event.assignedTo.length} assigned</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                {/* Edit button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleEditEvent(event)
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  title="Edit Event"
                >
                  Edit
                </button>
                
                {/* Workflow action buttons */}
                {getWorkflowActions(event.status).map((action) => (
                  <Button
                    key={action.action}
                    variant={action.color === 'btn-primary' ? 'default' : 'outline'}
                    size="sm"
                    className="px-3"
                    onClick={() => handleStatusUpdate(event.id, action.action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search or schedule a new event</p>
        </div>
      )}
    </div>
  )
}

export default Events 