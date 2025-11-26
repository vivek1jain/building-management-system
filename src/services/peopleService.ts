import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { Person, PersonStatus, UserRole } from '../types'
import { handleFirebaseError } from '../utils/errorHandler';
import { fromFirestoreTimestamp, toFirestoreTimestamp, toOptionalFirestoreTimestamp } from '../utils/firestore';

// Get all people for a building
export const getPeopleByBuilding = async (buildingId: string): Promise<Person[]> => {
  try {
    const peopleRef = collection(db, 'people')
    const q = query(
      peopleRef,
      where('buildingId', '==', buildingId)
    )
    
    const querySnapshot = await getDocs(q)
    const people: Person[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      people.push({
        id: doc.id,
        uid: data.uid,
        name: data.name,
        buildingId: data.buildingId,
        accessibleBuildingIds: data.accessibleBuildingIds,
        flatId: data.flatId,
        flatNumber: data.flatNumber,
        role: data.role,
        status: data.status,
        email: data.email,
        phone: data.phone,
        isPrimaryContact: data.isPrimaryContact,
        moveInDate: data.moveInDate ? fromFirestoreTimestamp(data.moveInDate) : undefined,
        moveOutDate: data.moveOutDate ? fromFirestoreTimestamp(data.moveOutDate) : undefined,
        notes: data.notes,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt),
        createdByUid: data.createdByUid,
        updatedByUid: data.updatedByUid
      })
    })
    
    // Sort by name
    return people.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getPeopleByBuilding',
      buildingId,
    })
  }
}


// Create a new person
export const createPerson = async (personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> => {
  try {
    
    // Check authentication state
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    const peopleRef = collection(db, 'people')
    const newPerson = {
      ...personData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    
    // Add timeout to detect hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
    })
    
    const docRef = await Promise.race([
      addDoc(peopleRef, newPerson),
      timeoutPromise
    ]) as any
    
    
    return {
      id: docRef.id,
      ...personData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'createPerson',
      personData,
    })
  }
}

// Update a person
export const updatePerson = async (personId: string, personData: Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const personRef = doc(db, 'people', personId)
    await updateDoc(personRef, {
      ...personData,
      updatedAt: serverTimestamp()
    })
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'updatePerson',
      personId,
    })
  }
}


// Get people statistics
export const getPeopleStats = async (buildingId: string) => {
  try {
    const people = await getPeopleByBuilding(buildingId)
    
    const stats = {
      totalPeople: people.length,
      byStatus: {} as Record<PersonStatus, number>,
      byRole: {} as Record<UserRole, number>,
      primaryContacts: 0,
      withFlats: 0,
      pendingApproval: 0
    }
    
    people.forEach(person => {
      // Count by status
      if (stats.byStatus[person.status]) {
        stats.byStatus[person.status]++
      } else {
        stats.byStatus[person.status] = 1
      }
      
      // Count by role
      if (person.role && stats.byRole[person.role]) {
        stats.byRole[person.role]++
      } else if (person.role) {
        stats.byRole[person.role] = 1
      }
      
      // Count primary contacts
      if (person.isPrimaryContact) {
        stats.primaryContacts++
      }
      
      // Count people with flats
      if (person.flatId) {
        stats.withFlats++
      }
      
      // Count pending approval
      if (person.status === PersonStatus.PENDING_APPROVAL) {
        stats.pendingApproval++
      }
    })
    
    return stats
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getPeopleStats',
      buildingId,
    })
  }
}

