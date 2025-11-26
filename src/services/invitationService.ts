import { 
  collection, 
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore'
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { UserInvitation, UserRole, User, PersonStatus } from '../types'
import { createPeopleEntriesForInvitation } from './peopleService'
import { handleFirebaseError, createAppError } from '../utils/errorHandler'

const INVITATIONS_COLLECTION = 'invitations'
const USERS_COLLECTION = 'users'

// Helper to convert Firestore timestamp
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date()
}

// Generate secure random token
const generateToken = (): string => {
  // Generate 32 random bytes (256 bits)
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  // Convert to base64url (URL-safe)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Create a new invitation
export const createInvitation = async (
  email: string,
  role: UserRole,
  invitedBy: string,
  invitedByName: string,
  expiryDays: number = 7,
  buildingIds: string[] = [],
  phone?: string,
  personStatus?: PersonStatus,
  flatNumber?: string,
  companyName?: string
): Promise<UserInvitation> => {
  try {
    console.log('📧 Creating invitation for:', email)
    
    // Check if email already has a pending invitation
    const invitationsRef = collection(db, INVITATIONS_COLLECTION)
    const q = query(
      invitationsRef, 
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'pending')
    )
    const existingInvitations = await getDocs(q)
    
    if (!existingInvitations.empty) {
      throw new Error('This email already has a pending invitation')
    }
    
    // Check if user already exists
    const usersRef = collection(db, USERS_COLLECTION)
    const userQuery = query(usersRef, where('email', '==', email.toLowerCase()))
    const existingUsers = await getDocs(userQuery)
    
    if (!existingUsers.empty) {
      throw new Error('A user with this email already exists')
    }
    
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)
    
    const invitationData = {
      email: email.toLowerCase(),
      role,
      invitedBy,
      invitedByName,
      token,
      status: 'pending' as const,
      expiresAt,
      buildingIds: buildingIds || [],
      ...(phone && { phone }),
      ...(personStatus && { personStatus }),
      ...(flatNumber && { flatNumber }),
      ...(companyName && { companyName }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(invitationsRef, invitationData)
    console.log('✅ Invitation created:', docRef.id)
    
    return {
      id: docRef.id,
      ...invitationData,
      expiresAt,
      phone,
      personStatus,
      flatNumber,
      companyName,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'createInvitation',
      email,
      role,
    })
  }
}

// Get invitation by token
export const getInvitation = async (token: string): Promise<UserInvitation | null> => {
  try {
    console.log('🔍 Looking up invitation by token...')
    const invitationsRef = collection(db, INVITATIONS_COLLECTION)
    const q = query(invitationsRef, where('token', '==', token))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('❌ Invitation not found')
      return null
    }
    
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    
    const invitation: UserInvitation = {
      id: doc.id,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      token: data.token,
      status: data.status,
      expiresAt: convertTimestamp(data.expiresAt),
      acceptedAt: data.acceptedAt ? convertTimestamp(data.acceptedAt) : undefined,
      buildingIds: data.buildingIds || [],
      phone: data.phone,
      personStatus: data.personStatus,
      flatNumber: data.flatNumber,
      companyName: data.companyName,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt)
    }
    
    // Check if expired
    if (invitation.status === 'pending' && invitation.expiresAt < new Date()) {
      // Mark as expired
      await updateDoc(doc.ref, {
        status: 'expired',
        updatedAt: serverTimestamp()
      })
      invitation.status = 'expired'
    }
    
    console.log('✅ Invitation found:', invitation.email)
    return invitation
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getInvitation',
      token,
    })
  }
}

