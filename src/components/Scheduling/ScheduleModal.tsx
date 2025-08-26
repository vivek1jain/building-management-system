import React, { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle,
  AlertTriangle,
  Building,
  DollarSign
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { BuildingEvent, Ticket } from '../../types'
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'
import { Dropdown, DropdownOption } from '../UI'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  rating: number
}

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket
  onScheduled: (event: BuildingEvent, supplierInfo?: { supplier: Supplier; expectedCost: number }) => void
  allowDirectScheduling?: boolean // When true, shows supplier selection and pricing
  preSelectedSupplier?: string // Pre-populate supplier name
  preSelectedCost?: number // Pre-populate expected cost
}

const ScheduleModal = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onScheduled,
  allowDirectScheduling = false,
  preSelectedSupplier,
  preSelectedCost
}: ScheduleModalProps) => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  
  // Direct scheduling fields
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [expectedCost, setExpectedCost] = useState<number>(preSelectedCost || 0)
  
  // Load suppliers from API
  const loadSuppliers = async () => {
    try {
      const { supplierService } = await import('../../services/supplierService')
      const suppliersData = await supplierService.getSuppliers()
      setSuppliers(suppliersData || [])
      
      // Pre-select supplier if provided
      if (preSelectedSupplier && suppliersData) {
        const matchingSupplier = suppliersData.find(s => 
          s.companyName === preSelectedSupplier || s.name === preSelectedSupplier
        )
        if (matchingSupplier) {
          setSelectedSupplier(matchingSupplier.id)
        }
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error)
      setSuppliers([])
    }
  }

  // Load suppliers when modal opens
  React.useEffect(() => {
    if (isOpen && allowDirectScheduling) {
      loadSuppliers()
    }
  }, [isOpen, allowDirectScheduling])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${selectedDate}T${startTime}`)
      // Default to 2 hour duration
      const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000))

      // Validate direct scheduling fields if enabled
      if (allowDirectScheduling && (!selectedSupplier || expectedCost <= 0)) {
        addNotification({
          title: 'Missing Information',
          message: 'Please select a supplier and enter an expected cost.',
          type: 'error',
          userId: currentUser?.id || ''
        })
        setLoading(false)
        return
      }

      const event: BuildingEvent = {
        id: `event-${Date.now()}`,
        title: `Work on ${ticket.title}`,
        description: `Scheduled work for ticket: ${ticket.description}${notes ? ` - Notes: ${notes}` : ''}`,
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

      // Prepare supplier info if direct scheduling is used
      let supplierInfo: { supplier: Supplier; expectedCost: number } | undefined
      if (allowDirectScheduling && selectedSupplier) {
        const supplier = suppliers.find(s => s.id === selectedSupplier)
        if (supplier) {
          supplierInfo = { supplier, expectedCost }
        }
      }

      // Here you would save to Firestore
      // await eventService.createEvent(event)
      
      const successMessage = allowDirectScheduling 
        ? `Work scheduled with ${suppliers.find(s => s.id === selectedSupplier)?.companyName || suppliers.find(s => s.id === selectedSupplier)?.name} for ${startDateTime.toLocaleDateString()} at ${startTime}. Expected cost: £${expectedCost}`
        : `Work scheduled for ${startDateTime.toLocaleDateString()} at ${startTime}`
      
      addNotification({
        title: 'Event Scheduled',
        message: successMessage,
        type: 'success',
        userId: currentUser?.id || ''
      })

      onScheduled(event, supplierInfo)
      onClose()
      
      // Reset form
      setSelectedDate('')
      setStartTime('')
      setNotes('')
      setSelectedSupplier('')
      setExpectedCost(0)
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

  // Time slot options
  const timeOptions: DropdownOption[] = [
    { value: '08:00', label: '08:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '08:30', label: '08:30 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '09:00', label: '09:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '09:30', label: '09:30 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '10:00', label: '10:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '10:30', label: '10:30 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '11:00', label: '11:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '11:30', label: '11:30 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '12:00', label: '12:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '12:30', label: '12:30 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '13:00', label: '01:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '13:30', label: '01:30 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '14:00', label: '02:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '14:30', label: '02:30 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '15:00', label: '03:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '15:30', label: '03:30 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '16:00', label: '04:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '16:30', label: '04:30 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '17:00', label: '05:00 PM', icon: <Clock className="h-4 w-4" /> },
  ]

  // Convert suppliers to dropdown options
  const supplierOptions: DropdownOption[] = suppliers.map((supplier) => ({
    value: supplier.id,
    label: supplier.companyName || supplier.name,
    description: `${supplier.email} • ${supplier.phone}`,
    icon: <User className="h-4 w-4" />
  }))

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

        {/* Date and Time Selection */}
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Time
            </label>
            <Dropdown
              options={timeOptions}
              value={startTime}
              onChange={setStartTime}
              placeholder="Select time..."
              size="md"
              className="w-full"
            />
          </div>
        </div>

        {/* Supplier Selection - Direct Scheduling */}
        {allowDirectScheduling && (
          <div className="border-t border-neutral-200 pt-4">
            <div className="space-y-4 bg-neutral-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-neutral-900 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Schedule with Supplier
              </h4>
              
              {/* Supplier Selection and Expected Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Select Supplier
                  </label>
                  <Dropdown
                    options={supplierOptions}
                    value={selectedSupplier}
                    onChange={setSelectedSupplier}
                    placeholder="Choose a supplier..."
                    size="md"
                    showSearch={supplierOptions.length > 5}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Expected Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                    <input
                      type="number"
                      value={expectedCost || ''}
                      onChange={(e) => setExpectedCost(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      required={allowDirectScheduling}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Estimated cost for tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
            disabled={loading || !selectedDate || !startTime || (allowDirectScheduling && (!selectedSupplier || expectedCost <= 0))}
            className="flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Schedule'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default ScheduleModal 