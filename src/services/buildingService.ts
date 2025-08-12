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
import { Building, Asset, Meter, AssetStatus } from '../types'
import { mockBuildings, mockAssets } from './mockData'

  // Get all buildings
export const getAllBuildings = async (): Promise<Building[]> => {
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
        financialYearStart: data.financialYearStart?.toDate(),
        managers: data.managers || [],
        admins: data.admins || [],
        assets: data.assets || [],
        meters: data.meters || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by name in memory
    return buildings.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Error getting all buildings:', error)
      throw error
    }
}

  // Get buildings by manager
export const getBuildingsByManager = async (managerId: string): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings')
    const q = query(
      buildingsRef,
      where('managers', 'array-contains', managerId)
    )
    
    const querySnapshot = await getDocs(q)
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
        financialYearStart: data.financialYearStart?.toDate(),
        managers: data.managers || [],
        admins: data.admins || [],
        assets: data.assets || [],
        meters: data.meters || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by name in memory
    return buildings.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Error getting buildings by manager:', error)
      throw error
    }
}

// Get building by ID
export const getBuildingById = async (buildingId: string): Promise<Building | null> => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId)
    const buildingSnap = await getDoc(buildingRef)
    
    if (buildingSnap.exists()) {
      const data = buildingSnap.data()
      return {
        id: buildingSnap.id,
        name: data.name,
        address: data.address,
        code: data.code,
        buildingType: data.buildingType,
        floors: data.floors,
        units: data.units,
        capacity: data.capacity,
        area: data.area,
        financialYearStart: data.financialYearStart?.toDate(),
        managers: data.managers || [],
        admins: data.admins || [],
        assets: data.assets || [],
        meters: data.meters || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting building by ID:', error)
    throw error
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
  } catch (error) {
    console.error('Error creating building:', error)
    throw error
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
    } catch (error) {
      console.error('Error updating building:', error)
      throw error
    }
}

  // Delete building
export const deleteBuilding = async (buildingId: string): Promise<void> => {
    try {
    const buildingRef = doc(db, 'buildings', buildingId)
    await deleteDoc(buildingRef)
    } catch (error) {
      console.error('Error deleting building:', error)
      throw error
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
        type: data.type,
        status: data.status || AssetStatus.OPERATIONAL,
        locationDescription: data.locationDescription,
        flatId: data.flatId,
        flatNumber: data.flatNumber,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        purchaseDate: data.purchaseDate?.toDate(),
        installationDate: data.installationDate?.toDate(),
        commissionedDate: data.commissionedDate?.toDate(),
        decommissionedDate: data.decommissionedDate?.toDate(),
        warrantyExpiryDate: data.warrantyExpiryDate?.toDate(),
        nextServiceDate: data.nextServiceDate?.toDate(),
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdByUid: data.createdByUid
      })
    })
    
    // Sort by name in memory
    return assets.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error getting assets by building:', error)
    throw error
  }
}

// Get asset by ID
export const getAssetById = async (assetId: string): Promise<Asset | null> => {
  try {
    const assetRef = doc(db, 'assets', assetId)
    const assetSnap = await getDoc(assetRef)
    
    if (assetSnap.exists()) {
      const data = assetSnap.data()
      return {
        id: assetSnap.id,
        buildingId: data.buildingId,
        name: data.name,
        type: data.type,
        status: data.status || AssetStatus.OPERATIONAL,
        locationDescription: data.locationDescription,
        flatId: data.flatId,
        flatNumber: data.flatNumber,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        purchaseDate: data.purchaseDate?.toDate(),
        installationDate: data.installationDate?.toDate(),
        commissionedDate: data.commissionedDate?.toDate(),
        decommissionedDate: data.decommissionedDate?.toDate(),
        warrantyExpiryDate: data.warrantyExpiryDate?.toDate(),
        nextServiceDate: data.nextServiceDate?.toDate(),
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdByUid: data.createdByUid
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting asset by ID:', error)
    throw error
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
    } catch (error) {
      console.error('Error creating asset:', error)
      throw error
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
    } catch (error) {
      console.error('Error updating asset:', error)
      throw error
    }
}

// Delete asset
export const deleteAsset = async (assetId: string): Promise<void> => {
    try {
    const assetRef = doc(db, 'assets', assetId)
    await deleteDoc(assetRef)
    } catch (error) {
      console.error('Error deleting asset:', error)
      throw error
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
        lastReadingDate: data.lastReadingDate?.toDate(),
        threshold: data.threshold,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    // Sort by type and meter number in memory
    return meters.sort((a, b) => {
      const typeComparison = a.type.localeCompare(b.type)
      if (typeComparison !== 0) return typeComparison
      return a.meterNumber.localeCompare(b.meterNumber)
    })
  } catch (error) {
    console.error('Error getting meters by building:', error)
    throw error
  }
}

// Get meter by ID
export const getMeterById = async (meterId: string): Promise<Meter | null> => {
  try {
    const meterRef = doc(db, 'meters', meterId)
    const meterSnap = await getDoc(meterRef)
    
    if (meterSnap.exists()) {
      const data = meterSnap.data()
      return {
        id: meterSnap.id,
        buildingId: data.buildingId,
        unitId: data.unitId,
        type: data.type,
        meterNumber: data.meterNumber,
        currentReading: data.currentReading,
        lastReading: data.lastReading,
        lastReadingDate: data.lastReadingDate?.toDate(),
        threshold: data.threshold,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting meter by ID:', error)
    throw error
  }
}

// Create new meter
export const createMeter = async (meterData: Omit<Meter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meter> => {
  try {
    const metersRef = collection(db, 'meters')
    const newMeter = {
        ...meterData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(metersRef, newMeter)
    
    return {
      id: docRef.id,
      ...meterData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    } catch (error) {
      console.error('Error creating meter:', error)
      throw error
    }
}

// Update meter
export const updateMeter = async (meterId: string, meterData: Partial<Omit<Meter, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const meterRef = doc(db, 'meters', meterId)
    await updateDoc(meterRef, {
      ...meterData,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating meter:', error)
      throw error
    }
}

// Delete meter
export const deleteMeter = async (meterId: string): Promise<void> => {
    try {
    const meterRef = doc(db, 'meters', meterId)
    await deleteDoc(meterRef)
    } catch (error) {
      console.error('Error deleting meter:', error)
      throw error
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
    } catch (error) {
      console.error('Error getting building stats:', error)
      throw error
    }
}

// Search buildings
export const searchBuildings = async (searchTerm: string): Promise<Building[]> => {
  try {
    const buildings = await getAllBuildings()
    
    return buildings.filter(building => 
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching buildings:', error)
    throw error
  }
} 