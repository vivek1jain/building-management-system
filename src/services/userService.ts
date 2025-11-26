import { 
  collection, 
  getDocs, 
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { User, Building, Person } from '../types'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { handleFirebaseError } from '../utils/errorHandler'

const USERS_COLLECTION = 'users'

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date()
}

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log('👥 Fetching all users...')
    const usersRef = collection(db, USERS_COLLECTION)
    
    // Try with orderBy first, fall back to simple query if index missing
    let querySnapshot
    try {
      const q = query(usersRef, orderBy('name'))
      querySnapshot = await getDocs(q)
    } catch (indexError: any) {
      console.warn('⚠️ Index not found for name field, using unordered query')
      // Fallback to simple query without ordering
      querySnapshot = await getDocs(usersRef)
    }
    
    const users: User[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        avatar: data.avatar,
        phone: data.phone,
        isActive: data.isActive ?? true, // Default to true if not set
        deactivatedAt: data.deactivatedAt ? convertTimestamp(data.deactivatedAt) : undefined,
        deactivatedBy: data.deactivatedBy,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      })
    })
    
    // Sort in memory if we couldn't sort in the query
    users.sort((a, b) => a.name.localeCompare(b.name))
    
    console.log(`👥 Loaded ${users.length} users`)
    return users
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getAllUsers',
    })
  }
}

// Get users by role
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const users = await getAllUsers()
    return users.filter(user => user.role === role)
  } catch (error: any) {
    throw handleFirebaseError(error, {
      action: 'getUsersByRole',
      role,
    })
  }
}

// Interface for user building associations
export interface UserBuildingAssociation {
  userId: string
  buildings: {
    id: string
    name: string
    role: 'manager' | 'admin' | 'person'
  }[]
}

// Get building associations for all users
export const getUserBuildingAssociations = async (): Promise<Map<string, UserBuildingAssociation>> => {
  try {
    console.log('🏢 Fetching user-building associations...')
    const associations = new Map<string, UserBuildingAssociation>()
    
    // Fetch all buildings - continue even if this fails
    const buildingsRef = collection(db, 'buildings')
    let buildingsSnapshot
    try {
      buildingsSnapshot = await getDocs(buildingsRef)
    } catch (buildingError) {
      console.warn('⚠️ Could not fetch buildings, skipping building associations')
      return associations
    }
    
    const buildings: Building[] = []
    
    buildingsSnapshot.forEach((doc) => {
      const data = doc.data()
      buildings.push({
        id: doc.id,
        name: data.name,
        managers: data.managers || [],
        admins: data.admins || [],
        // Include other required fields with defaults
        address: data.address || '',
        code: data.code || '',
        buildingType: data.buildingType || 'residential',
        floors: data.floors || 0,
        units: data.units || 0,
        capacity: data.capacity || 0,
        area: data.area || 0,
        financialYearStart: data.financialYearStart ? fromFirestoreTimestamp(data.financialYearStart) : new Date(),
        assets: [],
        meters: [],
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt)
      })
    })
    
    // Process building managers and admins
    buildings.forEach(building => {
      // Add managers
      building.managers?.forEach(userId => {
        if (!associations.has(userId)) {
          associations.set(userId, { userId, buildings: [] })
        }
        associations.get(userId)!.buildings.push({
          id: building.id,
          name: building.name,
          role: 'manager'
        })
      })
      
      // Add admins
      building.admins?.forEach(userId => {
        if (!associations.has(userId)) {
          associations.set(userId, { userId, buildings: [] })
        }
        // Check if already added as manager
        const userAssoc = associations.get(userId)!
        const existing = userAssoc.buildings.find(b => b.id === building.id)
        if (!existing) {
          userAssoc.buildings.push({
            id: building.id,
            name: building.name,
            role: 'admin'
          })
        }
      })
    })
    
    // Fetch all people records to find user-building associations
    const peopleRef = collection(db, 'people')
    let peopleSnapshot
    try {
      peopleSnapshot = await getDocs(peopleRef)
    } catch (peopleError) {
      console.warn('⚠️ Could not fetch people records, continuing without them')
      console.log(`🏢 Loaded associations for ${associations.size} users`)
      return associations
    }
    
    peopleSnapshot.forEach((doc) => {
      const data = doc.data()
      const userId = data.uid
      const buildingId = data.buildingId
      
      if (userId && buildingId) {
        const building = buildings.find(b => b.id === buildingId)
        if (building) {
          if (!associations.has(userId)) {
            associations.set(userId, { userId, buildings: [] })
          }
          
          const userAssoc = associations.get(userId)!
          const existing = userAssoc.buildings.find(b => b.id === building.id)
          
          // Only add if not already associated as manager or admin
          if (!existing) {
            userAssoc.buildings.push({
              id: building.id,
              name: building.name,
              role: 'person'
            })
          }
        }
      }
      
      // Also check accessibleBuildingIds
      const accessibleBuildingIds = data.accessibleBuildingIds
      if (userId && accessibleBuildingIds && Array.isArray(accessibleBuildingIds)) {
        accessibleBuildingIds.forEach(buildingId => {
          const building = buildings.find(b => b.id === buildingId)
          if (building) {
            if (!associations.has(userId)) {
              associations.set(userId, { userId, buildings: [] })
            }
            
            const userAssoc = associations.get(userId)!
            const existing = userAssoc.buildings.find(b => b.id === building.id)
            
            if (!existing) {
              userAssoc.buildings.push({
                id: building.id,
                name: building.name,
                role: 'person'
              })
            }
          }
        })
      }
    })
    
    console.log(`🏢 Loaded associations for ${associations.size} users`)
    return associations
  } catch (error) {
    console.error('🚨 Error fetching user-building associations:', error)
    throw error
  }
}
