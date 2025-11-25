import { collection, query, where, Query, DocumentData } from 'firebase/firestore'
import { db } from '../firebase/config'
import { UserRole } from '../types'

/**
 * Data Access Service
 * Provides role-based query scoping to ensure users only see data they're authorized to access
 */

export interface DataAccessContext {
  userId: string
  userRole: UserRole
  buildingId?: string
  flatId?: string
}

/**
 * Scopes a Firestore query based on user role and ownership
 */
export const scopeQuery = (
  collectionName: string,
  context: DataAccessContext,
  baseQuery?: Query<DocumentData>
): Query<DocumentData> => {
  const collectionRef = collection(db, collectionName)
  let scopedQuery: Query<DocumentData> = baseQuery || collectionRef

  // Admin and manager roles see all data (no scoping)
  if (context.userRole === 'admin' || context.userRole === 'manager') {
    return scopedQuery
  }

  // Scope based on collection and role
  switch (collectionName) {
    case 'tickets':
      // Residents and suppliers only see their own tickets
      if (context.userRole === 'resident') {
        scopedQuery = query(collectionRef, where('requestedBy', '==', context.userId))
      } else if (context.userRole === 'supplier') {
        scopedQuery = query(collectionRef, where('assignedTo', '==', context.userId))
      }
      break

    case 'people':
      // Residents only see their own person records
      if (context.userRole === 'resident') {
        scopedQuery = query(collectionRef, where('uid', '==', context.userId))
      }
      break

    case 'flats':
      // Residents only see their own flat(s)
      if (context.userRole === 'resident' && context.flatId) {
        scopedQuery = query(collectionRef, where('id', '==', context.flatId))
      }
      break

    case 'expenses':
    case 'income':
      // Residents only see expenses/income related to their flat
      if (context.userRole === 'resident' && context.flatId) {
        scopedQuery = query(collectionRef, where('flatId', '==', context.flatId))
      }
      break

    case 'events':
      // Everyone can see events (no scoping needed)
      break

    case 'suppliers':
      // Suppliers see only their own record
      if (context.userRole === 'supplier') {
        scopedQuery = query(collectionRef, where('uid', '==', context.userId))
      }
      break

    default:
      // Default: scope to user's building if available
      if (context.buildingId) {
        scopedQuery = query(collectionRef, where('buildingId', '==', context.buildingId))
      }
  }

  return scopedQuery
}

/**
 * Check if a user can view all records in a collection (vs only their own)
 */
export const canViewAll = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager'
}

/**
 * Check if a user owns a specific record
 */
export const isOwner = (
  record: any,
  userId: string,
  ownershipField: string = 'createdBy'
): boolean => {
  return record && record[ownershipField] === userId
}

/**
 * Filter array of records based on ownership
 */
export const filterOwnedRecords = <T extends Record<string, any>>(
  records: T[],
  context: DataAccessContext,
  ownershipField: string = 'createdBy'
): T[] => {
  // Admin and manager see all
  if (canViewAll(context.userRole)) {
    return records
  }

  // Filter to only owned records
  return records.filter(record => isOwner(record, context.userId, ownershipField))
}

/**
 * Get the appropriate collection scope description for UI display
 */
export const getScopeDescription = (
  collectionName: string,
  userRole: UserRole
): string => {
  if (canViewAll(userRole)) {
    return 'All Records'
  }

  switch (collectionName) {
    case 'tickets':
      return userRole === 'resident' ? 'My Tickets' : 'Assigned Tickets'
    case 'expenses':
      return 'My Expenses'
    case 'income':
      return 'My Payments'
    case 'flats':
      return 'My Flat'
    case 'people':
      return 'My Profile'
    default:
      return 'My Records'
  }
}
