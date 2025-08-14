import React, { useState } from 'react'
import { Building2, Plus, Edit2, Trash2, MapPin, Users, CheckCircle, XCircle } from 'lucide-react'

interface Building {
  id: string
  name: string
  address: string
  units: number
  status: 'active' | 'inactive'
}

interface BuildingManagementProps {
  buildings: Building[]
  setBuildings: (buildings: Building[]) => void
  addNotification: (notification: any) => void
  currentUser: any
}

export const BuildingManagement: React.FC<BuildingManagementProps> = ({
  buildings,
  setBuildings,
  addNotification,
  currentUser
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    units: 0,
    status: 'active' as 'active' | 'inactive'
  })

  const handleAddBuilding = () => {
    if (!formData.name.trim() || !formData.address.trim() || formData.units <= 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please fill in all required fields with valid data.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    const newBuilding: Building = {
      id: `building-${Date.now()}`,
      name: formData.name.trim(),
      address: formData.address.trim(),
      units: formData.units,
      status: formData.status
    }

    setBuildings([...buildings, newBuilding])
    addNotification({
      title: 'Building Added',
      message: `${newBuilding.name} has been added successfully.`,
      type: 'success',
      userId: currentUser?.id || ''
    })

    setFormData({ name: '', address: '', units: 0, status: 'active' })
    setShowAddModal(false)
  }

  const handleEditBuilding = (building: Building) => {
    setEditingBuilding(building)
    setFormData({
      name: building.name,
      address: building.address,
      units: building.units,
      status: building.status
    })
    setShowAddModal(true)
  }

  const handleUpdateBuilding = () => {
    if (!editingBuilding || !formData.name.trim() || !formData.address.trim() || formData.units <= 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please fill in all required fields with valid data.',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    const updatedBuildings = buildings.map(building =>
      building.id === editingBuilding.id
        ? {
            ...building,
            name: formData.name.trim(),
            address: formData.address.trim(),
            units: formData.units,
            status: formData.status
          }
        : building
    )

    setBuildings(updatedBuildings)
    addNotification({
      title: 'Building Updated',
      message: `${formData.name} has been updated successfully.`,
      type: 'success',
      userId: currentUser?.id || ''
    })

    setFormData({ name: '', address: '', units: 0, status: 'active' })
    setEditingBuilding(null)
    setShowAddModal(false)
  }

  const handleDeleteBuilding = (buildingId: string) => {
    const buildingToDelete = buildings.find(b => b.id === buildingId)
    if (!buildingToDelete) return

    if (window.confirm(`Are you sure you want to delete ${buildingToDelete.name}? This action cannot be undone.`)) {
      setBuildings(buildings.filter(building => building.id !== buildingId))
      addNotification({
        title: 'Building Deleted',
        message: `${buildingToDelete.name} has been deleted.`,
        type: 'warning',
        userId: currentUser?.id || ''
      })
    }
  }

  const toggleBuildingStatus = (buildingId: string) => {
    const updatedBuildings = buildings.map(building =>
      building.id === buildingId
        ? { ...building, status: building.status === 'active' ? 'inactive' : 'active' }
        : building
    )
    setBuildings(updatedBuildings)
    
    const building = buildings.find(b => b.id === buildingId)
    const newStatus = building?.status === 'active' ? 'inactive' : 'active'
    
    addNotification({
      title: 'Status Updated',
      message: `${building?.name} is now ${newStatus}.`,
      type: 'info',
      userId: currentUser?.id || ''
    })
  }

  const resetForm = () => {
    setFormData({ name: '', address: '', units: 0, status: 'active' })
    setEditingBuilding(null)
    setShowAddModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Building Management</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Building
        </button>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((building) => (
          <div key={building.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{building.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {building.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      building.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {building.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{building.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{building.units} units</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEditBuilding(building)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => toggleBuildingStatus(building.id)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  building.status === 'active'
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {building.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDeleteBuilding(building.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {buildings.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Buildings Yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first building to the system.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Building
          </button>
        </div>
      )}

      {/* Add/Edit Building Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingBuilding ? 'Edit Building' : 'Add New Building'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter building name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Units *
                  </label>
                  <input
                    type="number"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of units"
                    min="1"
                  />
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
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={editingBuilding ? handleUpdateBuilding : handleAddBuilding}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingBuilding ? 'Update Building' : 'Add Building'}
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
