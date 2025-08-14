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
import { Asset, AssetCategory, AssetStatus } from '../types'

// Get all assets for a building
export const getAssetsByBuilding = async (buildingId: string): Promise<Asset[]> => {
  try {
    const assetsRef = collection(db, 'assets')
    const q = query(assetsRef, where('buildingId', '==', buildingId), orderBy('name'))
    const querySnapshot = await getDocs(q)
    
    const assets: Asset[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      assets.push({
        id: doc.id,
        name: data.name,
        buildingId: data.buildingId,
        category: data.category || AssetCategory.OTHER,
        type: data.type,
        status: data.status,
        locationDescription: data.locationDescription,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        installationDate: data.installationDate?.toDate() || null,
        warrantyExpiryDate: data.warrantyExpiryDate?.toDate() || null,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdByUid: data.createdByUid
      })
    })
    
    return assets
  } catch (error) {
    console.error('Error getting assets by building:', error)
    // Fallback to mock data when Firebase permissions are denied
    const { mockAssets } = await import('./mockData')
    return mockAssets.filter(asset => asset.buildingId === buildingId) as Asset[]
  }
}

// Get a single asset by ID
export const getAssetById = async (assetId: string): Promise<Asset | null> => {
  try {
    const assetRef = doc(db, 'assets', assetId)
    const assetSnap = await getDoc(assetRef)
    
    if (assetSnap.exists()) {
      const data = assetSnap.data()
      return {
        id: assetSnap.id,
        name: data.name,
        buildingId: data.buildingId,
        category: data.category || AssetCategory.OTHER,
        type: data.type,
        status: data.status,
        locationDescription: data.locationDescription,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        installationDate: data.installationDate?.toDate() || null,
        warrantyExpiryDate: data.warrantyExpiryDate?.toDate() || null,
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

// Create a new asset
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

// Update an asset
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

// Delete an asset
export const deleteAsset = async (assetId: string): Promise<void> => {
  try {
    const assetRef = doc(db, 'assets', assetId)
    await deleteDoc(assetRef)
  } catch (error) {
    console.error('Error deleting asset:', error)
    throw error
  }
}

// Get asset statistics
export const getAssetStats = async (buildingId: string) => {
  try {
    const assets = await getAssetsByBuilding(buildingId)
    
    const stats = {
      totalAssets: assets.length,
      operationalAssets: assets.filter(asset => asset.status === AssetStatus.OPERATIONAL).length,
      maintenanceAssets: assets.filter(asset => asset.status === AssetStatus.NEEDS_MAINTENANCE).length,
      retiredAssets: assets.filter(asset => asset.status === AssetStatus.DECOMMISSIONED).length
    }
    
    return stats
  } catch (error) {
    console.error('Error getting asset stats:', error)
    throw error
  }
}

// Search assets
export const searchAssets = async (buildingId: string, searchTerm: string): Promise<Asset[]> => {
  try {
    const assets = await getAssetsByBuilding(buildingId)
    
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.locationDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching assets:', error)
    throw error
  }
}

export const assetService = {
  getAssetsByBuilding,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStats,
  searchAssets
}
