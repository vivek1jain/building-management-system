import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { authService } from '../services/authService'
import { Building, Mail, Lock, Eye, EyeOff, User, Plus } from 'lucide-react'

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegistering) {
        await register(email, password, name)
        addNotification({
          title: 'Account Created!',
          message: 'Your account has been successfully created.',
          type: 'success',
          userId: 'current'
        })
      } else {
        await login(email, password)
        addNotification({
          title: 'Welcome back!',
          message: 'Successfully logged in to your account.',
          type: 'success',
          userId: 'current'
        })
      }
      navigate('/')
    } catch (error: any) {
      addNotification({
        title: isRegistering ? 'Registration failed' : 'Login failed',
        message: error.message || 'Please check your credentials and try again.',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const createDemoUsers = async () => {
    setLoading(true)
    try {
      await authService.createDemoUsers()
      addNotification({
        title: 'Demo Users Created!',
        message: 'Demo users have been created. You can now login with any of the demo credentials.',
        type: 'success',
        userId: 'current'
      })
    } catch (error: any) {
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to create demo users.',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Building className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Building Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} data-testid="login-form">
          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isRegistering}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter your full name"
                    data-testid="register-name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your email"
                  data-testid="email-input"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center py-3"
              data-testid="signin-button"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isRegistering ? 'Create Account' : 'Sign in'
              )}
            </button>
          </div>

          <div className="text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-primary-600 hover:text-primary-500"
              data-testid="create-account-link"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={createDemoUsers}
                disabled={loading}
                className="btn-secondary w-full flex justify-center py-3"
                data-testid="demo-login-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Demo Users
              </button>
              
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>Demo credentials (after creation):</p>
                <p>• manager@building.com / password123</p>
                <p>• supplier@building.com / password123</p>
                <p>• requester@building.com / password123</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 