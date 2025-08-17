import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBuilding } from '../contexts/BuildingContext'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  Filter,
  Search,
  Building,
  ChevronDown
} from 'lucide-react'
import { BuildingEvent } from '../types'
import { mockEvents } from '../services/mockData'

const Events = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { buildings, selectedBuildingId, selectedBuilding, setSelectedBuildingId, loading: buildingsLoading } = useBuilding()
  
  // Events state management
  const [allEvents] = useState<BuildingEvent[]>(mockEvents)
  const [events, setEvents] = useState<BuildingEvent[]>([])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<BuildingEvent | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    assignedTo: [] as string[]
  })

  // Load events when building selection changes
  useEffect(() => {
    if (selectedBuildingId) {
      const buildingEvents = allEvents.filter(event => event.buildingId === selectedBuildingId)
      setEvents(buildingEvents)
      console.log(`Loaded ${buildingEvents.length} events for building:`, selectedBuildingId)
    } else {
      setEvents([])
    }
  }, [selectedBuildingId, allEvents])

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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newEventData: BuildingEvent = {
      id: Date.now().toString(),
      ...newEvent,
      buildingId: selectedBuildingId || '',
      ticketId: undefined,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setEvents(prev => [newEventData, ...prev])
    setShowCreateForm(false)
    setNewEvent({
      title: '',
      description: '',
      location: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 60 * 1000),
      assignedTo: []
    })

    addNotification({
      title: 'Event Created',
      message: 'The event has been scheduled successfully.',
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  const handleStatusUpdate = (eventId: string, newStatus: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status: newStatus as BuildingEvent['status'], updatedAt: new Date() }
        : event
    ))

    addNotification({
      title: 'Event Updated',
      message: `Event status changed to ${newStatus}.`,
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  const handleEditEvent = (event: BuildingEvent) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      assignedTo: event.assignedTo
    })
    setShowEditForm(true)
  }

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingEvent) return

    const updatedEvent: BuildingEvent = {
      ...editingEvent,
      ...newEvent,
      updatedAt: new Date()
    }

    setEvents(prev => prev.map(event => 
      event.id === editingEvent.id ? updatedEvent : event
    ))
    
    setShowEditForm(false)
    setEditingEvent(null)
    setNewEvent({
      title: '',
      description: '',
      location: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 60 * 1000),
      assignedTo: []
    })

    addNotification({
      title: 'Event Updated',
      message: 'The event has been updated successfully.',
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(prev => prev.filter(event => event.id !== eventId))
      
      addNotification({
        title: 'Event Deleted',
        message: 'The event has been deleted successfully.',
        type: 'success',
        userId: currentUser?.id || ''
      })
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
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg pl-10 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[180px]"
              disabled={buildingsLoading}
              title={`Current building: ${selectedBuilding?.name || 'Select building'}`}
            >
              <option value="">{buildingsLoading ? 'Loading buildings...' : 'Select Building'}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            
            {/* Custom dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </div>
            
            {/* Building icon */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Building className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="select"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('all')
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Schedule New Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="input"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                rows={3}
                placeholder="Enter event description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className="input"
                placeholder="Enter event location"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.startDate.toISOString().slice(0, 16)}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.endDate.toISOString().slice(0, 16)}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Schedule Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Event Form */}
      {showEditForm && editingEvent && (
        <div className="card mb-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Edit Event</h3>
          <form onSubmit={handleUpdateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="input"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                rows={3}
                placeholder="Enter event description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className="input"
                placeholder="Enter event location"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.startDate.toISOString().slice(0, 16)}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.endDate.toISOString().slice(0, 16)}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingEvent(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div key={event.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-neutral-900">{event.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    <span className="ml-1 capitalize">{event.status}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{event.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <span className="text-gray-600">{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <span className="text-gray-600">{formatTimeRange(event.startDate, event.endDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-neutral-400" />
                    <span className="text-gray-600">{event.assignedTo.length} assigned</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {/* Edit and Delete buttons */}
                <button
                  onClick={() => handleEditEvent(event)}
                  className="btn-secondary text-sm"
                  title="Edit Event"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="btn-secondary text-sm text-red-600 hover:text-red-700"
                  title="Delete Event"
                >
                  Delete
                </button>
                
                {/* Workflow action buttons */}
                {getWorkflowActions(event.status).map((action) => (
                  <button
                    key={action.action}
                    onClick={() => handleStatusUpdate(event.id, action.action)}
                    className={`${action.color} text-sm`}
                  >
                    {action.label}
                  </button>
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