import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { User, UserRole } from '../types'
import { handleFirebaseError, createAppError } from '../utils/errorHandler'

const USERS_COLLECTION = 'users'

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date()
}

export const authService = {
  // Register new user
  async register(email: string, password: string, name: string, role: UserRole = 'requester'): Promise<User> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Update display name
      await updateProfile(firebaseUser, { displayName: name })

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), userData)

      return userData
    } catch (error: any) {
      const appError = handleFirebaseError(error, {
        action: 'register',
        email,
      });
      throw appError;
    }
  },

  // Login user
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid))
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found')
      }

      const userData = userDoc.data() as User
      return {
        ...userData,
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      }
    } catch (error: any) {
      // Check if user profile not found
      if (error.message === 'User profile not found') {
        const appError = createAppError('ERR-AUTH-003', {
          action: 'login',
          email,
        });
        throw appError;
      }
      
      const appError = handleFirebaseError(error, {
        action: 'login',
        email,
      });
      throw appError;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      const appError = handleFirebaseError(error, {
        action: 'logout',
      });
      throw appError;
    }
  },

  // Get current user data
  async getCurrentUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        return {
          ...userData,
          createdAt: convertTimestamp(userData.createdAt),
          updatedAt: convertTimestamp(userData.updatedAt)
        }
      }
      return null
    } catch (error: any) {
      const appError = handleFirebaseError(error, {
        action: 'getCurrentUser',
        uid,
      });
      // Don't throw, return null for getCurrentUser
      return null;
    }
  },

  // Update user profile
  async updateProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error: any) {
      const appError = handleFirebaseError(error, {
        action: 'updateProfile',
        uid,
      });
      throw appError;
    }
  },

  // Create demo users (for development)
  async createDemoUsers(): Promise<void> {
    try {
      const demoUsers = [
        {
          email: 'manager@building.com',
          password: 'password123',
          name: 'John Manager',
          role: 'manager' as UserRole
        },
        {
          email: 'supplier@building.com',
          password: 'password123',
          name: 'ABC Plumbing',
          role: 'supplier' as UserRole
        },
        {
          email: 'requester@building.com',
          password: 'password123',
          name: 'Jane Requester',
          role: 'requester' as UserRole
        }
      ]

      let createdCount = 0
      let existingCount = 0
      let errorCount = 0

      for (const user of demoUsers) {
        try {
          await this.register(user.email, user.password, user.name, user.role)
          createdCount++
        } catch (error: any) {
          if (error.message.includes('already in use') || error.message.includes('already exists')) {
            existingCount++
          } else {
            console.error(`Error creating demo user ${user.email}:`, error)
            errorCount++
          }
        }
      }

      
      if (errorCount > 0) {
        throw new Error(`Failed to create ${errorCount} demo users. Check console for details.`)
      }
    } catch (error) {
      console.error('Error in createDemoUsers:', error)
      throw error
    }
  }
} 