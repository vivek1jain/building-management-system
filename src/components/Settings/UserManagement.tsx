import React, { useState } from 'react'
import { Users, Plus, Edit2, Trash2, Mail, Shield, CheckCircle, XCircle, Building, Search, Filter } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'manager' | 'admin' | 'resident'
  status: 'active' | 'inactive'
  buildings: string[]
}

interface UserManagementProps {
  users: User[]
  setUsers: (users: User[]) => void
  buildings: any[]
  addNotification: (notification: any) => void
  currentUser: any
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  setUsers,
  buildings,
  addNotification,
  currentUser
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'resident' as 'manager' | 'admin' | 'resident',
    status: 'active' as 'active' | 'inactive',
    buildings: [] as string[]
  })

  const handleAddUser = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please fill in name and email fields.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    if (users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())) {
      addNotification({
        title: 'Validation Error',
        message: 'A user with this email already exists.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      role: formData.role,
      status: formData.status,
      buildings: formData.buildings
    }

    setUsers([...users, newUser])
    addNotification({
      title: 'User Added',
      message: `${newUser.name} has been added successfully.`,
      type: 'success',
      userId: currentUser?.id || ''
    })

    resetForm()
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      buildings: user.buildings
    })
    setShowAddModal(true)
  }

  const handleUpdateUser = () => {
    if (!editingUser || !formData.name.trim() || !formData.email.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please fill in all required fields.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    if (users.some(user => user.id !== editingUser.id && user.email.toLowerCase() === formData.email.toLowerCase())) {
      addNotification({
        title: 'Validation Error',
        message: 'A user with this email already exists.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    const updatedUsers = users.map(user =>
      user.id === editingUser.id
        ? {
            ...user,
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            role: formData.role,
            status: formData.status,
            buildings: formData.buildings
          }
        : user
    )

    setUsers(updatedUsers)
    addNotification({
      title: 'User Updated',
      message: `${formData.name} has been updated successfully.`,
      type: 'success',
      userId: currentUser?.id || ''
    })

    resetForm()
  }

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    if (window.confirm(`Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`)) {
      setUsers(users.filter(user => user.id !== userId))
      addNotification({
        title: 'User Deleted',
        message: `${userToDelete.name} has been deleted.`,
        type: 'warning',
        userId: currentUser?.id || ''
      })
    }
  }

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    )
    setUsers(updatedUsers)
    
    const user = users.find(u => u.id === userId)
    const newStatus = user?.status === 'active' ? 'inactive' : 'active'
    
    addNotification({
      title: 'Status Updated',
      message: `${user?.name} is now ${newStatus}.`,
      type: 'info',
      userId: currentUser?.id || ''
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'resident',
      status: 'active',
      buildings: []
    })
    setEditingUser(null)
    setShowAddModal(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'resident': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId)
    return building ? building.name : 'Unknown Building'
  }

  const handleBuildingToggle = (buildingId: string) => {
    const updatedBuildings = formData.buildings.includes(buildingId)
      ? formData.buildings.filter(id => id !== buildingId)
      : [...formData.buildings, buildingId]
    
    setFormData({ ...formData, buildings: updatedBuildings })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="resident">Resident</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {user.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      user.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 truncate">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              {user.buildings.length > 0 && (
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    {user.buildings.slice(0, 2).map(buildingId => getBuildingName(buildingId)).join(', ')}
                    {user.buildings.length > 2 && ` +${user.buildings.length - 2} more`}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEditUser(user)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => toggleUserStatus(user.id)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  user.status === 'active'
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {users.length === 0 ? 'No Users Yet' : 'No Users Found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {users.length === 0 
              ? 'Get started by adding your first user to the system.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {users.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First User
            </button>
          )}
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'manager' | 'admin' | 'resident' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="resident">Resident</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {buildings.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Buildings
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {buildings.map((building) => (
                        <label key={building.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.buildings.includes(building.id)}
                            onChange={() => handleBuildingToggle(building.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{building.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
