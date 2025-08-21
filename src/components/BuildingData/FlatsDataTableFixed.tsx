import React, { useState, useEffect, useMemo } from 'react'
import { Building as BuildingIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { Flat, Building } from '../../types'
import BulkImportExport from './BulkImportExport'
import { exportFlatsToCSV } from '../../utils/csvExport'
import { ImportValidationResult } from '../../utils/csvImport'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding, createFlat, updateFlat, deleteFlat } from '../../services/flatService'
import DataTable, { Column, TableAction } from '../UI/DataTable'
import Button from '../UI/Button'
import { Modal, ModalFooter } from '../UI'

const FlatsDataTableFixed: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId, selectedBuilding } = useBuilding()
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
    if (selectedBuildingId) {
      loadFlats()
    }
  }, [selectedBuildingId])


  const loadFlats = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      console.log('🔥 Loading flats from Firebase for building:', selectedBuildingId)
      const buildingFlats = await getFlatsByBuilding(selectedBuildingId)
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
    if (!currentUser || !selectedBuildingId) return
    
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
        buildingId: selectedBuildingId,
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
      console.log('🔥 Updating flat in Firebase...', selectedFlat.id)
      
      const updateData = {
        flatNumber: flatForm.flatNumber,
        floor: parseInt(flatForm.floor),
        areaSqFt: parseInt(flatForm.areaSqFt),
        bedrooms: parseInt(flatForm.bedrooms) || 0,
        bathrooms: parseInt(flatForm.bathrooms) || 0,
        status: flatForm.status,
        groundRent: parseFloat(flatForm.groundRent) || 0,
        notes: flatForm.notes
      }
      
      await updateFlat(selectedFlat.id, updateData)
      console.log('🔥 Flat updated successfully in Firebase')
      
      setFlats(prev => prev.map(f => 
        f.id === selectedFlat.id 
          ? {
              ...f,
              ...updateData,
              updatedAt: new Date()
            }
          : f
      ))
      
      setShowEditFlat(false)
      setSelectedFlat(null)
      
      addNotification({
        title: 'Success',
        message: 'Flat updated successfully in Firebase!',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error updating flat:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update flat in Firebase',
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
      const matchesBuilding = !selectedBuildingId || flat.buildingId === selectedBuildingId
      const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           flat.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || flat.status === filterStatus
      
      return isActive && matchesBuilding && matchesSearch && matchesStatus
    })
  }, [flats, selectedBuildingId, searchTerm, filterStatus])

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
      {/* Header */}
      <div className="flex items-center justify-end">
        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          {/* Add Flat Button */}
          <Button onClick={() => setShowCreateFlat(true)}>Add Flat</Button>
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
          buildings={[]}
          selectedBuildingId={selectedBuildingId}
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
        <Modal
          isOpen={showCreateFlat}
          onClose={() => setShowCreateFlat(false)}
          title="Add New Flat"
          size="lg"
        >
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

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCreateFlat(false)}>Cancel</Button>
              <Button onClick={handleCreateFlat}>Add Flat</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* View Flat Modal */}
      {showViewFlat && selectedFlat && (
        <Modal
          isOpen={showViewFlat}
          onClose={() => setShowViewFlat(false)}
          title="Flat Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building</label>
                <p className="text-sm text-neutral-900 font-inter">
                  {selectedBuilding?.name || 'Unknown Building'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(selectedFlat.status || 'unknown')}`}>
                  {selectedFlat.status || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Flat Number</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedFlat.flatNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Floor</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedFlat.floor}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Area</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedFlat.areaSqFt} sq ft</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Bedrooms/Bathrooms</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedFlat.bedrooms || 0} bed, {selectedFlat.bathrooms || 0} bath</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Current Rent</label>
                <p className="text-sm text-neutral-900 font-inter">{formatCurrency(selectedFlat.currentRent || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Ground Rent</label>
                <p className="text-sm text-neutral-900 font-inter">{formatCurrency(selectedFlat.groundRent || 0)}</p>
              </div>
            </div>
            
            {selectedFlat.notes && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedFlat.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowViewFlat(false)}>Close</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Edit Flat Modal */}
      {showEditFlat && selectedFlat && (
        <Modal
          isOpen={showEditFlat}
          onClose={() => setShowEditFlat(false)}
          title="Edit Flat"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building</label>
              <div className="px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-sm font-medium text-neutral-700">
                {selectedBuilding?.name || 'No building selected'}
              </div>
            </div>
            
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

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowEditFlat(false)}>Cancel</Button>
              <Button onClick={handleUpdateFlat}>Update Flat</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default FlatsDataTableFixed
