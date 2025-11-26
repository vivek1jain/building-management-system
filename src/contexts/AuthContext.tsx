import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase/config'
import { authService } from '../services/authService'
import { User } from '../types'
import { handleFirebaseError, createAppError, logError } from '../utils/errorHandler'
import { setUserContext, clearUserContext } from '../utils/sentry'

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
          
          // Set user context for error tracking
          setUserContext({
            id: userData.id,
            email: userData.email,
            role: userData.role,
          });
        } catch (error) {
          const appError = handleFirebaseError(error as any, {
            action: 'fetchUserData',
            userId: user.uid,
          });
          logError(appError, 'AuthContext.onAuthStateChanged');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null)
        clearUserContext();
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userData = await authService.login(email, password)
      setCurrentUser(userData)
      
      // Set user context for error tracking
      setUserContext({
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });
    } catch (error) {
      // Error is already handled in authService, just re-throw
      throw error;
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setCurrentUser(null)
      clearUserContext();
    } catch (error) {
      // Log error but don't prevent logout UI update
      const appError = handleFirebaseError(error as any, {
        action: 'logout',
        userId: currentUser?.id,
      });
      logError(appError, 'AuthContext.logout');
      
      // Still clear user state locally
      setCurrentUser(null);
      clearUserContext();
      
      throw error;
    }
  }

  const register = async (email: string, password: string, name: string, role: string = 'requester') => {
    try {
      const userData = await authService.register(email, password, name, role as any)
      setCurrentUser(userData)
      
      // Set user context for error tracking
      setUserContext({
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });
    } catch (error) {
      // Error is already handled in authService, just re-throw
      throw error;
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