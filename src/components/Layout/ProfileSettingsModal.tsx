import { X } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'
import { Button } from '../UI'
import { useNotifications } from '../../contexts/NotificationContext'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const ProfileSettingsModal = ({ isOpen, onClose }: ProfileSettingsModalProps) => {
  const { currentUser, firebaseUser } = useAuth()
  const { addNotification } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
      })
    }
  }, [currentUser])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number format is invalid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !currentUser || !firebaseUser) {
      return
    }

    setIsLoading(true)

    try {
      await authService.updateProfile(currentUser.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
      })

      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully',
      })

      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) {
                  setErrors({ ...errors, name: '' })
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.name
                  ? 'border-danger-300 focus:ring-danger-500'
                  : 'border-neutral-200'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-xs text-danger-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value })
                if (errors.phone) {
                  setErrors({ ...errors, phone: '' })
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.phone
                  ? 'border-danger-300 focus:ring-danger-500'
                  : 'border-neutral-200'
              }`}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-xs text-danger-600 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : ''}
              disabled
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettingsModal
