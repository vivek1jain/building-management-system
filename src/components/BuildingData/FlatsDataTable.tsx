import React, { useState, useEffect } from 'react'
import { Search, Plus, Home, Edit, Trash2, Eye, Building as BuildingIcon, MapPin, DollarSign, Users, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Flat, Building } from '../../types'
import BulkImportExport from './BulkImportExport'
import { exportFlatsToCSV } from '../../utils/csvExport'
import { ImportValidationResult } from '../../utils/csvImport'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding, createFlat, updateFlat, deleteFlat } from '../../services/flatService'

const FlatsDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [flats, setFlats] = useState<(Flat & { isActive: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateFlat, setShowCreateFlat] = useState(false)
  const [showViewFlat, setShowViewFlat] = useState(false)
  const [showEditFlat, setShowEditFlat] = useState(false)
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form states
  const [flatForm, setFlatForm] = useState({
    flatNumber: '',
    floor: '',
    areaSqFt: '',
    bedrooms: '',
    bathrooms: '',
    currentRent: '',
    rentFrequency: 'Monthly',
    // UK Market: Ground Rent (typically annual, per sq ft)
    groundRent: '',
    groundRentPerSqFt: '',
    groundRentFrequency: 'Annually',
    // UK Market: Maintenance Charge (typically quarterly, per sq ft)
    maintenanceCharge: '',
    maintenanceChargePerSqFt: '',
    maintenanceFrequency: 'Quarterly',
    status: 'vacant',
    notes: '',
    buildingId: ''
  })

  useEffect(() => {
    initializeData()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadFlats()
    }
  }, [selectedBuilding])

  const initializeData = async () => {
    try {
      setLoading(true)
      console.log('🔥 Loading buildings from Firebase...')
      const buildingsData = await getAllBuildings()
      console.log('🔥 Buildings loaded:', buildingsData.length)
      setBuildings(buildingsData)
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('🚨 Error initializing data:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load buildings',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadFlats = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      console.log('🔥 Loading flats from Firebase for building:', selectedBuilding)
      const buildingFlats = await getFlatsByBuilding(selectedBuilding)
      console.log('🔥 Flats loaded:', buildingFlats.length)
      // Add isActive property for compatibility
      const flatsWithActiveFlag = buildingFlats.map(flat => ({ ...flat, isActive: true }))
      setFlats(flatsWithActiveFlag)
    } catch (error) {
      console.error('🚨 Error loading flats:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load flats from Firebase',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlat = async () => {
    if (!currentUser || !selectedBuilding) return
    
    if (!flatForm.flatNumber || !flatForm.floor || !flatForm.areaSqFt) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Creating flat in Firebase...')
      const flatData = {
        buildingId: selectedBuilding,
        flatNumber: flatForm.flatNumber,
        floor: parseInt(flatForm.floor),
        areaSqFt: parseInt(flatForm.areaSqFt),
        bedrooms: parseInt(flatForm.bedrooms) || 0,
        bathrooms: parseInt(flatForm.bathrooms) || 0,
        groundRent: parseFloat(flatForm.groundRent) || 0,
        notes: flatForm.notes
      }

      // Create flat in Firebase
      const createdFlat = await createFlat(flatData)
      console.log('🔥 Flat created successfully:', createdFlat.id)
      
      // Add to local state with isActive flag
      const flatWithActiveFlag = { ...createdFlat, isActive: true }
      setFlats(prev => [...prev, flatWithActiveFlag])
      
      // Reset form
      setFlatForm({
        flatNumber: '',
        floor: '',
        areaSqFt: '',
        bedrooms: '',
        bathrooms: '',
        currentRent: '',
        rentFrequency: 'Monthly',
        groundRent: '',
        groundRentPerSqFt: '',
        groundRentFrequency: 'Annually',
        maintenanceCharge: '',
        maintenanceChargePerSqFt: '',
        maintenanceFrequency: 'Quarterly',
        status: 'vacant',
        notes: '',
        buildingId: ''
      })
      
      setShowCreateFlat(false)
      
      addNotification({
        title: 'Success',
        message: 'Flat added successfully to Firebase!',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error creating flat:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add flat to Firebase',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleViewFlat = (flat: Flat & { isActive: boolean }) => {
    console.log('View flat clicked:', flat.id)
    setSelectedFlat(flat)
    setShowViewFlat(true)
  }

  const handleEditFlat = (flat: Flat & { isActive: boolean }) => {
    console.log('Edit flat clicked:', flat.id)
    setSelectedFlat(flat)
    setFlatForm({
      flatNumber: flat.flatNumber,
      floor: (flat.floor || 0).toString(),
      areaSqFt: (flat.areaSqFt || 0).toString(),
      bedrooms: (flat.bedrooms || 0).toString(),
      bathrooms: (flat.bathrooms || 0).toString(),
      currentRent: (flat.currentRent || 0).toString(),
      rentFrequency: flat.rentFrequency || 'Monthly',
      groundRent: (flat.groundRent || 0).toString(),
      groundRentPerSqFt: (flat.groundRentPerSqFt || 0).toString(),
      groundRentFrequency: flat.groundRentFrequency || 'Annually',
      maintenanceCharge: (flat.maintenanceCharge || 0).toString(),
      maintenanceChargePerSqFt: (flat.maintenanceChargePerSqFt || 0).toString(),
      maintenanceFrequency: flat.maintenanceFrequency || 'Quarterly',
      status: flat.status || 'vacant',
      notes: flat.notes || '',
      buildingId: flat.buildingId || ''
    })
    setShowEditFlat(true)
  }

  const handleUpdateFlat = async () => {
    if (!currentUser || !selectedFlat) return
    
    if (!flatForm.flatNumber || !flatForm.floor || !flatForm.areaSqFt) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      setFlats(prev => prev.map(f => 
        f.id === selectedFlat.id 
          ? {
              ...f,
              flatNumber: flatForm.flatNumber,
              floor: parseInt(flatForm.floor),
              areaSqFt: parseInt(flatForm.areaSqFt),
              bedrooms: parseInt(flatForm.bedrooms) || 0,
              bathrooms: parseInt(flatForm.bathrooms) || 0,
              currentRent: parseFloat(flatForm.currentRent) || 0,
              groundRent: parseFloat(flatForm.groundRent) || 0,
              status: flatForm.status,
              notes: flatForm.notes,
              updatedAt: new Date()
            }
          : f
      ))
      
      setShowEditFlat(false)
      setSelectedFlat(null)
      
      addNotification({
        title: 'Success',
        message: 'Flat updated successfully',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error updating flat:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update flat',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleDeleteFlat = async (flatId: string) => {
    console.log('Delete flat clicked:', flatId)
    if (!currentUser) return
    
    if (window.confirm('Are you sure you want to delete this flat? This will hide the flat but it can be restored later.')) {
      try {
        // Soft delete: mark as inactive instead of removing
        setFlats(prev => prev.map(f => 
          f.id === flatId 
            ? { ...f, isActive: false, updatedAt: new Date() }
            : f
        ))
        addNotification({
          title: 'Success',
          message: 'Flat deleted successfully (can be restored)',
          type: 'success',
          userId: currentUser.id
        })
      } catch (error) {
        console.error('Error deleting flat:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete flat',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  // Bulk import/export handlers
  const handleExportFlats = (buildingId: string, buildingName?: string) => {
    const buildingFlats = flats.filter(f => f.buildingId === buildingId && f.isActive)
    exportFlatsToCSV(buildingFlats, buildingName)
  }

  const handleImportFlats = (csvText: string, buildingId: string): ImportValidationResult<any> => {
    // For now, return empty result - would implement CSV parsing for flats
    return {
      valid: [],
      errors: [{ row: 0, field: 'general', message: 'Flats CSV import not yet implemented', data: {} }],
      warnings: []
    }
  }

  const handleImportConfirm = (validFlats: (Flat & { isActive: boolean })[]) => {
    setFlats(prev => [...prev, ...validFlats])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant': return 'text-green-600 bg-green-100'
      case 'occupied': return 'text-blue-600 bg-blue-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      case 'reserved': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const filteredFlats = flats.filter(flat => {
    // Only show active flats (soft delete implementation)
    const isActive = flat.isActive
    
    // Building-scoped filtering: only show flats for the selected building
    const matchesBuilding = !selectedBuilding || flat.buildingId === selectedBuilding
    
    const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flat.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || flat.status === filterStatus
    
    return isActive && matchesBuilding && matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="h-6 w-6 text-green-700" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 font-inter">Flats Management</h2>
            <p className="text-sm text-gray-600 font-inter">Manage building units and their details</p>
          </div>
        </div>
        
        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          {/* Building Selector */}
          <div className="relative flex items-center gap-2">
            <BuildingIcon className="h-4 w-4 text-gray-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 min-w-[200px]"
              title={`Current building: ${buildings.find(b => b.id === selectedBuilding)?.name || 'Select building'}`}
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            {/* Dropdown Arrow */}
            <ChevronDown className="absolute right-2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Add Flat Button */}
          <button
            onClick={() => setShowCreateFlat(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-inter"
          >
            <Plus className="h-4 w-4" />
            Add Flat
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search flats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
        >
          <option value="all">All Status</option>
          <option value="vacant">Vacant</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
        
        {/* Bulk Import/Export */}
        <BulkImportExport
          dataType="flats"
          buildings={buildings}
          selectedBuildingId={selectedBuilding}
          onExport={handleExportFlats}
          onImport={handleImportFlats}
          onImportConfirm={handleImportConfirm}
          className="ml-auto"
        />
      </div>

      {/* Flats Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Flat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Rent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFlats.map((flat) => (
              <tr key={flat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 font-inter">{flat.flatNumber}</div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 font-inter">Floor {flat.floor}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 font-inter">{flat.areaSqFt || 0} sq ft</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {flat.bedrooms || 0} bed
                      </span>
                      <span>{flat.bathrooms || 0} bath</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 font-inter">{formatCurrency(flat.currentRent || 0)}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-inter">
                      Ground Rent: {formatCurrency(flat.groundRent || 0)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(flat.status || 'unknown')}`}>
                    {flat.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewFlat(flat)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="View Flat"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditFlat(flat)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit Flat"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFlat(flat.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete Flat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFlats.length === 0 && (
          <div className="text-center py-12">
            <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 font-inter">No flats found</h3>
            <p className="text-gray-600 font-inter">Get started by adding your first flat</p>
          </div>
        )}
      </div>

      {/* Create Flat Modal */}
      {showCreateFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4 font-inter">Add New Flat</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Flat Number</label>
                  <input
                    type="text"
                    value={flatForm.flatNumber}
                    onChange={(e) => setFlatForm({...flatForm, flatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Floor</label>
                  <input
                    type="number"
                    value={flatForm.floor}
                    onChange={(e) => setFlatForm({...flatForm, floor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Area (sq ft)</label>
                  <input
                    type="number"
                    value={flatForm.areaSqFt}
                    onChange={(e) => setFlatForm({...flatForm, areaSqFt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Bedrooms</label>
                  <input
                    type="number"
                    value={flatForm.bedrooms}
                    onChange={(e) => setFlatForm({...flatForm, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Bathrooms</label>
                  <input
                    type="number"
                    value={flatForm.bathrooms}
                    onChange={(e) => setFlatForm({...flatForm, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Current Rent</label>
                  <input
                    type="number"
                    value={flatForm.currentRent}
                    onChange={(e) => setFlatForm({...flatForm, currentRent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Ground Rent</label>
                  <input
                    type="number"
                    value={flatForm.groundRent}
                    onChange={(e) => setFlatForm({...flatForm, groundRent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                <select
                  value={flatForm.status}
                  onChange={(e) => setFlatForm({...flatForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                <textarea
                  value={flatForm.notes}
                  onChange={(e) => setFlatForm({...flatForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateFlat(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFlat}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter"
              >
                Add Flat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Flat Modal */}
      {showViewFlat && selectedFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Flat Details</h3>
              <button
                onClick={() => setShowViewFlat(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Flat Number</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedFlat.flatNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Floor</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedFlat.floor || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Area (Sq Ft)</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedFlat.areaSqFt || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(selectedFlat.status || 'unknown')}`}>
                    {selectedFlat.status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Bedrooms</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedFlat.bedrooms || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Bathrooms</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedFlat.bathrooms || 0}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Current Rent</label>
                  <p className="text-sm text-gray-900 font-inter">{formatCurrency(selectedFlat.currentRent || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Ground Rent</label>
                  <p className="text-sm text-gray-900 font-inter">{formatCurrency(selectedFlat.groundRent || 0)}</p>
                </div>
              </div>
              
              {selectedFlat.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedFlat.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewFlat(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flat Modal */}
      {showEditFlat && selectedFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Edit Flat</h3>
              <button
                onClick={() => setShowEditFlat(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Flat Number *</label>
                  <input
                    type="text"
                    value={flatForm.flatNumber}
                    onChange={(e) => setFlatForm({...flatForm, flatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Floor *</label>
                  <input
                    type="number"
                    value={flatForm.floor}
                    onChange={(e) => setFlatForm({...flatForm, floor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Area (Sq Ft) *</label>
                  <input
                    type="number"
                    value={flatForm.areaSqFt}
                    onChange={(e) => setFlatForm({...flatForm, areaSqFt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                  <select
                    value={flatForm.status}
                    onChange={(e) => setFlatForm({...flatForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Bedrooms</label>
                  <input
                    type="number"
                    value={flatForm.bedrooms}
                    onChange={(e) => setFlatForm({...flatForm, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Bathrooms</label>
                  <input
                    type="number"
                    value={flatForm.bathrooms}
                    onChange={(e) => setFlatForm({...flatForm, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Current Rent</label>
                  <input
                    type="number"
                    value={flatForm.currentRent}
                    onChange={(e) => setFlatForm({...flatForm, currentRent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Ground Rent</label>
                  <input
                    type="number"
                    value={flatForm.groundRent}
                    onChange={(e) => setFlatForm({...flatForm, groundRent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                <textarea
                  value={flatForm.notes}
                  onChange={(e) => setFlatForm({...flatForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditFlat(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFlat}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter"
              >
                Update Flat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlatsDataTable
