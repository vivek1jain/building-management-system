import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types'

/**
 * Hook for checking user role-based access permissions
 */
export const useRoleAccess = () => {
  const { currentUser } = useAuth()

  /**
   * Check if the current user has one of the allowed roles
   */
  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false
    return allowedRoles.includes(currentUser.role)
  }

  /**
   * Check if the current user is an admin
   */
  const isAdmin = (): boolean => {
    return currentUser?.role === 'admin'
  }

  /**
   * Check if the current user is a manager
   */
  const isManager = (): boolean => {
    return currentUser?.role === 'manager'
  }

  /**
   * Check if the current user is a resident
   */
  const isResident = (): boolean => {
    return currentUser?.role === 'resident'
  }

  /**
   * Check if the current user is a supplier
   */
  const isSupplier = (): boolean => {
    return currentUser?.role === 'supplier'
  }

  /**
   * Check if the current user has admin or manager privileges
   */
  const canManage = (): boolean => {
    return hasRole(['admin', 'manager'])
  }

  return {
    hasRole,
    isAdmin,
    isManager,
    isResident,
    isSupplier,
    canManage,
    currentRole: currentUser?.role
  }
}