// Bulk update people
export const bulkUpdatePeople = async (updates: { id: string; data: Partial<Person> }[]): Promise<void> => {
  try {
    const batch = writeBatch(db)
    
    updates.forEach(({ id, data }) => {
      const personRef = doc(db, 'people', id)
      batch.update(personRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'bulkUpdatePeople',
      count: updates.length,
    })
  }
}

// Bulk create people
export const bulkCreatePeople = async (buildingId: string, peopleData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> => {
  try {
    const batch = writeBatch(db)
    
    peopleData.forEach((personData) => {
      const personRef = doc(collection(db, 'people'))
      batch.set(personRef, {
        ...personData,
        buildingId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error bulk creating people:', error)
    throw error
  }
}

// Get people with move-in/move-out dates
export const getPeopleWithMoveDates = async (buildingId: string, startDate: Date, endDate: Date): Promise<Person[]> => {
  try {
    const people = await getPeopleByBuilding(buildingId)
    
    return people.filter(person => {
      if (person.moveInDate && person.moveInDate >= startDate && person.moveInDate <= endDate) {
        return true
      }
      if (person.moveOutDate && person.moveOutDate >= startDate && person.moveOutDate <= endDate) {
        return true
      }
      return false
    })
  } catch (error) {
    console.error('Error getting people with move dates:', error)
    throw error
  }
}

// ============= BUILDING ACCESS MANAGEMENT =============

/**
 * Get all building IDs that a user has access to
 */
export const getUserBuildingIds = async (userId: string): Promise<string[]> => {
  try {
    const peopleRef = collection(db, 'people')
    const q = query(peopleRef, where('uid', '==', userId))
    const querySnapshot = await getDocs(q)
    
    const buildingIds = new Set<string>()
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.buildingId) {
        buildingIds.add(data.buildingId)
      }
    })
    
    return Array.from(buildingIds)
  } catch (error) {
    console.error('Error getting user building IDs:', error)
    throw new Error('Failed to get user building access')
  }
}

/**
 * Get detailed building access information for a user
 */
export const getUserBuildingAccess = async (userId: string): Promise<Person[]> => {
  try {
    const peopleRef = collection(db, 'people')
    const q = query(peopleRef, where('uid', '==', userId))
    const querySnapshot = await getDocs(q)
    
    const people: Person[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      people.push({
        id: doc.id,
        uid: data.uid,
        name: data.name,
        buildingId: data.buildingId,
        accessibleBuildingIds: data.accessibleBuildingIds || null,
        flatId: data.flatId || null,
        flatNumber: data.flatNumber || null,
        role: data.role,
        status: data.status,
        email: data.email,
        phone: data.phone,
        isPrimaryContact: data.isPrimaryContact,
        moveInDate: data.moveInDate ? fromFirestoreTimestamp(data.moveInDate) : null,
        moveOutDate: data.moveOutDate ? fromFirestoreTimestamp(data.moveOutDate) : null,
        notes: data.notes,
        emergencyContact: data.emergencyContact,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? fromFirestoreTimestamp(data.updatedAt) : undefined,
        createdByUid: data.createdByUid,
        updatedByUid: data.updatedByUid
      })
    })
    
    return people
  } catch (error) {
    console.error('Error getting user building access:', error)
    throw new Error('Failed to get user building access details')
  }
}

/**
 * Add building access for a user
 */
export const addUserBuildingAccess = async (
  userId: string,
  userName: string,
  userEmail: string,
  buildingId: string,
  role: UserRole,
  createdByUid: string,
  flatId?: string,
  flatNumber?: string
): Promise<string> => {
  try {
    // Check if user already has access to this building
    const existing = await getUserBuildingAccess(userId)
    const hasAccess = existing.some(p => p.buildingId === buildingId)
    
    if (hasAccess) {
      throw new Error('User already has access to this building')
    }
    
    const peopleRef = collection(db, 'people')
    const newPerson = {
      uid: userId,
      name: userName,
      buildingId: buildingId,
      flatId: flatId || null,
      flatNumber: flatNumber || null,
      role: role,
      status: PersonStatus.TENANT, // Default status
      email: userEmail,
      isPrimaryContact: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: createdByUid
    }
    
    const docRef = await addDoc(peopleRef, newPerson)
    console.log('✅ Building access added:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding building access:', error)
    throw error
  }
}

/**
 * Remove building access for a user (delete person entry)
 */
export const removeUserBuildingAccess = async (
  personId: string
): Promise<void> => {
  try {
    const personRef = doc(db, 'people', personId)
    await deleteDoc(personRef)
    console.log('✅ Building access removed:', personId)
  } catch (error) {
    console.error('Error removing building access:', error)
    throw new Error('Failed to remove building access')
  }
}

/**
 * Update user's role for a specific building
 */
export const updateUserBuildingRole = async (
  personId: string,
  role: UserRole,
  updatedByUid: string
): Promise<void> => {
  try {
    const personRef = doc(db, 'people', personId)
    await updateDoc(personRef, {
      role: role,
      updatedAt: serverTimestamp(),
      updatedByUid: updatedByUid
    })
    console.log('✅ Building role updated:', personId)
  } catch (error) {
    console.error('Error updating building role:', error)
    throw new Error('Failed to update building role')
  }
}

/**
 * Create people entries for a new user during invitation acceptance
 */
export const createPeopleEntriesForInvitation = async (
  userId: string,
  userName: string,
  userEmail: string,
  buildingIds: string[],
  role: UserRole,
  phone?: string,
  personStatus?: PersonStatus,
  flatNumber?: string,
  companyName?: string
): Promise<void> => {
  try {
    console.log('📝 Creating people entries for invitation acceptance...')
    
    // Suppliers don't get people entries - they belong in suppliers collection
    if (role === 'supplier') {
      console.log('ℹ️ Skipping people entries for supplier role')
      // TODO: Create supplier record instead (handled separately)
      return
    }
    
    // Use provided personStatus or default based on role
    const status = personStatus || (
      role === 'admin' || role === 'manager' ? PersonStatus.MANAGER : PersonStatus.TENANT
    )
    
    const promises = buildingIds.map(async (buildingId) => {
      let flatId: string | undefined = undefined
      
      // If flatNumber provided, look up the actual flat document ID
      if (flatNumber) {
        const { getFlatsByBuilding } = await import('./flatService')
        const flats = await getFlatsByBuilding(buildingId)
        const matchingFlat = flats.find(f => f.flatNumber === flatNumber)
        
        if (matchingFlat) {
          flatId = matchingFlat.id
          console.log(`✅ Found flat ${flatNumber} with ID: ${flatId}`)
        } else {
          console.warn(`⚠️ Flat number ${flatNumber} not found in building ${buildingId}`)
        }
      }
      
      const personId = await addUserBuildingAccess(
        userId,
        userName,
        userEmail,
        buildingId,
        role,
        userId, // Created by the user themselves during invitation acceptance
        flatId, // Use looked-up flatId
        flatNumber // Pass flatNumber for display
      )
      
      // Update with phone and status if provided
      if (phone || personStatus) {
        const personRef = doc(db, 'people', personId)
        await updateDoc(personRef, {
          ...(phone && { phone }),
          ...(personStatus && { status }),
          updatedAt: serverTimestamp()
        })
      }
      
      return personId
    })
    
    await Promise.all(promises)
    console.log(`✅ Created ${buildingIds.length} people entries for user ${userId}`)
  } catch (error) {
    console.error('Error creating people entries:', error)
    throw new Error('Failed to create people entries for invitation')
  }
}
