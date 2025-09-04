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
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Flat, Person, ServiceChargeDemand } from '../types'

// Get all flats for a building
export const getFlatsByBuilding = async (buildingId: string): Promise<Flat[]> => {
  try {
    const flatsRef = collection(db, 'flats')
    const q = query(flatsRef, where('buildingId', '==', buildingId))
    const querySnapshot = await getDocs(q)
    
    const flats: Flat[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      flats.push({
        id: doc.id,
        flatNumber: data.flatNumber,
        buildingId: data.buildingId,
        floor: data.floor,
        buildingBlock: data.buildingBlock,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSqFt: data.areaSqFt,
        groundRent: data.groundRent,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by flat number
    return flats.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber))
  } catch (error) {
    console.error('Error getting flats by building:', error)
    throw error
  }
}

// Get a single flat by ID
export const getFlatById = async (flatId: string): Promise<Flat | null> => {
  try {
    const flatRef = doc(db, 'flats', flatId)
    const flatSnap = await getDoc(flatRef)
    
    if (flatSnap.exists()) {
      const data = flatSnap.data()
      return {
        id: flatSnap.id,
        flatNumber: data.flatNumber,
        buildingId: data.buildingId,
        floor: data.floor,
        buildingBlock: data.buildingBlock,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSqFt: data.areaSqFt,
        groundRent: data.groundRent,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting flat by ID:', error)
    throw error
  }
}

// Create a new flat
export const createFlat = async (flatData: Omit<Flat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flat> => {
  try {
    const flatsRef = collection(db, 'flats')
    const newFlat = {
      ...flatData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(flatsRef, newFlat)
    
    return {
      id: docRef.id,
      ...flatData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating flat:', error)
    throw error
  }
}

// Update a flat
export const updateFlat = async (flatId: string, flatData: Partial<Omit<Flat, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const flatRef = doc(db, 'flats', flatId)
    await updateDoc(flatRef, {
      ...flatData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating flat:', error)
    throw error
  }
}

// Delete a flat
export const deleteFlat = async (flatId: string): Promise<void> => {
  try {
    const flatRef = doc(db, 'flats', flatId)
    await deleteDoc(flatRef)
  } catch (error) {
    console.error('Error deleting flat:', error)
    throw error
  }
}

// Get residents for a flat
export const getFlatResidents = async (flatId: string): Promise<Person[]> => {
  try {
    const peopleRef = collection(db, 'people')
    const q = query(
      peopleRef,
      where('flatId', '==', flatId)
    )
    
    const querySnapshot = await getDocs(q)
    const residents: Person[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      residents.push({
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
        moveInDate: data.moveInDate?.toDate(),
        moveOutDate: data.moveOutDate?.toDate(),
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        createdByUid: data.createdByUid,
        updatedByUid: data.updatedByUid
      })
    })
    
    return residents
  } catch (error) {
    console.error('Error getting flat residents:', error)
    throw error
  }
}

// Assign person to flat
export const assignPersonToFlat = async (personId: string, flatId: string): Promise<void> => {
  try {
    const personRef = doc(db, 'people', personId)
    await updateDoc(personRef, {
      flatId: flatId,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error assigning person to flat:', error)
    throw error
  }
}

// Remove person from flat
export const removePersonFromFlat = async (personId: string): Promise<void> => {
  try {
    const personRef = doc(db, 'people', personId)
    await updateDoc(personRef, {
      flatId: null,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error removing person from flat:', error)
    throw error
  }
}

// Get flat statistics
export const getFlatStats = async (buildingId: string) => {
  try {
    const flats = await getFlatsByBuilding(buildingId)
    
    const stats = {
      totalFlats: flats.length,
      occupiedFlats: 0,
      totalArea: 0,
      averageArea: 0,
      totalGroundRent: 0
    }
    
    flats.forEach(flat => {
      if (flat.areaSqFt) {
        stats.totalArea += flat.areaSqFt
      }
      if (flat.groundRent) {
        stats.totalGroundRent += flat.groundRent
      }
    })
    
    stats.averageArea = stats.totalFlats > 0 ? stats.totalArea / stats.totalFlats : 0
    
    // Get occupied flats count
    const peopleRef = collection(db, 'people')
    const q = query(
      peopleRef,
      where('buildingId', '==', buildingId),
      where('status', 'in', ['Owner', 'Tenant', 'Resident'])
    )
    
    const peopleSnapshot = await getDocs(q)
    const occupiedFlatIds = new Set()
    
    peopleSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.flatId) {
        occupiedFlatIds.add(data.flatId)
      }
    })
    
    stats.occupiedFlats = occupiedFlatIds.size
    
    return stats
  } catch (error) {
    console.error('Error getting flat stats:', error)
    throw error
  }
}

// Get service charge demands for a flat
export const getFlatServiceCharges = async (flatId: string): Promise<ServiceChargeDemand[]> => {
  try {
    const demandsRef = collection(db, 'serviceChargeDemands')
    const q = query(
      demandsRef,
      where('flatId', '==', flatId),
      orderBy('dueDate', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const demands: ServiceChargeDemand[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      demands.push({
        id: doc.id,
        flatId: data.flatId,
        buildingId: data.buildingId,
        flatNumber: data.flatNumber,
        residentUid: data.residentUid,
        residentName: data.residentName,
        financialQuarterDisplayString: data.financialQuarterDisplayString,
        areaSqFt: data.areaSqFt,
        rateApplied: data.rateApplied,
        baseAmount: data.baseAmount,
        groundRentAmount: data.groundRentAmount,
        penaltyAmountApplied: data.penaltyAmountApplied,
        totalAmountDue: data.totalAmountDue,
        amountPaid: data.amountPaid,
        outstandingAmount: data.outstandingAmount,
        dueDate: data.dueDate?.toDate(),
        issuedDate: data.issuedDate?.toDate(),
        status: data.status,
        paymentHistory: data.paymentHistory?.map((payment: any) => ({
          ...payment,
          paymentDate: payment.paymentDate?.toDate(),
          recordedAt: payment.recordedAt?.toDate()
        })),
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        issuedByUid: data.issuedByUid,
        penaltyAppliedAt: data.penaltyAppliedAt?.toDate(),
        invoiceGrouping: data.invoiceGrouping || 'individual',
        showBreakdown: data.showBreakdown ?? true,
        penaltyConfig: data.penaltyConfig || { enabled: false, rate: 0, gracePeriodDays: 0 },
        remindersConfig: data.remindersConfig || { enabled: false, reminderDays: [] },
        remindersSent: data.remindersSent || []
      })
    })
    
    return demands
  } catch (error) {
    console.error('Error getting flat service charges:', error)
    throw error
  }
}

// Calculate service charge for a flat
export const calculateServiceCharge = async (
  flatId: string, 
  ratePerSqFt: number
): Promise<number> => {
  try {
    const flat = await getFlatById(flatId)
    if (!flat || !flat.areaSqFt) {
      return 0
    }
    
    return flat.areaSqFt * ratePerSqFt
  } catch (error) {
    console.error('Error calculating service charge:', error)
    throw error
  }
}

// Bulk create flats
export const bulkCreateFlats = async (buildingId: string, flatsData: Omit<Flat, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> => {
  try {
    const batch = writeBatch(db)
    
    flatsData.forEach((flatData) => {
      const flatRef = doc(collection(db, 'flats'))
      batch.set(flatRef, {
        ...flatData,
        buildingId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error bulk creating flats:', error)
    throw error
  }
}

// Search flats
export const searchFlats = async (buildingId: string, searchTerm: string): Promise<Flat[]> => {
  try {
    const flats = await getFlatsByBuilding(buildingId)
    
    return flats.filter(flat => 
      flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flat.buildingBlock?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flat.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching flats:', error)
    throw error
  }
} 