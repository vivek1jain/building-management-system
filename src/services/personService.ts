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
    } catch (error) {
      console.error('Error getting all people:', error)
      throw error
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
    } catch (error) {
      console.error('Error getting people by building:', error)
      throw error
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
    } catch (error) {
      console.error('Error getting person by ID:', error)
      throw error
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
    } catch (error) {
      console.error('Error getting person by email:', error)
      throw error
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
        throw new Error('Failed to retrieve created person')
      }
      
      return createdPerson
    } catch (error) {
      console.error('Error creating person:', error)
      throw error
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
    } catch (error) {
      console.error('Error updating person:', error)
      throw error
    }
  },

  // Delete person
  async deletePerson(personId: string): Promise<void> {
    try {
      const docRef = doc(db, PEOPLE_COLLECTION, personId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting person:', error)
      throw error
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