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
import { BuildingEvent } from '../types'

const EVENTS_COLLECTION = 'buildingEvents'

export const eventService = {
  // Get all events
  async getEvents(): Promise<BuildingEvent[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        orderBy('startDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BuildingEvent[]
    } catch (error) {
      console.error('Error fetching events:', error)
      throw new Error('Failed to fetch events')
    }
  },

  // Get event by ID
  async getEventById(id: string): Promise<BuildingEvent | null> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as BuildingEvent
      }
      return null
    } catch (error) {
      console.error('Error fetching event:', error)
      throw new Error('Failed to fetch event')
    }
  },

  // Get events by ticket ID
  async getEventsByTicketId(ticketId: string): Promise<BuildingEvent[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('ticketId', '==', ticketId),
        orderBy('startDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BuildingEvent[]
    } catch (error) {
      console.error('Error fetching events by ticket ID:', error)
      throw new Error('Failed to fetch events for ticket')
    }
  },

  // Get events by user ID (assigned to)
  async getEventsByUserId(userId: string): Promise<BuildingEvent[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('assignedTo', 'array-contains', userId),
        orderBy('startDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BuildingEvent[]
    } catch (error) {
      console.error('Error fetching events by user ID:', error)
      throw new Error('Failed to fetch events for user')
    }
  },

  // Create new event
  async createEvent(event: Omit<BuildingEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<BuildingEvent> {
    try {
      const eventData = {
        ...event,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventData)
      
      return {
        id: docRef.id,
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as BuildingEvent
    } catch (error) {
      console.error('Error creating event:', error)
      throw new Error('Failed to create event')
    }
  },

  // Update event
  async updateEvent(id: string, updates: Partial<BuildingEvent>): Promise<void> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating event:', error)
      throw new Error('Failed to update event')
    }
  },

  // Delete event
  async deleteEvent(id: string): Promise<void> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting event:', error)
      throw new Error('Failed to delete event')
    }
  },

  // Get upcoming events (events starting from today)
  async getUpcomingEvents(): Promise<BuildingEvent[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('startDate', '>=', today),
        orderBy('startDate', 'asc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BuildingEvent[]
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
      throw new Error('Failed to fetch upcoming events')
    }
  },

  // Get events by date range
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<BuildingEvent[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('startDate', '>=', startDate),
        where('startDate', '<=', endDate),
        orderBy('startDate', 'asc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BuildingEvent[]
    } catch (error) {
      console.error('Error fetching events by date range:', error)
      throw new Error('Failed to fetch events by date range')
    }
  }
} 