// Get all invitations (for admin view)
export const getAllInvitations = async (): Promise<UserInvitation[]> => {
  try {
    console.log('📋 Fetching all invitations...')
    const invitationsRef = collection(db, INVITATIONS_COLLECTION)
    const querySnapshot = await getDocs(invitationsRef)
    
    const invitations: UserInvitation[] = []
    const now = new Date()
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data()
      const expiresAt = convertTimestamp(data.expiresAt)
      
      let status = data.status
      
      // Auto-mark expired invitations
      if (status === 'pending' && expiresAt < now) {
        status = 'expired'
        await updateDoc(doc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        })
      }
      
      invitations.push({
        id: doc.id,
        email: data.email,
        role: data.role,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        token: data.token,
        status,
        expiresAt,
        acceptedAt: data.acceptedAt ? convertTimestamp(data.acceptedAt) : undefined,
        buildingIds: data.buildingIds || [],
        phone: data.phone,
        personStatus: data.personStatus,
        flatNumber: data.flatNumber,
        companyName: data.companyName,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      })
    }
    
    // Sort by creation date (newest first)
    invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    console.log(`✅ Loaded ${invitations.length} invitations`)
    return invitations
  } catch (error) {
    console.error('🚨 Error fetching invitations:', error)
    throw error
  }
}

// Cancel invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    console.log('🚫 Cancelling invitation:', invitationId)
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId)
    
    await updateDoc(invitationRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    })
    
    console.log('✅ Invitation cancelled')
  } catch (error) {
    console.error('🚨 Error cancelling invitation:', error)
    throw error
  }
}

// Accept invitation and create user account
export const acceptInvitation = async (
  token: string,
  name: string,
  password: string
): Promise<User> => {
  try {
    console.log('✨ Accepting invitation...')
    
    // Get invitation
    const invitation = await getInvitation(token)
    
    if (!invitation) {
      throw new Error('Invitation not found')
    }
    
    if (invitation.status !== 'pending') {
      throw new Error(`Invitation is ${invitation.status}`)
    }
    
    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired')
    }
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      invitation.email,
      password
    )
    const firebaseUser = userCredential.user
    
    // Update display name
    await updateProfile(firebaseUser, { displayName: name })
    
    // Create Firestore user document with correct ID
    const userData: User = {
      id: firebaseUser.uid,
      email: invitation.email,
      name,
      role: invitation.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Use setDoc with the UID as document ID (not addDoc which generates random ID)
    const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid)
    await setDoc(userDocRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    // Create people entries for building access (not for suppliers)
    if (invitation.role === 'supplier') {
      // Create supplier record instead
      if (invitation.companyName) {
        const { default: SupplierService } = await import('./supplierService')
        const supplierService = new SupplierService()
        
        await supplierService.createSupplier({
          email: invitation.email,
          name: name,
          role: 'supplier',
          companyName: invitation.companyName,
          specialties: [],
          rating: 0,
          totalJobs: 0,
          isActive: true,
          phone: invitation.phone
        })
        console.log('✅ Supplier record created')
      }
    } else if (invitation.buildingIds && invitation.buildingIds.length > 0) {
      await createPeopleEntriesForInvitation(
        firebaseUser.uid,
        name,
        invitation.email,
        invitation.buildingIds,
        invitation.role,
        invitation.phone,
        invitation.personStatus,
        invitation.flatNumber,
        invitation.companyName
      )
      console.log(`✅ Created building access for ${invitation.buildingIds.length} building(s)`)
    }
    
    // Mark invitation as accepted
    console.log('📝 Marking invitation as accepted...')
    const invitationsRef = collection(db, INVITATIONS_COLLECTION)
    const q = query(invitationsRef, where('token', '==', token))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const invitationDoc = querySnapshot.docs[0]
      console.log('✅ Found invitation document:', invitationDoc.id)
      await updateDoc(invitationDoc.ref, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('✅ Invitation marked as accepted')
    } else {
      console.error('❌ Invitation document not found for token:', token)
    }
    
    console.log('✅ User account created successfully')
    return userData
  } catch (error: any) {
    console.error('🚨 Error accepting invitation:', error)
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered')
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters')
    }
    throw error
  }
}

// Generate invitation link
export const generateInvitationLink = (token: string): string => {
  const baseUrl = window.location.origin
  return `${baseUrl}/accept-invitation/${token}`
}
