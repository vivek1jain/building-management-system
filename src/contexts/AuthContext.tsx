import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { authService } from '../services/authService'
import { User } from '../types'

interface AuthContextType {
  currentUser: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string, role?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      
      if (user) {
        try {
          const userData = await authService.getCurrentUser(user.uid)
          setCurrentUser(userData)
        } catch (error) {
          console.error('Error fetching user data:', error)
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userData = await authService.login(email, password)
      setCurrentUser(userData)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setCurrentUser(null)
    } catch (error) {
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, role: string = 'requester') => {
    try {
      const userData = await authService.register(email, password, name, role as any)
      setCurrentUser(userData)
    } catch (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    login,
    logout,
    register
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 