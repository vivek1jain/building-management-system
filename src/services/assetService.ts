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
import { Asset, AssetStatus, AssetCategory } from '../types'

const ASSETS_COLLECTION = 'assets'

export const assetService = {
  // Get all assets for a building
  async getAssetsByBuilding(buildingId: string): Promise<Asset[]> {
    try {
      const assetsRef = collection(db, ASSETS_COLLECTION)
      const q = query(
        assetsRef, 
        where('buildingId', '==', buildingId),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || '',
          category: data.category || 'OTHER',
          status: data.status || 'OPERATIONAL',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
          nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
          purchaseDate: data.purchaseDate?.toDate(),
          warrantyExpiry: data.warrantyExpiry?.toDate()
        } as Asset
      })
    } catch (error) {
      console.error('Error getting assets by building:', error)
      throw error
    }
  },

  // Get all assets across all buildings
  async getAllAssets(): Promise<Asset[]> {
    try {
      const assetsRef = collection(db, ASSETS_COLLECTION)
      const q = query(assetsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || '',
          category: data.category || 'OTHER',
          status: data.status || 'OPERATIONAL',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
          nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
          purchaseDate: data.purchaseDate?.toDate(),
          warrantyExpiry: data.warrantyExpiry?.toDate()
        } as Asset
      })
    } catch (error) {
      console.error('Error getting all assets:', error)
      throw error
    }
  },

  // Get asset by ID
  async getAssetById(assetId: string): Promise<Asset | null> {
    try {
      const docRef = doc(db, ASSETS_COLLECTION, assetId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      const data = docSnap.data()
      return {
        id: docSnap.id,
        name: data.name || '',
        buildingId: data.buildingId || '',
        category: data.category || 'OTHER',
        status: data.status || 'OPERATIONAL',
        createdByUid: data.createdByUid || 'system',
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
        nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
        purchaseDate: data.purchaseDate?.toDate(),
        warrantyExpiry: data.warrantyExpiry?.toDate()
      } as Asset
    } catch (error) {
      console.error('Error getting asset by ID:', error)
      throw error
    }
  },

  // Create new asset
  async createAsset(assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    try {
      const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
        ...assetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      const createdAsset = await this.getAssetById(docRef.id)
      if (!createdAsset) {
        throw new Error('Failed to retrieve created asset')
      }
      
      return createdAsset
    } catch (error) {
      console.error('Error creating asset:', error)
      throw error
    }
  },

  // Update asset
  async updateAsset(assetId: string, updates: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const docRef = doc(db, ASSETS_COLLECTION, assetId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating asset:', error)
      throw error
    }
  },

  // Delete asset
  async deleteAsset(assetId: string): Promise<void> {
    try {
      const docRef = doc(db, ASSETS_COLLECTION, assetId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting asset:', error)
      throw error
    }
  },

  // Get assets by category
  async getAssetsByCategory(buildingId: string, category: AssetCategory): Promise<Asset[]> {
    try {
      const assetsRef = collection(db, ASSETS_COLLECTION)
      const q = query(
        assetsRef, 
        where('buildingId', '==', buildingId),
        where('category', '==', category),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || '',
          category: data.category || 'OTHER',
          status: data.status || 'OPERATIONAL',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
          nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
          purchaseDate: data.purchaseDate?.toDate(),
          warrantyExpiry: data.warrantyExpiry?.toDate()
        } as Asset
      })
    } catch (error) {
      console.error('Error getting assets by category:', error)
      throw error
    }
  },

  // Get assets by status
  async getAssetsByStatus(buildingId: string, status: AssetStatus): Promise<Asset[]> {
    try {
      const assetsRef = collection(db, ASSETS_COLLECTION)
      const q = query(
        assetsRef, 
        where('buildingId', '==', buildingId),
        where('status', '==', status),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          buildingId: data.buildingId || '',
          category: data.category || 'OTHER',
          status: data.status || 'OPERATIONAL',
          createdByUid: data.createdByUid || 'system',
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
          nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
          purchaseDate: data.purchaseDate?.toDate(),
          warrantyExpiry: data.warrantyExpiry?.toDate()
        } as Asset
      })
    } catch (error) {
      console.error('Error getting assets by status:', error)
      throw error
    }
  },

  // Get assets due for maintenance
  async getAssetsDueForMaintenance(buildingId: string, daysAhead = 30): Promise<Asset[]> {
    try {
      const assets = await this.getAssetsByBuilding(buildingId)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead)
      
      return assets.filter(asset => 
        asset.nextMaintenanceDate && 
        asset.nextMaintenanceDate <= cutoffDate &&
        asset.status !== AssetStatus.DECOMMISSIONED
      )
    } catch (error) {
      console.error('Error getting assets due for maintenance:', error)
      throw error
    }
  }
}

// Named exports for compatibility
export const createAsset = assetService.createAsset.bind(assetService)
export const getAllAssets = assetService.getAllAssets.bind(assetService)
export const getAssetsByBuilding = assetService.getAssetsByBuilding.bind(assetService)
export const getAssetById = assetService.getAssetById.bind(assetService)
export const updateAsset = assetService.updateAsset.bind(assetService)
export const deleteAsset = assetService.deleteAsset.bind(assetService)