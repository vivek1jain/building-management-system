import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, CheckCircle, XCircle, Loader } from 'lucide-react'
import { getInvitation, acceptInvitation } from '../services/invitationService'
import { UserInvitation } from '../types'

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  
  const [invitation, setInvitation] = useState<UserInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (token) {
      loadInvitation()
    }
  }, [token])

  const loadInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('📧 Loading invitation...')
      const invitationData = await getInvitation(token)
      
      if (!invitationData) {
        setError('Invitation not found or has expired')
      } else if (invitationData.status !== 'pending') {
        setError(`This invitation has been ${invitationData.status}`)
      } else {
        setInvitation(invitationData)
      }
    } catch (err) {
      console.error('🚨 Error loading invitation:', err)
      setError('Failed to load invitation. Please check the link and try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invitation || !token) return
    
    if (!validateForm()) return

    try {
      setAccepting(true)
      console.log('✅ Accepting invitation...')
      
      await acceptInvitation(token, formData.name, formData.password)
      
      setAccepted(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      console.error('🚨 Error accepting invitation:', err)
      setError(err.message || 'Failed to accept invitation. Please try again.')
      setAccepting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100'
      case 'manager': return 'text-primary-600 bg-blue-100'
      case 'supplier': return 'text-yellow-600 bg-yellow-100'
      case 'resident': return 'text-success-600 bg-green-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Welcome aboard!</h1>
          <p className="text-neutral-600 mb-6">
            Your account has been created successfully. Redirecting you to login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Invalid Invitation</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">You've Been Invited!</h1>
          <p className="text-neutral-600">Complete your profile to join the building management system</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase">Email</p>
            <p className="text-sm text-neutral-900 font-medium">{invitation.email}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase">Role</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
              {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase">Expires</p>
            <p className="text-sm text-neutral-900">{invitation.expiresAt.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.name ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Enter your full name"
                disabled={accepting}
              />
            </div>
            {formErrors.name && (
              <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.password ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Create a password (min 6 characters)"
                disabled={accepting}
              />
            </div>
            {formErrors.password && (
              <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Confirm your password"
                disabled={accepting}
              />
            </div>
            {formErrors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{formErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={accepting}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Accept Invitation
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-neutral-500 text-center mt-6">
          By accepting this invitation, you agree to the terms and conditions of the building management system.
        </p>
      </div>
    </div>
  )
}
