import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { 
  Upload, 
  X, 
  AlertCircle,
  MapPin,
  FileText,
  Clock,
  Building,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { ticketService } from '../../services/ticketService'
import { CreateTicketForm as CreateTicketFormType, UrgencyLevel } from '../../types'
import Button from '../UI/Button'

interface CreateTicketFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({ onSuccess, onCancel }) => {
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId, selectedBuilding } = useBuilding()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CreateTicketFormType>()

  const urgency = watch('urgency')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachments(prev => [...prev, ...acceptedFiles])
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CreateTicketFormType) => {
    if (!currentUser) {
      addNotification({
        title: 'Error',
        message: 'You must be logged in to create a ticket.',
        type: 'error',
        userId: 'current'
      })
      return
    }

    if (!selectedBuildingId) {
      addNotification({
        title: 'Error',
        message: 'Please select a building from the header before creating a ticket.',
        type: 'error',
        userId: 'current'
      })
      return
    }

    setLoading(true)
    
    try {
      // Add the selected building ID to the form data
      const ticketData = {
        ...data,
        buildingId: selectedBuildingId
      }
      await ticketService.createTicket(ticketData, attachments, currentUser.id)
      
      addNotification({
        title: 'Ticket Created!',
        message: 'Your maintenance ticket has been successfully created.',
        type: 'success',
        userId: 'current'
      })
      
      // Reset form
      reset()
      setAttachments([])
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to create ticket. Please try again.',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const urgencyOptions: { value: UrgencyLevel; label: string; color: string; icon: string }[] = [
    { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800', icon: '🟢' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
    { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800', icon: '🔴' }
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
          Issue Title *
        </label>
        <input
          {...register('title', { required: 'Title is required' })}
          type="text"
          className="input"
          placeholder="Brief description of the issue"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          {...register('description', { 
            required: 'Description is required',
            minLength: { value: 10, message: 'Description must be at least 10 characters' }
          })}
          rows={4}
          className="textarea"
          placeholder="Provide detailed information about the issue, including any relevant context..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Building Display (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Building
        </label>
        <div className="relative">
          <div className="appearance-none bg-neutral-50 border border-neutral-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-neutral-700">
            {selectedBuilding ? selectedBuilding.name : 'No building selected'}
          </div>
          
          {/* Building icon */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Building className="h-4 w-4 text-neutral-400" />
          </div>
        </div>
        {!selectedBuildingId && (
          <p className="mt-1 text-sm text-yellow-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Please select a building from the header
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
          Location *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            {...register('location', { required: 'Location is required' })}
            type="text"
            className="input pl-10"
            placeholder="Building, floor, room number, or specific area"
          />
        </div>
        {errors.location && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.location.message}
          </p>
        )}
      </div>

      {/* Urgency */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Urgency Level *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {urgencyOptions.map((option) => (
            <label
              key={option.value}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                urgency === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <input
                {...register('urgency', { required: 'Urgency level is required' })}
                type="radio"
                value={option.value}
                className="sr-only"
              />
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{option.icon}</span>
                <span className="text-sm font-medium text-neutral-900">{option.label}</span>
              </div>
              {urgency === option.value && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </label>
          ))}
        </div>
        {errors.urgency && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.urgency.message}
          </p>
        )}
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Attachments
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-neutral-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            PNG, JPG, PDF up to 5MB each
          </p>
        </div>

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-700">{file.name}</span>
                  <span className="text-xs text-neutral-500 ml-2">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-neutral-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Create Ticket
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default CreateTicketForm
