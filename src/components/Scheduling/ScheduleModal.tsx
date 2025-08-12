import { useState } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { BuildingEvent, Ticket } from '../../types'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket
  onScheduled: (event: BuildingEvent) => void
}

const ScheduleModal = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onScheduled 
}: ScheduleModalProps) => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${selectedDate}T${startTime}`)
      const endDateTime = new Date(`${selectedDate}T${endTime}`)

      if (endDateTime <= startDateTime) {
        addNotification({
          title: 'Invalid Time Range',
          message: 'End time must be after start time.',
          type: 'error',
          userId: currentUser?.id || ''
        })
        return
      }

      const event: BuildingEvent = {
        id: `event-${Date.now()}`,
        title: `Work on ${ticket.title}`,
        description: `Scheduled work for ticket: ${ticket.description}`,
        location: ticket.location,
        buildingId: ticket.buildingId || 'building-1',
        startDate: startDateTime,
        endDate: endDateTime,
        ticketId: ticket.id,
        assignedTo: [currentUser?.id || ''],
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Here you would save to Firestore
      // await eventService.createEvent(event)
      
      addNotification({
        title: 'Event Scheduled',
        message: `Work scheduled for ${startDateTime.toLocaleDateString()} at ${startTime}`,
        type: 'success',
        userId: currentUser?.id || ''
      })

      onScheduled(event)
      onClose()
    } catch (error: any) {
      addNotification({
        title: 'Scheduling Failed',
        message: error.message || 'Failed to schedule the event.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Work</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ticket Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{ticket.title}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPin className="h-4 w-4 mr-1" />
              {ticket.location}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              Requested by: {ticket.requestedBy}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              className="input w-full"
              required
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="Any special instructions or notes..."
            />
          </div>

          {/* Timezone Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center text-sm text-blue-700">
              <AlertTriangle className="h-4 w-4 mr-2" />
              All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDate || !startTime || !endTime}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleModal 