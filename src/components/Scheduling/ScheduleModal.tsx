import { useState } from 'react'
import { 
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
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Work"
      description="Plan work for this ticket"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ticket Info */}
        <div className="bg-neutral-50 p-4 rounded-lg">
          <h3 className="font-medium text-neutral-900 mb-2">{ticket.title}</h3>
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
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedDate || !startTime || !endTime}
            className="flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Schedule
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default ScheduleModal 