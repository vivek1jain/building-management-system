import { 
  Users as UsersIcon, 
  Search, 
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
  Filter,
  Edit,
  UserX,
  UserCheck,
  AlertTriangle,
  Trash2,
  UserPlus,
  Clock,
  XCircle,
  Copy
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getAllUsers, getUserBuildingAssociations, UserBuildingAssociation } from '../../services/userService'
import { updateUser, updateUserStatus, deleteUser, canManageUsers, canEditUser, canDeleteUser } from '../../services/userManagementService'
import { getAllInvitations, cancelInvitation, generateInvitationLink } from '../../services/invitationService'
import { User, UserRole, UserInvitation } from '../../types'
import { Dropdown } from '../UI'
import { InviteUserModal } from './InviteUserModal'
import { BuildingAccessManager } from './BuildingAccessManager'

interface UserManagementProps {
  users?: any[]
  setUsers?: (users: any[]) => void
  buildings?: any[]
  addNotification: (notification: any) => void
  currentUser: any
}

export const UserManagement: React.FC<UserManagementProps> = ({ 
  buildings,
  addNotification, 
  currentUser 
}) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showAccessManager, setShowAccessManager] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [buildingAssociations, setBuildingAssociations] = useState<Map<string, UserBuildingAssociation>>(new Map())
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' as UserRole, isActive: true })
  const [saving, setSaving] = useState(false)
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)

  useEffect(() => {
    loadUsers()
    loadInvitations()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('👥 Loading users for management...')
      const [usersData, associations] = await Promise.all([
        getAllUsers(),
        getUserBuildingAssociations()
      ])
      console.log('👥 Users loaded:', usersData.length)
      console.log('🏢 Associations loaded:', associations.size)
      setUsers(usersData)
      setBuildingAssociations(associations)
    } catch (error) {
      console.error('🚨 Error loading users:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load users',
        type: 'error',
        userId: currentUser?.id
      })
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true)
      console.log('📧 Loading invitations...')
      const invitationsData = await getAllInvitations()
      console.log('📧 Invitations loaded:', invitationsData.length)
      setInvitations(invitationsData)
    } catch (error) {
      console.error('🚨 Error loading invitations:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load invitations',
        type: 'error',
        userId: currentUser?.id
      })
    } finally {
      setLoadingInvitations(false)
    }
  }

  const handleViewUser = (user: User) => {
    console.log('View user clicked:', user.id)
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEditUser = (user: User) => {
    console.log('Edit user clicked:', user.id)
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive ?? true
    })
    setShowEditModal(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser || !currentUser) return

    try {
      setSaving(true)
      console.log('💾 Saving user changes...')

      await updateUser(
        selectedUser.id,
        {
          name: editForm.name,
          phone: editForm.phone,
          role: editForm.role,
          isActive: editForm.isActive
        },
        currentUser.id
      )

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              name: editForm.name,
              phone: editForm.phone,
              role: editForm.role,
              isActive: editForm.isActive,
              updatedAt: new Date()
            }
          : u
      ))

      setShowEditModal(false)
      setSelectedUser(null)

      addNotification({
        title: 'Success',
        message: `User "${editForm.name}" updated successfully!`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error saving user:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update user',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (!currentUser) return

    const newStatus = !(user.isActive ?? true)
    const action = newStatus ? 'activate' : 'deactivate'

    if (!newStatus) {
      if (!window.confirm(`Are you sure you want to deactivate "${user.name}"? They will not be able to log in.`)) {
        return
      }
    }

    try {
      console.log(`👥 ${action}ing user...`)
      await updateUserStatus(user.id, newStatus, currentUser.id)

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { 
              ...u, 
              isActive: newStatus,
              deactivatedAt: newStatus ? undefined : new Date(),
              deactivatedBy: newStatus ? undefined : currentUser.id,
              updatedAt: new Date()
            }
          : u
      ))

      addNotification({
        title: 'Success',
        message: `User "${user.name}" ${newStatus ? 'activated' : 'deactivated'} successfully!`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error(`🚨 Error ${action}ing user:`, error)
      addNotification({
        title: 'Error',
        message: `Failed to ${action} user`,
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!currentUser) return

    // Double confirmation for delete
    if (!window.confirm(
      `⚠️ DELETE USER: "${user.name}"?\n\n` +
      `This will remove the user profile from Firestore.\n\n` +
      `Note: Firebase Auth account will remain (they can still authenticate but will have no profile).\n\n` +
      `This action cannot be undone. Are you sure?`
    )) {
      return
    }

    try {
      console.log('🗑️ Deleting user...')
      await deleteUser(user.id)

      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== user.id))

      addNotification({
        title: 'Success',
        message: `User "${user.name}" deleted successfully`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error deleting user:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to delete user',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleInviteSuccess = () => {
    loadInvitations()
    addNotification({
      title: 'Success',
      message: 'Invitation sent successfully!',
      type: 'success',
      userId: currentUser?.id
    })
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!window.confirm(`Cancel invitation for ${email}?`)) {
      return
    }

    try {
      await cancelInvitation(invitationId)
      setInvitations(prev => prev.map(inv => 
        inv.id === invitationId 
          ? { ...inv, status: 'cancelled' as const, updatedAt: new Date() }
          : inv
      ))
      addNotification({
        title: 'Success',
        message: `Invitation for ${email} cancelled`,
        type: 'success',
        userId: currentUser?.id
      })
    } catch (error) {
      console.error('🚨 Error cancelling invitation:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to cancel invitation',
        type: 'error',
        userId: currentUser?.id
      })
    }
  }

  const handleCopyInviteLink = async (token: string, email: string) => {
    try {
      const link = generateInvitationLink(token)
      await navigator.clipboard.writeText(link)
      addNotification({
        title: 'Copied!',
        message: `Invitation link for ${email} copied to clipboard`,
        type: 'success',
        userId: currentUser?.id
      })
    } catch (error) {
      console.error('🚨 Error copying link:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to copy link',
        type: 'error',
        userId: currentUser?.id
      })
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set'
    return date.toLocaleDateString()
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑'
      case 'manager': return '👔'
      case 'supplier': return '🔧'
      case 'resident': return '🏠'
      default: return '👤'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const uniqueRoles = Array.from(new Set(users.map(u => u.role)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm"
          />
        </div>
        
        <div className="w-48">
          <Dropdown
            options={[
              { value: 'all', label: 'All Roles' },
              ...uniqueRoles.sort().map(role => ({
                value: role,
                label: role.charAt(0).toUpperCase() + role.slice(1)
              }))
            ]}
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            placeholder="Filter by role"
            icon={<Filter className="h-4 w-4" />}
            size="sm"
            variant="outline"
          />
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-inter text-sm font-medium"
        >
          Invite User
        </button>
      </div>

      {/* Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <UsersIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-inter">Total Users</p>
              <p className="text-2xl font-bold text-neutral-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-inter">Managers</p>
              <p className="text-2xl font-bold text-neutral-900">
                {users.filter(u => u.role === 'manager').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-inter">Owners/Tenants</p>
              <p className="text-2xl font-bold text-neutral-900">
                {users.filter(u => u.role === 'resident').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <UsersIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-inter">Suppliers</p>
              <p className="text-2xl font-bold text-neutral-900">
                {users.filter(u => u.role === 'supplier').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200" role="table" aria-label="Users list">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  scope="col"
                >
                  User
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  scope="col"
                >
                  Role
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  scope="col"
                >
                  Contact
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  scope="col"
                >
                  Created
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  scope="col"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-neutral-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center relative">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-lg">{getRoleIcon(user.role)}</span>
                        )}
                        {/* Status indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                          user.isActive === false ? 'bg-red-500' : 'bg-green-500'
                        }`} title={user.isActive === false ? 'Inactive' : 'Active'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 font-inter">
                            {user.name}
                          </span>
                          {user.isActive === false && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 font-inter">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium font-inter ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-inter">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={user.email}>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-inter">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {buildingAssociations.has(user.id) && buildingAssociations.get(user.id)!.buildings.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-inter">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span>{buildingAssociations.get(user.id)!.buildings.length} building(s)</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-900 font-inter">{formatDate(user.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-success-600 hover:text-green-900 transition-colors"
                        title="View User Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canManageUsers(currentUser) && canEditUser(currentUser, user) && (
                        <>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-blue-900 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`${
                              user.isActive === false 
                                ? 'text-success-600 hover:text-green-900' 
                                : 'text-red-600 hover:text-red-900'
                            } transition-colors`}
                            title={user.isActive === false ? 'Activate User' : 'Deactivate User'}
                          >
                            {user.isActive === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </button>
                          {canDeleteUser(currentUser, user) && (
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete User (Dev Only)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter !== 'all' ? 'No users match your filters.' : 'No users available.'}
            </p>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal" style={{ zIndex: 1400 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">User Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedUser(null)
                }}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-lg">
                <div className="flex-shrink-0 h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="h-16 w-16 rounded-full" />
                  ) : (
                    <span className="text-3xl">{getRoleIcon(selectedUser.role)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-neutral-900">{selectedUser.name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium font-inter mt-1 ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </span>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-neutral-500" />
                    <div>
                      <label className="block text-xs font-medium text-neutral-500">Email</label>
                      <p className="text-sm text-neutral-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-neutral-500" />
                      <div>
                        <label className="block text-xs font-medium text-neutral-500">Phone</label>
                        <p className="text-sm text-neutral-900">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Account Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">User ID</label>
                    <p className="text-sm text-neutral-900 font-mono break-all">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
                    <p className="text-sm text-neutral-900">
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Created</label>
                    <p className="text-sm text-neutral-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Last Updated</label>
                    <p className="text-sm text-neutral-900">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Building Associations */}
              {buildingAssociations.has(selectedUser.id) && buildingAssociations.get(selectedUser.id)!.buildings.length > 0 && (
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-neutral-900">Building Access</h4>
                    {canManageUsers(currentUser) && (
                      <button
                        onClick={() => setShowAccessManager(true)}
                        className="px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        Manage Access
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {buildingAssociations.get(selectedUser.id)!.buildings.map((building, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-neutral-500" />
                          <span className="text-sm text-neutral-900 font-medium">{building.name}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          building.role === 'manager' ? 'text-primary-600 bg-blue-100' :
                          building.role === 'admin' ? 'text-red-600 bg-red-100' :
                          'text-gray-600 bg-neutral-100'
                        }`}>
                          {building.role.charAt(0).toUpperCase() + building.role.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {buildingAssociations.has(selectedUser.id) && buildingAssociations.get(selectedUser.id)!.buildings.length === 0 && (
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-neutral-900">Building Access</h4>
                    {canManageUsers(currentUser) && (
                      <button
                        onClick={() => setShowAccessManager(true)}
                        className="px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        Manage Access
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">No building associations found</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal" style={{ zIndex: 1400 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
                disabled={saving}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* User Info Header */}
              <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg">
                <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="h-12 w-12 rounded-full" />
                  ) : (
                    <span className="text-2xl">{getRoleIcon(selectedUser.role)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{selectedUser.email}</p>
                  <p className="text-xs text-neutral-500">ID: {selectedUser.id.substring(0, 12)}...</p>
                </div>
              </div>

              {/* Warning for deactivated users */}
              {editForm.isActive === false && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Account Deactivated</p>
                    <p className="text-xs text-red-700 mt-1">This user cannot log in. Activate to restore access.</p>
                  </div>
                </div>
              )}

              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="User name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Phone number"
                    disabled={saving}
                  />
                </div>

                {canManageUsers(currentUser) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Role *</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={saving || (currentUser?.role === 'manager' && selectedUser.role === 'admin')}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="resident">Resident</option>
                        <option value="supplier">Supplier</option>
                      </select>
                      {currentUser?.role === 'manager' && selectedUser.role === 'admin' && (
                        <p className="text-xs text-neutral-500 mt-1">Managers cannot change admin roles</p>
                      )}
                    </div>

                    <div className="border-t border-neutral-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700">Account Status</label>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {editForm.isActive ? 'User can log in' : 'User cannot log in'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            editForm.isActive ? 'bg-green-600' : 'bg-red-600'
                          }`}
                          disabled={saving}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editForm.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-neutral-200">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={saving || !editForm.name}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pending Invitations */}
      {canManageUsers(currentUser) && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 font-inter">Pending Invitations</h3>
            <p className="text-sm text-neutral-500 mt-1">Manage user invitations and track their status</p>
          </div>
          
          {loadingInvitations ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : invitations.filter(inv => inv.status === 'pending').length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No pending invitations</h3>
              <p className="text-gray-600">All invitations have been accepted or expired</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {invitations
                    .filter(inv => inv.status === 'pending')
                    .map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-900">{invitation.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium font-inter ${getRoleColor(invitation.role)}`}>
                            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-neutral-900">
                            {users.find(u => u.id === invitation.invitedBy)?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-900">
                              {formatDate(invitation.expiresAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCopyInviteLink(invitation.token, invitation.email)}
                              className="text-primary-600 hover:text-primary-900 transition-colors"
                              title="Copy Invitation Link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(invitation.id!, invitation.email)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Cancel Invitation"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && currentUser && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          currentUser={currentUser}
          addNotification={addNotification}
          onInvitationCreated={handleInviteSuccess}
        />
      )}

      {/* Building Access Manager Modal */}
      {showAccessManager && selectedUser && currentUser && (
        <BuildingAccessManager
          isOpen={showAccessManager}
          onClose={() => setShowAccessManager(false)}
          user={selectedUser}
          currentUser={currentUser}
          addNotification={addNotification}
          onAccessUpdated={() => {
            // Reload building associations
            getUserBuildingAssociations().then(setBuildingAssociations)
          }}
        />
      )}
    </div>
  )
}
