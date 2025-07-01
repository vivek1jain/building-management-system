import { useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const TestFirebase = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [authStatus, setAuthStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  useEffect(() => {
    // Test Firebase Auth connection
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user')
        setAuthStatus('connected')
      },
      (error) => {
        console.error('Auth state error:', error)
        setAuthStatus('disconnected')
        setMessage(`Auth Error: ${error.message}`)
      }
    )

    return () => unsubscribe()
  }, [])

  const testFirebaseConnection = async () => {
    setStatus('testing')
    setMessage('Testing Firebase connection...')

    try {
      // Test anonymous authentication (simplest test)
      console.log('Testing Firebase Auth connection...')
      const result = await signInAnonymously(auth)
      console.log('Anonymous auth successful:', result.user.uid)
      
      setStatus('success')
      setMessage('Firebase connection successful! Anonymous auth working.')
      
      // Sign out after test
      await auth.signOut()
      
    } catch (error: any) {
      console.error('Firebase test error:', error)
      setStatus('error')
      
      if (error.code === 'auth/operation-not-allowed') {
        setMessage('Error: Anonymous authentication is not enabled in Firebase console. Please enable it in Authentication > Sign-in methods.')
      } else if (error.code === 'auth/network-request-failed') {
        setMessage('Error: Network connection failed. Check your internet connection.')
      } else if (error.code === 'auth/invalid-api-key') {
        setMessage('Error: Invalid API key. Check your Firebase configuration.')
      } else {
        setMessage(`Firebase Error: ${error.message} (Code: ${error.code})`)
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Firebase Connection Test</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Auth Status:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            authStatus === 'connected' ? 'bg-green-100 text-green-800' :
            authStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {authStatus === 'connected' ? 'Connected' :
             authStatus === 'disconnected' ? 'Disconnected' : 'Unknown'}
          </span>
        </div>

        <button
          onClick={testFirebaseConnection}
          disabled={status === 'testing'}
          className="btn-primary px-4 py-2 text-sm"
        >
          {status === 'testing' ? 'Testing...' : 'Test Firebase Connection'}
        </button>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• This tests Firebase Authentication connection</p>
          <p>• If you see 400 errors, check Firebase console settings</p>
          <p>• Ensure Authentication is enabled in your Firebase project</p>
        </div>
      </div>
    </div>
  )
}

export default TestFirebase 