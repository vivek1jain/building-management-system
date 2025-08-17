import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Users,
  Calendar,
  Home,
  Activity
} from 'lucide-react'
import { Building } from '../../types'
import { getAllBuildings, createBuilding, updateBuilding, deleteBuilding } from '../../services/buildingService'
import { useBuilding } from '../../contexts/BuildingContext'

interface BuildingManagementProps {
  buildings?: any[]
  setBuildings?: (buildings: any[]) => void
  addNotification: (notification: any) => void
  currentUser: any
}

export const BuildingManagement: React.FC<BuildingManagementProps> = ({ 
  addNotification, 
  currentUser 
}) => {
  const { refreshBuildings } = useBuilding()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  
  // Building form state
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    address: '',
    code: '',
    buildingType: 'residential',
    floors: '',
    units: '',
    capacity: '',
    area: '',
    financialYearStart: '',
    managers: [] as string[],
    admins: [] as string[]
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  const loadBuildings = async () => {
    try {
      setLoading(true)
      console.log('🏢 Loading buildings for management...')
      const buildingsData = await getAllBuildings()
      console.log('🏢 Buildings loaded:', buildingsData.length)
      setBuildings(buildingsData)
    } catch (error) {
      console.error('🚨 Error loading buildings:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load buildings',
        type: 'error',
        userId: currentUser?.id
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setBuildingForm({
      name: '',
      address: '',
      code: '',
      buildingType: 'residential',
      floors: '',
      units: '',
      capacity: '',
      area: '',
      financialYearStart: '',
      managers: [],
      admins: []
    })
  }

  const handleCreateBuilding = async () => {
    if (!currentUser) return
    
    if (!buildingForm.name || !buildingForm.address || !buildingForm.code) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields (Name, Address, Code)',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🏢 Creating building...')
      const buildingData = {
        name: buildingForm.name,
        address: buildingForm.address,
        code: buildingForm.code,
        buildingType: buildingForm.buildingType,
        floors: parseInt(buildingForm.floors) || 1,
        units: parseInt(buildingForm.units) || 1,
        capacity: parseInt(buildingForm.capacity) || 1,
        area: parseFloat(buildingForm.area) || 0,
        financialYearStart: buildingForm.financialYearStart ? new Date(buildingForm.financialYearStart) : null,
        managers: [...buildingForm.managers, currentUser.id], // Add current user as manager
        admins: buildingForm.admins,
        assets: [],
        meters: []
      }

      const createdBuilding = await createBuilding(buildingData)
      console.log('🏢 Building created successfully:', createdBuilding.id)
      
      setBuildings(prev => [...prev, createdBuilding])
      
      // Refresh the global building context so switchers update
      await refreshBuildings()
      console.log('🔄 Global building context refreshed after create')
      
      setShowCreateModal(false)
      resetForm()
      
      addNotification({
        title: 'Success',
        message: `Building "${createdBuilding.name}" created successfully!`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error creating building:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to create building',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleEditBuilding = (building: Building) => {
    console.log('Edit building clicked:', building.id)
    setSelectedBuilding(building)
    setBuildingForm({
      name: building.name,
      address: building.address,
      code: building.code,
      buildingType: building.buildingType || 'residential',
      floors: (building.floors || 0).toString(),
      units: (building.units || 0).toString(),
      capacity: (building.capacity || 0).toString(),
      area: (building.area || 0).toString(),
      financialYearStart: building.financialYearStart ? 
        building.financialYearStart.toISOString().split('T')[0] : '',
      managers: building.managers || [],
      admins: building.admins || []
    })
    setShowEditModal(true)
  }

  const handleUpdateBuilding = async () => {
    if (!currentUser || !selectedBuilding) return
    
    if (!buildingForm.name || !buildingForm.address || !buildingForm.code) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields (Name, Address, Code)',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🏢 Updating building...', selectedBuilding.id)
      const updateData = {
        name: buildingForm.name,
        address: buildingForm.address,
        code: buildingForm.code,
        buildingType: buildingForm.buildingType,
        floors: parseInt(buildingForm.floors) || 1,
        units: parseInt(buildingForm.units) || 1,
        capacity: parseInt(buildingForm.capacity) || 1,
        area: parseFloat(buildingForm.area) || 0,
        financialYearStart: buildingForm.financialYearStart ? new Date(buildingForm.financialYearStart) : null,
        managers: buildingForm.managers,
        admins: buildingForm.admins
      }

      await updateBuilding(selectedBuilding.id, updateData)
      console.log('🏢 Building updated successfully')
      
      // Update local state
      setBuildings(prev => prev.map(b => 
        b.id === selectedBuilding.id 
          ? { ...b, ...updateData, updatedAt: new Date() }
          : b
      ))
      
      // Refresh the global building context so switchers update
      await refreshBuildings()
      console.log('🔄 Global building context refreshed after update')
      
      setShowEditModal(false)
      setSelectedBuilding(null)
      resetForm()
      
      addNotification({
        title: 'Success',
        message: `Building "${updateData.name}" updated successfully!`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error updating building:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update building',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleViewBuilding = (building: Building) => {
    console.log('View building clicked:', building.id)
    setSelectedBuilding(building)
    setShowViewModal(true)
  }

  const handleDeleteBuilding = async (buildingId: string, buildingName: string) => {
    console.log('Delete building clicked:', buildingId)
    if (!currentUser) return
    
    if (window.confirm(`Are you sure you want to delete "${buildingName}"? This action cannot be undone and will remove all associated data.`)) {
      try {
        console.log('🏢 Deleting building...', buildingId)
        await deleteBuilding(buildingId)
        console.log('🏢 Building deleted successfully')
        
        // Remove from local state
        setBuildings(prev => prev.filter(b => b.id !== buildingId))
        
        // Refresh the global building context so switchers update
        await refreshBuildings()
        console.log('🔄 Global building context refreshed after delete')
        
        addNotification({
          title: 'Success',
          message: `Building "${buildingName}" deleted successfully`,
          type: 'success',
          userId: currentUser.id
        })
      } catch (error) {
        console.error('🚨 Error deleting building:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete building',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set'
    return date.toLocaleDateString()
  }

  const getBuildingTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'text-success-600 bg-green-100'
      case 'commercial': return 'text-primary-600 bg-blue-100'
      case 'mixed': return 'text-purple-600 bg-purple-100'
      case 'industrial': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
  }

  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary-600" />
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Building Management</h2>
            <p className="text-sm text-gray-600">Manage buildings and their properties</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Building
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search buildings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Buildings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Building
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Financial Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBuildings.map((building) => (
              <tr key={building.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{building.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-neutral-400" />
                      <span className="text-xs text-neutral-500">{building.address}</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">Code: {building.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBuildingTypeColor(building.buildingType || 'residential')}`}>
                    {building.buildingType || 'Residential'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Activity className="h-3 w-3" />
                      <span>{building.floors || 0} floors</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Home className="h-3 w-3" />
                      <span>{building.units || 0} units</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Users className="h-3 w-3" />
                      <span>Capacity: {building.capacity || 0}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-neutral-400" />
                    <span className="text-sm text-neutral-900">{formatDate(building.financialYearStart)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewBuilding(building)}
                      className="text-success-600 hover:text-green-900 transition-colors"
                      title="View Building"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditBuilding(building)}
                      className="text-primary-600 hover:text-blue-900 transition-colors"
                      title="Edit Building"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBuilding(building.id, building.name)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete Building"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBuildings.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No buildings found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No buildings match your search.' : 'Get started by adding your first building.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add First Building
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Building Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Add New Building</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({...buildingForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Building name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={buildingForm.code}
                    onChange={(e) => setBuildingForm({...buildingForm, code: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Building code (e.g., BLD001)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address *</label>
                <textarea
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({...buildingForm, address: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Full address"
                />
              </div>

              {/* Building Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Building Type</label>
                  <select
                    value={buildingForm.buildingType}
                    onChange={(e) => setBuildingForm({...buildingForm, buildingType: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed">Mixed Use</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Floors</label>
                  <input
                    type="number"
                    value={buildingForm.floors}
                    onChange={(e) => setBuildingForm({...buildingForm, floors: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Number of floors"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Units</label>
                  <input
                    type="number"
                    value={buildingForm.units}
                    onChange={(e) => setBuildingForm({...buildingForm, units: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Number of units"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={buildingForm.capacity}
                    onChange={(e) => setBuildingForm({...buildingForm, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Total capacity"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Area (sq ft)</label>
                  <input
                    type="number"
                    value={buildingForm.area}
                    onChange={(e) => setBuildingForm({...buildingForm, area: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Total area"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Financial Year Start</label>
                <input
                  type="date"
                  value={buildingForm.financialYearStart}
                  onChange={(e) => setBuildingForm({...buildingForm, financialYearStart: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBuilding}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Building Modal */}
      {showEditModal && selectedBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Edit Building</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedBuilding(null)
                  resetForm()
                }}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({...buildingForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Building name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={buildingForm.code}
                    onChange={(e) => setBuildingForm({...buildingForm, code: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Building code (e.g., BLD001)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address *</label>
                <textarea
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({...buildingForm, address: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Building Type</label>
                  <select
                    value={buildingForm.buildingType}
                    onChange={(e) => setBuildingForm({...buildingForm, buildingType: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed">Mixed Use</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Floors</label>
                  <input
                    type="number"
                    value={buildingForm.floors}
                    onChange={(e) => setBuildingForm({...buildingForm, floors: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Number of floors"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Units</label>
                  <input
                    type="number"
                    value={buildingForm.units}
                    onChange={(e) => setBuildingForm({...buildingForm, units: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Number of units"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={buildingForm.capacity}
                    onChange={(e) => setBuildingForm({...buildingForm, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Total capacity"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Area (sq ft)</label>
                  <input
                    type="number"
                    value={buildingForm.area}
                    onChange={(e) => setBuildingForm({...buildingForm, area: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Total area"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Financial Year Start</label>
                <input
                  type="date"
                  value={buildingForm.financialYearStart}
                  onChange={(e) => setBuildingForm({...buildingForm, financialYearStart: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedBuilding(null)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBuilding}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Update Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Building Modal */}
      {showViewModal && selectedBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Building Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedBuilding(null)
                }}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Name</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Code</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.code}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Address</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.address}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Building Type</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBuildingTypeColor(selectedBuilding.buildingType || 'residential')}`}>
                      {selectedBuilding.buildingType || 'Residential'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Financial Year Start</label>
                    <p className="text-sm text-neutral-900">{formatDate(selectedBuilding.financialYearStart)}</p>
                  </div>
                </div>
              </div>

              {/* Building Details */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Building Details</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Floors</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.floors || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Units</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.units || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Capacity</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.capacity || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Area (sq ft)</label>
                    <p className="text-sm text-neutral-900">{selectedBuilding.area?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              {/* Management */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Management</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Managers</label>
                    <p className="text-sm text-neutral-900">
                      {selectedBuilding.managers && selectedBuilding.managers.length > 0 
                        ? `${selectedBuilding.managers.length} manager(s)`
                        : 'No managers assigned'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Admins</label>
                    <p className="text-sm text-neutral-900">
                      {selectedBuilding.admins && selectedBuilding.admins.length > 0 
                        ? `${selectedBuilding.admins.length} admin(s)`
                        : 'No admins assigned'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Timestamps</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Created</label>
                    <p className="text-sm text-neutral-900">{formatDate(selectedBuilding.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Last Updated</label>
                    <p className="text-sm text-neutral-900">{formatDate(selectedBuilding.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedBuilding(null)
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
