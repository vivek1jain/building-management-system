import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { Supplier, Quote, QuoteForm } from '../types'

class SupplierService {
  private suppliersCollection = collection(db, 'suppliers')
  private quotesCollection = collection(db, 'quotes')

  // Get all suppliers
  async getSuppliers(): Promise<Supplier[]> {
    try {
      console.log('Fetching suppliers from Firestore...')
      const querySnapshot = await getDocs(this.suppliersCollection)
      console.log('Suppliers fetched:', querySnapshot.docs.length)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Supplier[]
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      throw new Error('Failed to fetch suppliers')
    }
  }

  // Get supplier by ID
  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const docRef = doc(this.suppliersCollection, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        } as Supplier
      }
      return null
    } catch (error) {
      console.error('Error fetching supplier:', error)
      throw new Error('Failed to fetch supplier')
    }
  }

  // Create new supplier
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Creating supplier:', supplierData)
      const docRef = await addDoc(this.suppliersCollection, {
        ...supplierData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('Supplier created with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error creating supplier:', error)
      throw new Error('Failed to create supplier')
    }
  }

  // Update supplier
  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    try {
      const docRef = doc(this.suppliersCollection, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating supplier:', error)
      throw new Error('Failed to update supplier')
    }
  }

  // Get suppliers by specialty
  async getSuppliersBySpecialty(specialty: string): Promise<Supplier[]> {
    try {
      const q = query(
        this.suppliersCollection,
        where('specialties', 'array-contains', specialty),
        where('isActive', '==', true)
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Supplier[]
    } catch (error) {
      console.error('Error fetching suppliers by specialty:', error)
      throw new Error('Failed to fetch suppliers by specialty')
    }
  }

  // Request quotes from suppliers
  async requestQuotes(ticketId: string, supplierIds: string[], requestedBy: string): Promise<void> {
    try {
      const quoteRequests = supplierIds.map(supplierId => ({
        ticketId,
        supplierId,
        requestedBy,
        status: 'requested',
        requestedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }))

      // Add quote requests to Firestore
      for (const request of quoteRequests) {
        await addDoc(this.quotesCollection, request)
      }
    } catch (error) {
      console.error('Error requesting quotes:', error)
      throw new Error('Failed to request quotes')
    }
  }

  // Submit quote
  async submitQuote(ticketId: string, supplierId: string, quoteData: QuoteForm, attachments: File[] = []): Promise<string> {
    try {
      // Upload attachments if any
      const attachmentUrls: string[] = []
      for (const file of attachments) {
        const storageRef = ref(storage, `quotes/${ticketId}/${supplierId}/${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        attachmentUrls.push(url)
      }

      // Create quote document
      const quoteDoc = {
        ticketId,
        supplierId,
        amount: quoteData.amount,
        currency: quoteData.currency,
        description: quoteData.description,
        terms: quoteData.terms,
        validUntil: quoteData.validUntil,
        status: 'pending',
        submittedAt: serverTimestamp(),
        attachments: attachmentUrls
      }

      const docRef = await addDoc(this.quotesCollection, quoteDoc)
      return docRef.id
    } catch (error) {
      console.error('Error submitting quote:', error)
      throw new Error('Failed to submit quote')
    }
  }

  // Get quotes for a ticket
  async getQuotesForTicket(ticketId: string): Promise<Quote[]> {
    try {
      const q = query(
        this.quotesCollection,
        where('ticketId', '==', ticketId),
        orderBy('submittedAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        validUntil: doc.data().validUntil?.toDate() || new Date()
      })) as Quote[]
    } catch (error) {
      console.error('Error fetching quotes:', error)
      throw new Error('Failed to fetch quotes')
    }
  }

  // Update quote status
  async updateQuoteStatus(quoteId: string, status: 'pending' | 'accepted' | 'declined' | 'expired'): Promise<void> {
    try {
      const docRef = doc(this.quotesCollection, quoteId)
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating quote status:', error)
      throw new Error('Failed to update quote status')
    }
  }

  // Subscribe to suppliers changes
  subscribeToSuppliers(callback: (suppliers: Supplier[]) => void) {
    return onSnapshot(this.suppliersCollection, (snapshot) => {
      const suppliers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Supplier[]
      callback(suppliers)
    })
  }

  // Subscribe to quotes for a ticket
  subscribeToQuotes(ticketId: string, callback: (quotes: Quote[]) => void) {
    const q = query(
      this.quotesCollection,
      where('ticketId', '==', ticketId),
      orderBy('submittedAt', 'desc')
    )
    
    return onSnapshot(q, (snapshot) => {
      const quotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        validUntil: doc.data().validUntil?.toDate() || new Date()
      })) as Quote[]
      callback(quotes)
    })
  }
}

export const supplierService = new SupplierService()