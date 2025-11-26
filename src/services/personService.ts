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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Person, PersonStatus, UserRole } from '../types'
import { handleFirebaseError, createAppError } from '../utils/errorHandler'

const PEOPLE_COLLECTION = 'people'

export const personService = {
  // Get all people
  async getAllPeople(): Promise<Person[]> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const q = query(peopleRef, orderBy('name'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || null,
          flatId: data.flatId || null,
          status: data.status || 'RESIDENT',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          moveInDate: data.moveInDate?.toDate(),
          moveOutDate: data.moveOutDate?.toDate()
        } as Person
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getAllPeople',
      })
    }
  },

  // Get people by building
  async getPeopleByBuilding(buildingId: string): Promise<Person[]> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const q = query(
        peopleRef, 
        where('buildingId', '==', buildingId),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || null,
          flatId: data.flatId || null,
          status: data.status || 'RESIDENT',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          moveInDate: data.moveInDate?.toDate(),
          moveOutDate: data.moveOutDate?.toDate()
        } as Person
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getPeopleByBuilding',
        buildingId,
      })
    }
  },

  // Get person by ID
  async getPersonById(personId: string): Promise<Person | null> {
    try {
      const docRef = doc(db, PEOPLE_COLLECTION, personId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      const data = docSnap.data()
      return {
        id: docSnap.id,
        name: data.name || '',
        buildingId: data.buildingId || null,
        flatId: data.flatId || null,
        status: data.status || 'RESIDENT',
        createdByUid: data.createdByUid || 'system',
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        moveInDate: data.moveInDate?.toDate(),
        moveOutDate: data.moveOutDate?.toDate()
      } as Person
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getPersonById',
        personId,
      })
    }
  },

  // Get person by email
  async getPersonByEmail(email: string): Promise<Person | null> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const q = query(peopleRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || '',
        buildingId: data.buildingId || null,
        flatId: data.flatId || null,
        status: data.status || 'RESIDENT',
        createdByUid: data.createdByUid || 'system',
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        moveInDate: data.moveInDate?.toDate(),
        moveOutDate: data.moveOutDate?.toDate()
      } as Person
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getPersonByEmail',
        email,
      })
    }
  },

  // Create new person
  async createPerson(personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> {
    try {
      const docRef = await addDoc(collection(db, PEOPLE_COLLECTION), {
        ...personData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      const createdPerson = await this.getPersonById(docRef.id)
      if (!createdPerson) {
        throw createAppError('ERR-DB-005', { personId: docRef.id })
      }
      
      return createdPerson
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'createPerson',
        personData,
      })
    }
  },

  // Update person
  async updatePerson(personId: string, updates: Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const docRef = doc(db, PEOPLE_COLLECTION, personId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updatePerson',
        personId,
      })
    }
  },

  // Delete person
  async deletePerson(personId: string): Promise<void> {
    try {
      const docRef = doc(db, PEOPLE_COLLECTION, personId)
      await deleteDoc(docRef)
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'deletePerson',
        personId,
      })
    }
  },

  // Get people by role
  async getPeopleByRole(role: UserRole): Promise<Person[]> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const q = query(
        peopleRef, 
        where('role', '==', role),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || null,
          flatId: data.flatId || null,
          status: data.status || 'RESIDENT',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          moveInDate: data.moveInDate?.toDate(),
          moveOutDate: data.moveOutDate?.toDate()
        } as Person
      })
    } catch (error) {
      console.error('Error getting people by role:', error)
      throw error
    }
  },

  // Get people by status
  async getPeopleByStatus(status: PersonStatus): Promise<Person[]> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const q = query(
        peopleRef, 
        where('status', '==', status),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || null,
          flatId: data.flatId || null,
          status: data.status || 'RESIDENT',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          moveInDate: data.moveInDate?.toDate(),
          moveOutDate: data.moveOutDate?.toDate()
        } as Person
      })
    } catch (error) {
      console.error('Error getting people by status:', error)
      throw error
    }
  },

  // Get residents by flat/unit
  async getResidentsByFlat(buildingId: string, flatNumber: string): Promise<Person[]> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const q = query(
        peopleRef, 
        where('buildingId', '==', buildingId),
        where('flatNumber', '==', flatNumber),
        where('role', '==', 'resident'),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || null,
          flatId: data.flatId || null,
          status: data.status || 'RESIDENT',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          moveInDate: data.moveInDate?.toDate(),
          moveOutDate: data.moveOutDate?.toDate()
        } as Person
      })
    } catch (error) {
      console.error('Error getting residents by flat:', error)
      throw error
    }
  },

  // Search people by name
  async searchPeopleByName(searchTerm: string): Promise<Person[]> {
    try {
      const peopleRef = collection(db, PEOPLE_COLLECTION)
      const querySnapshot = await getDocs(peopleRef)
      
      const searchLower = searchTerm.toLowerCase()
      
      return querySnapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || '',
            buildingId: data.buildingId || null,
            flatId: data.flatId || null,
            status: data.status || 'RESIDENT',
            createdByUid: data.createdByUid || 'system',
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            dateOfBirth: data.dateOfBirth?.toDate(),
            moveInDate: data.moveInDate?.toDate(),
            moveOutDate: data.moveOutDate?.toDate()
          } as Person
        })
        .filter(person => 
          person.name.toLowerCase().includes(searchLower)
        )
    } catch (error) {
      console.error('Error searching people by name:', error)
      throw error
    }
  }
}

// Named export for compatibility
export const createPerson = personService.createPerson.bind(personService)