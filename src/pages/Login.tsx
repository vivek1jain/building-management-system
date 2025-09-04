import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Building, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { Button, Input, Card, CardContent } from '../components/UI'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Building className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-neutral-900">
            Building Management System
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        
        <Card>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {isRegistering && (
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isRegistering}
                    leftIcon={<User className="h-4 w-4" />}
                  />
                )}

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  leftIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />
                
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    leftIcon={<Lock className="h-4 w-4" />}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="absolute top-8 right-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {isRegistering ? 'Create Account' : 'Sign in'}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-sm"
                  >
                    {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login 