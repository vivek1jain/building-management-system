import { 
  doc, 
  updateDoc,
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { User, UserRole } from '../types'

const USERS_COLLECTION = 'users'

// Update user status (activate/deactivate)
export const updateUserStatus = async (
  userId: string, 
  isActive: boolean, 
  currentUserId: string
): Promise<void> => {
  try {
    console.log(`👤 ${isActive ? 'Activating' : 'Deactivating'} user ${userId}...`)
    const userRef = doc(db, USERS_COLLECTION, userId)
    
    const updateData: any = {
      isActive,
      updatedAt: serverTimestamp()
    }
    
    if (!isActive) {
      // Deactivating user
      updateData.deactivatedAt = serverTimestamp()
      updateData.deactivatedBy = currentUserId
    } else {
      // Reactivating user - clear deactivation fields
      updateData.deactivatedAt = null
      updateData.deactivatedBy = null
    }
    
    await updateDoc(userRef, updateData)
    console.log(`✅ User ${isActive ? 'activated' : 'deactivated'} successfully`)
  } catch (error) {
    console.error('🚨 Error updating user status:', error)
    throw error
  }
}

// Update user role
export const updateUserRole = async (
  userId: string, 
  role: UserRole
): Promise<void> => {
  try {
    console.log(`👤 Updating user ${userId} role to ${role}...`)
    const userRef = doc(db, USERS_COLLECTION, userId)
    
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    })
    
    console.log('✅ User role updated successfully')
  } catch (error) {
    console.error('🚨 Error updating user role:', error)
    throw error
  }
}

// Update user profile information
export const updateUserProfile = async (
  userId: string, 
  updates: {
    name?: string
    phone?: string
    avatar?: string
  }
): Promise<void> => {
  try {
    console.log(`👤 Updating user ${userId} profile...`)
    const userRef = doc(db, USERS_COLLECTION, userId)
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    console.log('✅ User profile updated successfully')
  } catch (error) {
    console.error('🚨 Error updating user profile:', error)
    throw error
  }
}

// Update user (combined updates)
export const updateUser = async (
  userId: string,
  updates: {
    name?: string
    phone?: string
    avatar?: string
    role?: UserRole
    isActive?: boolean
  },
  currentUserId?: string
): Promise<void> => {
  try {
    console.log(`👤 Updating user ${userId}...`)
    const userRef = doc(db, USERS_COLLECTION, userId)
    
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    }
    
    // Handle deactivation tracking
    if (updates.isActive !== undefined && !updates.isActive && currentUserId) {
      updateData.deactivatedAt = serverTimestamp()
      updateData.deactivatedBy = currentUserId
    } else if (updates.isActive !== undefined && updates.isActive) {
      // Reactivating - clear deactivation fields
      updateData.deactivatedAt = null
      updateData.deactivatedBy = null
    }
    
    await updateDoc(userRef, updateData)
    console.log('✅ User updated successfully')
  } catch (error) {
    console.error('🚨 Error updating user:', error)
    throw error
  }
}

// Check if current user has permission to manage users
export const canManageUsers = (currentUser: User | null): boolean => {
  if (!currentUser) return false
  return currentUser.role === 'admin' || currentUser.role === 'manager'
}

// Check if current user can edit a specific user
export const canEditUser = (currentUser: User | null, targetUser: User): boolean => {
  if (!currentUser) return false
  
  // Admins can edit anyone
  if (currentUser.role === 'admin') return true
  
  // Managers can edit non-admins
  if (currentUser.role === 'manager' && targetUser.role !== 'admin') return true
  
  // Users can edit themselves (basic profile only)
  if (currentUser.id === targetUser.id) return true
  
  return false
}

// Delete user (DEVELOPMENT ONLY - removes Firestore document)
// Note: This does NOT delete the Firebase Auth account
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting user document...', userId)
    const userRef = doc(db, USERS_COLLECTION, userId)
    await deleteDoc(userRef)
    console.log('✅ User document deleted successfully')
    console.warn('⚠️ Note: Firebase Auth account still exists. User can still authenticate but will have no profile.')
  } catch (error) {
    console.error('🚨 Error deleting user:', error)
    throw error
  }
}

// Check if current user can delete a specific user
export const canDeleteUser = (currentUser: User | null, targetUser: User): boolean => {
  if (!currentUser) return false
  
  // Only admins can delete users
  if (currentUser.role !== 'admin') return false
  
  // Cannot delete yourself
  if (currentUser.id === targetUser.id) return false
  
  return true
}
