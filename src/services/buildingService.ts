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
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Building, Asset, Meter, AssetStatus, UserRole } from '../types'
import { handleFirebaseError } from '../utils/errorHandler'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { getUserBuildingIds } from './peopleService'

  // Get all buildings (with optional role-based filtering)
export const getAllBuildings = async (userId?: string, userRole?: UserRole): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings')
    const querySnapshot = await getDocs(buildingsRef)
    const buildings: Building[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      buildings.push({
        id: doc.id,
        name: data.name,
        address: data.address,
        code: data.code,
        buildingType: data.buildingType,
        floors: data.floors,
        units: data.units,
        capacity: data.capacity,
        area: data.area,
        financialYearStart: data.financialYearStart ? fromFirestoreTimestamp(data.financialYearStart) : undefined,
        managers: data.managers || [],
        admins: data.admins || [],
        assets: data.assets || [],
        meters: data.meters || [],
        totalFloors: data.totalFloors,
        totalUnits: data.totalUnits,
        totalFlats: data.totalFlats,
        yearBuilt: data.yearBuilt,
        propertyType: data.propertyType,
        amenities: data.amenities || [],
        managerId: data.managerId,
        contactInfo: data.contactInfo,
        financialInfo: data.financialInfo,
        financialSettings: data.financialSettings,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt)
      })
    })
    
    // Filter buildings based on user role
    let filteredBuildings = buildings
    
    // Admins see all buildings
    if (userId && userRole && userRole !== 'admin') {
      // Non-admins see only buildings they have access to
      try {
        const userBuildingIds = await getUserBuildingIds(userId)
        filteredBuildings = buildings.filter(b => userBuildingIds.includes(b.id))
        console.log(`🏛️ Filtered buildings for ${userRole}: ${filteredBuildings.length}/${buildings.length}`)
      } catch (error) {
        console.warn('⚠️ Could not filter buildings for user, returning all:', error)
        // Fall back to showing all buildings if filtering fails
      }
    }
    
    // Sort by name in memory
    return filteredBuildings.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getAllBuildings',
        userId,
        userRole,
      })
    }
}


// Create new building
export const createBuilding = async (buildingData: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>): Promise<Building> => {
  try {
    const buildingsRef = collection(db, 'buildings')
    const newBuilding = {
      ...buildingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(buildingsRef, newBuilding)
    
    return {
      id: docRef.id,
      ...buildingData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'createBuilding',
      buildingData,
    })
  }
}

  // Update building
export const updateBuilding = async (buildingId: string, buildingData: Partial<Omit<Building, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    try {
    const buildingRef = doc(db, 'buildings', buildingId)
    await updateDoc(buildingRef, {
      ...buildingData,
        updatedAt: serverTimestamp()
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updateBuilding',
        buildingId,
      })
    }
}

  // Delete building
export const deleteBuilding = async (buildingId: string): Promise<void> => {
    try {
    const buildingRef = doc(db, 'buildings', buildingId)
    await deleteDoc(buildingRef)
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'deleteBuilding',
        buildingId,
      })
    }
}

// Get assets by building
export const getAssetsByBuilding = async (buildingId: string): Promise<Asset[]> => {
  try {
    const assetsRef = collection(db, 'assets')
    const q = query(
      assetsRef,
      where('buildingId', '==', buildingId)
    )
    
    const querySnapshot = await getDocs(q)
    const assets: Asset[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      assets.push({
        id: doc.id,
        buildingId: data.buildingId,
        name: data.name,
        category: data.category || 'OTHER',
        type: data.type,
        status: data.status || AssetStatus.OPERATIONAL,
        locationDescription: data.locationDescription,
        flatId: data.flatId,
        flatNumber: data.flatNumber,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        purchaseDate: data.purchaseDate ? fromFirestoreTimestamp(data.purchaseDate) : undefined,
        installationDate: data.installationDate ? fromFirestoreTimestamp(data.installationDate) : undefined,
        commissionedDate: data.commissionedDate ? fromFirestoreTimestamp(data.commissionedDate) : undefined,
        decommissionedDate: data.decommissionedDate ? fromFirestoreTimestamp(data.decommissionedDate) : undefined,
        warrantyExpiryDate: data.warrantyExpiryDate ? fromFirestoreTimestamp(data.warrantyExpiryDate) : undefined,
        nextServiceDate: data.nextServiceDate ? fromFirestoreTimestamp(data.nextServiceDate) : undefined,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        notes: data.notes,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt),
        createdByUid: data.createdByUid
      })
    })
    
    // Sort by name in memory
    return assets.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getAssetsByBuilding',
      buildingId,
    })
  }
}


// Create new asset
export const createAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> => {
  try {
    const assetsRef = collection(db, 'assets')
    const newAsset = {
        ...assetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(assetsRef, newAsset)
    
    return {
      id: docRef.id,
      ...assetData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'createAsset',
        assetData,
      })
    }
}

// Update asset
export const updateAsset = async (assetId: string, assetData: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const assetRef = doc(db, 'assets', assetId)
    await updateDoc(assetRef, {
      ...assetData,
        updatedAt: serverTimestamp()
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updateAsset',
        assetId,
      })
    }
}

// Delete asset
export const deleteAsset = async (assetId: string): Promise<void> => {
    try {
    const assetRef = doc(db, 'assets', assetId)
    await deleteDoc(assetRef)
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'deleteAsset',
        assetId,
      })
    }
}

// Get meters by building
export const getMetersByBuilding = async (buildingId: string): Promise<Meter[]> => {
  try {
    const metersRef = collection(db, 'meters')
    const q = query(
      metersRef,
      where('buildingId', '==', buildingId)
    )
    
    const querySnapshot = await getDocs(q)
    const meters: Meter[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      meters.push({
        id: doc.id,
        buildingId: data.buildingId,
        unitId: data.unitId,
        type: data.type,
        meterNumber: data.meterNumber,
        currentReading: data.currentReading,
        lastReading: data.lastReading,
        lastReadingDate: data.lastReadingDate ? fromFirestoreTimestamp(data.lastReadingDate) : undefined,
        threshold: data.threshold,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt)
      })
    })
    
    // Sort by type and meter number in memory
    return meters.sort((a, b) => {
      const typeComparison = a.type.localeCompare(b.type)
      if (typeComparison !== 0) return typeComparison
      return a.meterNumber.localeCompare(b.meterNumber)
    })
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getMetersByBuilding',
      buildingId,
    })
  }
}


  // Get building statistics
export const getBuildingStats = async (buildingId: string) => {
  try {
    const [assets, meters] = await Promise.all([
      getAssetsByBuilding(buildingId),
      getMetersByBuilding(buildingId)
    ])
    
    const stats = {
      totalAssets: assets.length,
      assetsNeedingRepair: assets.filter(asset => 
        asset.status === AssetStatus.NEEDS_REPAIR
      ).length,
      maintenanceDue: assets.filter(asset => 
        asset.nextServiceDate && asset.nextServiceDate <= new Date()
      ).length,
      metersCount: meters.length,
      thresholdAlerts: meters.filter(meter => 
        meter.currentReading > meter.threshold
      ).length
    }
    
    return stats
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getBuildingStats',
        buildingId,
      })
    }
}

