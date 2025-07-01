import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
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
  Search
} from 'lucide-react'
import { BuildingEvent } from '../types'

// Mock events data - in real app, this would come from Firebase
const mockEvents: BuildingEvent[] = [
  {
    id: 'event1',
    title: 'HVAC Maintenance',
    description: 'Regular HVAC system maintenance and filter replacement',
    location: 'Building A - Floor 3',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
    ticketId: 'ticket1',
    assignedTo: ['supplier1'],
    status: 'scheduled',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'event2',
    title: 'Electrical Inspection',
    description: 'Annual electrical safety inspection',
    location: 'Building B - Basement',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 3 days + 4 hours
    ticketId: 'ticket2',
    assignedTo: ['supplier2'],
    status: 'scheduled',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  },
  {
    id: 'event3',
    title: 'Plumbing Repair',
    description: 'Fix leaking pipe in restroom',
    location: 'Building A - Floor 1',
    startDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    ticketId: 'ticket3',
    assignedTo: ['supplier1'],
    status: 'in-progress',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
]

const Events = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [events, setEvents] = useState<BuildingEvent[]>(mockEvents)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    assignedTo: [] as string[]
  })

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
      default: return 'bg-gray-100 text-gray-800'
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
        ? { ...event, status: newStatus as any, updatedAt: new Date() }
        : event
    ))

    addNotification({
      title: 'Status Updated',
      message: `Event status updated to ${newStatus}.`,
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">
            Manage scheduled work and building events
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Event</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="input"
                  placeholder="Enter location"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                className="textarea"
                rows={3}
                placeholder="Describe the event..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div key={event.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    <span className="ml-1 capitalize">{event.status}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{event.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formatTimeRange(event.startDate, event.endDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{event.assignedTo.length} assigned</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {event.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(event.id, 'in-progress')}
                      className="btn-secondary text-sm"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(event.id, 'cancelled')}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {event.status === 'in-progress' && (
                  <button
                    onClick={() => handleStatusUpdate(event.id, 'completed')}
                    className="btn-primary text-sm"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search or schedule a new event</p>
        </div>
      )}
    </div>
  )
}

export default Events 