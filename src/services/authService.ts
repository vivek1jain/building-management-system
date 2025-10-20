import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { User, UserRole } from '../types'

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
      console.error('Error registering user:', error)
      throw new Error(error.message || 'Failed to register user')
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
      console.error('Error logging in:', error)
      throw new Error(error.message || 'Failed to login')
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error logging out:', error)
      throw new Error('Failed to logout')
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
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
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
    } catch (error) {
      console.error('Error updating profile:', error)
      throw new Error('Failed to update profile')
    }
  },

  // Create demo users (for development)
  async createDemoUsers(): Promise<void> {
    try {
      console.log('Starting demo user creation...')
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
          console.log(`Attempting to create demo user: ${user.email}`)
          await this.register(user.email, user.password, user.name, user.role)
          createdCount++
          console.log(`Successfully created demo user: ${user.email}`)
        } catch (error: any) {
          if (error.message.includes('already in use') || error.message.includes('already exists')) {
            console.log(`Demo user already exists: ${user.email}`)
            existingCount++
          } else {
            console.error(`Error creating demo user ${user.email}:`, error)
            errorCount++
          }
        }
      }

      console.log(`Demo user creation completed: ${createdCount} created, ${existingCount} existing, ${errorCount} errors`)
      
      if (errorCount > 0) {
        throw new Error(`Failed to create ${errorCount} demo users. Check console for details.`)
      }
    } catch (error) {
      console.error('Error in createDemoUsers:', error)
      throw error
    }
  }
} 