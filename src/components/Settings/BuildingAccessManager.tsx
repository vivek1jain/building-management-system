import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Building2, Plus, X, Trash2, Edit } from 'lucide-react'
import { User, UserRole, Person, Building } from '../../types'
import { getUserBuildingAccess, addUserBuildingAccess, removeUserBuildingAccess, updateUserBuildingRole } from '../../services/peopleService'
import { useBuilding } from '../../contexts/BuildingContext'

interface BuildingAccessManagerProps {
  isOpen: boolean
  onClose: () => void
  user: User
  currentUser: any
  addNotification: (notification: any) => void
  onAccessUpdated: () => void
}

export const BuildingAccessManager: React.FC<BuildingAccessManagerProps> = ({
  isOpen,
  onClose,
  user,
  currentUser,
  addNotification,
  onAccessUpdated
}) => {
  const { buildings } = useBuilding()
  const [userAccess, setUserAccess] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)

  useEffect(() => {
    if (isOpen) {
      loadUserAccess()
    }
  }, [isOpen, user.id])

  const loadUserAccess = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading building access for user:', user.id)
      const access = await getUserBuildingAccess(user.id)
      setUserAccess(access)
      console.log('✅ Access loaded:', access.length)
    } catch (error) {
      console.error('🚨 Error loading user access:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load building access',
        type: 'error',
        userId: currentUser?.id
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccess = async () => {
    if (!selectedBuildingId) return

    try {
      setAdding(true)
      console.log('➕ Adding building access...')
      
      await addUserBuildingAccess(
        user.id,
        user.name,
        user.email,
        selectedBuildingId,
        selectedRole,
        currentUser.id
      )

      addNotification({
        title: 'Success',
        message: 'Building access added successfully',
        type: 'success',
        userId: currentUser.id
      })

      setSelectedBuildingId('')
      setSelectedRole(user.role)
      await loadUserAccess()
      onAccessUpdated()
    } catch (error: any) {
      console.error('🚨 Error adding access:', error)
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to add building access',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAccess = async (personId: string, buildingName: string) => {
    if (!window.confirm(`Remove access to ${buildingName}?`)) {
      return
    }

    try {
      console.log('🗑️ Removing building access...')
      await removeUserBuildingAccess(personId)

      addNotification({
        title: 'Success',
        message: `Access to ${buildingName} removed`,
        type: 'success',
        userId: currentUser.id
      })

      await loadUserAccess()
      onAccessUpdated()
    } catch (error) {
      console.error('🚨 Error removing access:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to remove building access',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleChangeRole = async (personId: string, newRole: UserRole, buildingName: string) => {
    try {
      console.log('✏️ Changing role...')
      await updateUserBuildingRole(personId, newRole, currentUser.id)

      addNotification({
        title: 'Success',
        message: `Role updated for ${buildingName}`,
        type: 'success',
        userId: currentUser.id
      })

      await loadUserAccess()
      onAccessUpdated()
    } catch (error) {
      console.error('🚨 Error changing role:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update role',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const getBuildingName = (buildingId: string): string => {
    const building = buildings.find(b => b.id === buildingId)
    return building?.name || 'Unknown Building'
  }

  const getAvailableBuildings = () => {
    const accessedBuildingIds = userAccess.map(a => a.buildingId)
    return buildings.filter(b => !accessedBuildingIds.includes(b.id))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100'
      case 'manager': return 'text-primary-600 bg-blue-100'
      case 'supplier': return 'text-yellow-600 bg-yellow-100'
      case 'resident': return 'text-success-600 bg-green-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal" style={{ zIndex: 1450 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Manage Building Access</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {user.name} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add New Access */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-neutral-900 mb-3">Add Building Access</h4>
          <div className="flex gap-3">
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={adding || getAvailableBuildings().length === 0}
            >
              <option value="">Select a building...</option>
              {getAvailableBuildings().map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-40 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={adding}
            >
              <option value="resident">Resident</option>
              <option value="manager">Manager</option>
              <option value="supplier">Supplier</option>
              {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
            </select>

            <button
              onClick={handleAddAccess}
              disabled={adding || !selectedBuildingId || getAvailableBuildings().length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Access
                </>
              )}
            </button>
          </div>
          {getAvailableBuildings().length === 0 && (
            <p className="text-xs text-neutral-500 mt-2">User has access to all buildings</p>
          )}
        </div>

        {/* Current Access List */}
        <div>
          <h4 className="text-sm font-medium text-neutral-900 mb-3">
            Current Access ({userAccess.length})
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : userAccess.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-neutral-600">No building access assigned</p>
              <p className="text-sm text-neutral-500 mt-1">Add access using the form above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userAccess.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="font-medium text-neutral-900">
                        {access.buildingId ? getBuildingName(access.buildingId) : 'Unknown'}
                      </p>
                      {access.flatNumber && (
                        <p className="text-xs text-neutral-500">Flat: {access.flatNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={access.role || user.role}
                      onChange={(e) => handleChangeRole(access.id, e.target.value as UserRole, getBuildingName(access.buildingId!))}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 ${getRoleColor(access.role || user.role)}`}
                    >
                      <option value="resident">Resident</option>
                      <option value="manager">Manager</option>
                      <option value="supplier">Supplier</option>
                      {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
                    </select>

                    <button
                      onClick={() => handleRemoveAccess(access.id, getBuildingName(access.buildingId!))}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Remove Access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
