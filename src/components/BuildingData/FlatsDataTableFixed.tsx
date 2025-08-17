import React, { useState, useEffect, useMemo } from 'react'
import { Building as BuildingIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Flat, Building } from '../../types'
import BulkImportExport from './BulkImportExport'
import { exportFlatsToCSV } from '../../utils/csvExport'
import { ImportValidationResult } from '../../utils/csvImport'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding, createFlat, updateFlat, deleteFlat } from '../../services/flatService'
import DataTable, { Column, TableAction } from '../UI/DataTable'
import Button from '../UI/Button'

const FlatsDataTableFixed: React.FC = () => {
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

      const createdFlat = await createFlat(flatData)
      console.log('🔥 Flat created successfully:', createdFlat.id)
      
      const flatWithActiveFlag = { ...createdFlat, isActive: true }
      setFlats(prev => [...prev, flatWithActiveFlag])
      
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

  const handleDeleteFlat = async (flatId: string) => {
    console.log('Delete flat clicked:', flatId)
    if (!currentUser) return
    
    if (window.confirm('Are you sure you want to delete this flat? This will hide the flat but it can be restored later.')) {
      try {
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
      case 'vacant': return 'text-success-600 bg-green-100'
      case 'occupied': return 'text-primary-600 bg-blue-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      case 'reserved': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  // Filter flats with memoization
  const filteredFlats = useMemo(() => {
    return flats.filter(flat => {
      const isActive = flat.isActive
      const matchesBuilding = !selectedBuilding || flat.buildingId === selectedBuilding
      const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           flat.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || flat.status === filterStatus
      
      return isActive && matchesBuilding && matchesSearch && matchesStatus
    })
  }, [flats, selectedBuilding, searchTerm, filterStatus])

  // Define table columns - NO ICONS
  const columns: Column<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'flatInfo',
      title: 'Flat',
      dataIndex: 'flatNumber',
      sortable: true,
      render: (value, flat) => (
        <div>
          <div className="text-sm font-medium text-neutral-900 font-inter">{flat.flatNumber}</div>
          <div className="text-xs text-neutral-500 font-inter">Floor {flat.floor}</div>
        </div>
      )
    },
    {
      key: 'details',
      title: 'Details',
      dataIndex: 'areaSqFt',
      sortable: false,
      render: (value, flat) => (
        <div className="space-y-1">
          <div className="text-sm text-neutral-900 font-inter">{flat.areaSqFt || 0} sq ft</div>
          <div className="text-xs text-neutral-500">
            {flat.bedrooms || 0} bed, {flat.bathrooms || 0} bath
          </div>
        </div>
      )
    },
    {
      key: 'rent',
      title: 'Rent',
      dataIndex: 'currentRent',
      sortable: true,
      render: (value, flat) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-neutral-900 font-inter">{formatCurrency(flat.currentRent || 0)}</div>
          <div className="text-xs text-neutral-500 font-inter">
            Ground: {formatCurrency(flat.groundRent || 0)}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      sortable: true,
      render: (value, flat) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(flat.status || 'unknown')}`}>
          {flat.status || 'Unknown'}
        </span>
      )
    }
  ], [])

  // Define row actions - text only for now
  const rowActions: TableAction<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      onClick: handleViewFlat,
      variant: 'outline'
    },
    {
      key: 'edit',
      label: 'Edit',
      onClick: handleEditFlat,
      variant: 'outline'
    },
    {
      key: 'delete',
      label: 'Delete',
      onClick: (flat) => handleDeleteFlat(flat.id),
      variant: 'outline'
    }
  ], [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - NO ICONS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 font-inter">Flats Management</h2>
          <p className="text-sm text-gray-600 font-inter">Manage building units and their details</p>
        </div>
        
        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          {/* Building Selector */}
          <div className="relative flex items-center gap-2">
            <BuildingIcon className="h-4 w-4 text-neutral-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
              title={`Current building: ${buildings.find(b => b.id === selectedBuilding)?.name || 'Select building'}`}
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>
          
          {/* Add Flat Button - NO ICONS */}
          <button
            onClick={() => setShowCreateFlat(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors font-inter"
          >
            Add Flat
          </button>
        </div>
      </div>

      {/* Filters - NO ICONS */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search flats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 min-w-[200px]"
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
      <DataTable
        data={filteredFlats}
        columns={columns}
        actions={rowActions}
        searchable={false}
        emptyMessage="No flats found. Get started by adding your first flat."
      />

      {/* Create Flat Modal */}
      {showCreateFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 font-inter">Add New Flat</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Flat Number *</label>
                  <input
                    type="text"
                    value={flatForm.flatNumber}
                    onChange={(e) => setFlatForm({...flatForm, flatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Floor *</label>
                  <input
                    type="number"
                    value={flatForm.floor}
                    onChange={(e) => setFlatForm({...flatForm, floor: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Area (sq ft) *</label>
                  <input
                    type="number"
                    value={flatForm.areaSqFt}
                    onChange={(e) => setFlatForm({...flatForm, areaSqFt: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                  <select
                    value={flatForm.status}
                    onChange={(e) => setFlatForm({...flatForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Bedrooms</label>
                  <input
                    type="number"
                    value={flatForm.bedrooms}
                    onChange={(e) => setFlatForm({...flatForm, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Bathrooms</label>
                  <input
                    type="number"
                    value={flatForm.bathrooms}
                    onChange={(e) => setFlatForm({...flatForm, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Ground Rent (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={flatForm.groundRent}
                  onChange={(e) => setFlatForm({...flatForm, groundRent: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
                <textarea
                  value={flatForm.notes}
                  onChange={(e) => setFlatForm({...flatForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateFlat(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFlat}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors font-inter"
              >
                Add Flat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlatsDataTableFixed
