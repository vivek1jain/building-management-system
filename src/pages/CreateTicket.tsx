import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { 
  Upload, 
  X, 
  AlertCircle,
  MapPin,
  FileText,
  Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { ticketService } from '../services/ticketService'
import { CreateTicketForm, UrgencyLevel } from '../types'

const CreateTicket = () => {
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateTicketForm>()

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

  const onSubmit = async (data: CreateTicketForm) => {
    if (!currentUser) {
      addNotification({
        title: 'Error',
        message: 'You must be logged in to create a ticket.',
        type: 'error',
        userId: 'current'
      })
      return
    }

    setLoading(true)
    
    try {
      await ticketService.createTicket(data, attachments, currentUser.id)
      
      addNotification({
        title: 'Ticket Created!',
        message: 'Your maintenance ticket has been successfully created.',
        type: 'success',
        userId: 'current'
      })
      
      navigate('/tickets')
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Raise New Ticket</h1>
        <p className="text-gray-600 mt-1">
          Create a new maintenance ticket with all the details needed for quick resolution.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {urgencyOptions.map((option) => (
              <label
                key={option.value}
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  urgency === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:bg-gray-50'
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
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop files here, or click to select files'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, PDF up to 5MB each
            </p>
          </div>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
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
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateTicket 