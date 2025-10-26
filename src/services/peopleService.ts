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
import { handleServiceError } from '../utils/errorHandling';
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
  } catch (error) {
    console.error('Error getting people by building:', error)
    throw error
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
  } catch (error) {
    console.error('🚨 Detailed error creating person:')
    console.error('🚨 Error object:', error)
    console.error('🚨 Error message:', error.message)
    console.error('🚨 Error code:', error.code)
    if (error.details) {
      console.error('🚨 Error details:', error.details)
    }
    throw error
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
  } catch (error) {
    console.error('Error updating person:', error)
    throw error
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
  } catch (error) {
    console.error('Error getting people stats:', error)
    throw error
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
  } catch (error) {
    console.error('Error bulk updating people:', error)
    throw error
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