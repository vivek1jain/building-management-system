import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Wrench, Edit, Trash2, Eye, Building as BuildingIcon, Package, ChevronDown, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { Asset, Building, AssetStatus, AssetCategory } from '../../types'
import BulkImportExport from './BulkImportExport'
import { exportAssetsToCSV } from '../../utils/csvExport'
import { ImportValidationResult, importAssetsFromCSV } from '../../utils/csvImport'
import { getAllBuildings, getAssetsByBuilding, createAsset, updateAsset, deleteAsset } from '../../services/buildingService'
import { DataTable, Column, TableAction } from '../UI/DataTable'
import { Button, Modal, ModalFooter } from '../UI'

const AssetsDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId, selectedBuilding } = useBuilding()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [assets, setAssets] = useState<(Asset & { isActive: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAsset, setShowCreateAsset] = useState(false)
  const [showViewAsset, setShowViewAsset] = useState(false)
  const [showEditAsset, setShowEditAsset] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form states using correct Asset interface
  const [assetForm, setAssetForm] = useState({
    name: '',
    type: '',
    category: AssetCategory.OTHER,
    locationDescription: '',
    installationDate: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    warrantyExpiryDate: '',
    status: AssetStatus.OPERATIONAL,
    notes: '',
    buildingId: ''
  })

  useEffect(() => {
    if (selectedBuildingId) {
      loadAssets()
    }
  }, [selectedBuildingId])

  useEffect(() => {
    loadBuildings()
  }, [])

  const loadBuildings = async () => {
    try {
      const allBuildings = await getAllBuildings()
      setBuildings(allBuildings)
    } catch (error) {
      console.error('Error loading buildings:', error)
    }
  }


  const loadAssets = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      console.log('🔥 Loading assets from Firebase for building:', selectedBuildingId)
      const buildingAssets = await getAssetsByBuilding(selectedBuildingId)
      console.log('🔥 Assets loaded:', buildingAssets.length)
      // Add isActive property for compatibility
      const assetsWithActiveFlag = buildingAssets.map(asset => ({ ...asset, isActive: true }))
      setAssets(assetsWithActiveFlag)
    } catch (error) {
      console.error('🚨 Error loading assets:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load assets from Firebase',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAsset = async () => {
    if (!currentUser || !selectedBuildingId) return
    
    if (!assetForm.name || !assetForm.type) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Creating asset in Firebase...')
      const assetData = {
        name: assetForm.name,
        buildingId: selectedBuildingId,
        category: assetForm.category,
        type: assetForm.type,
        status: assetForm.status,
        locationDescription: assetForm.locationDescription,
        manufacturer: assetForm.manufacturer,
        modelNumber: assetForm.modelNumber,
        serialNumber: assetForm.serialNumber,
        installationDate: assetForm.installationDate ? new Date(assetForm.installationDate) : null,
        warrantyExpiryDate: assetForm.warrantyExpiryDate ? new Date(assetForm.warrantyExpiryDate) : null,
        notes: assetForm.notes,
        createdByUid: currentUser.id
      }

      // Create asset in Firebase
      const createdAsset = await createAsset(assetData)
      console.log('🔥 Asset created successfully:', createdAsset.id)
      
      // Add to local state with isActive flag
      const assetWithActiveFlag = { ...createdAsset, isActive: true }
      setAssets(prev => [...prev, assetWithActiveFlag])
      
      // Reset form
      setAssetForm({
        name: '',
        type: '',
        category: AssetCategory.OTHER,
        locationDescription: '',
        installationDate: '',
        manufacturer: '',
        modelNumber: '',
        serialNumber: '',
        warrantyExpiryDate: '',
        status: AssetStatus.OPERATIONAL,
        notes: '',
        buildingId: ''
      })
      
      setShowCreateAsset(false)
      
      addNotification({
        title: 'Success',
        message: 'Asset added successfully to Firebase!',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error creating asset:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add asset to Firebase',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleViewAsset = (asset: Asset & { isActive: boolean }) => {
    console.log('View asset clicked:', asset.id)
    setSelectedAsset(asset)
    setShowViewAsset(true)
  }

  const handleEditAsset = (asset: Asset & { isActive: boolean }) => {
    console.log('Edit asset clicked:', asset.id)
    setSelectedAsset(asset)
    setAssetForm({
      name: asset.name,
      type: asset.type || '',
      category: asset.category,
      locationDescription: asset.locationDescription || '',
      installationDate: asset.installationDate ? asset.installationDate.toISOString().split('T')[0] : '',
      manufacturer: asset.manufacturer || '',
      modelNumber: asset.modelNumber || '',
      serialNumber: asset.serialNumber || '',
      warrantyExpiryDate: asset.warrantyExpiryDate ? asset.warrantyExpiryDate.toISOString().split('T')[0] : '',
      status: asset.status,
      notes: asset.notes || '',
      buildingId: asset.buildingId || ''
    })
    setShowEditAsset(true)
  }

  const handleUpdateAsset = async () => {
    if (!currentUser || !selectedAsset) return
    
    if (!assetForm.name || !assetForm.type) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields (Name, Type)',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Updating asset in Firebase...')
      const updateData = {
        name: assetForm.name,
        type: assetForm.type,
        category: assetForm.category,
        status: assetForm.status,
        locationDescription: assetForm.locationDescription,
        manufacturer: assetForm.manufacturer,
        modelNumber: assetForm.modelNumber,
        serialNumber: assetForm.serialNumber,
        installationDate: assetForm.installationDate ? new Date(assetForm.installationDate) : null,
        warrantyExpiryDate: assetForm.warrantyExpiryDate ? new Date(assetForm.warrantyExpiryDate) : null,
        notes: assetForm.notes,
        buildingId: selectedAsset.buildingId
      }

      // Update asset in Firebase
      await updateAsset(selectedAsset.id, updateData)
      console.log('🔥 Asset updated successfully in Firebase')

      // Update local state
      setAssets(prev => prev.map(a => 
        a.id === selectedAsset.id 
          ? {
              ...a,
              ...updateData,
              updatedAt: new Date()
            }
          : a
      ))
      
      setShowEditAsset(false)
      setSelectedAsset(null)
      
      // Reset form
      setAssetForm({
        name: '',
        type: '',
        category: AssetCategory.OTHER,
        locationDescription: '',
        installationDate: '',
        manufacturer: '',
        modelNumber: '',
        serialNumber: '',
        warrantyExpiryDate: '',
        status: AssetStatus.OPERATIONAL,
        notes: '',
        buildingId: ''
      })
      
      addNotification({
        title: 'Success',
        message: 'Asset updated successfully in Firebase!',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error updating asset:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update asset in Firebase',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    console.log('Delete asset clicked:', assetId)
    if (!currentUser) return
    
    if (window.confirm('Are you sure you want to delete this asset? This will permanently remove the asset from Firebase.')) {
      try {
        console.log('🔥 Deleting asset from Firebase...')
        // Delete asset from Firebase
        await deleteAsset(assetId)
        console.log('🔥 Asset deleted successfully from Firebase')
        
        // Remove from local state
        setAssets(prev => prev.filter(a => a.id !== assetId))
        
        addNotification({
          title: 'Success',
          message: 'Asset deleted successfully from Firebase!',
          type: 'success',
          userId: currentUser.id
        })
      } catch (error) {
        console.error('Error deleting asset:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete asset from Firebase',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const handleAssetImport = (csvText: string, buildingId: string) => {
    return importAssetsFromCSV(csvText, buildingId)
  }

  const handleBulkImportConfirm = async (assets: Asset[]) => {
    if (!currentUser) return
    
    try {
      for (const asset of assets) {
        await createAsset(asset)
      }
      
      loadAssets() // Reload assets after successful import
      
      addNotification({
        title: 'Import Successful',
        message: `Successfully imported ${assets.length} assets`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error importing assets:', error)
      addNotification({
        title: 'Import Failed',
        message: 'Failed to import some or all assets',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.OPERATIONAL: return 'bg-success-100 text-success-800'
      case AssetStatus.NEEDS_REPAIR: return 'bg-warning-100 text-warning-800'
      case AssetStatus.IN_REPAIR: return 'bg-info-100 text-info-800'
      case AssetStatus.DECOMMISSIONED: return 'bg-danger-100 text-danger-800'
      default: return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'elevator': 'bg-primary-100 text-primary-800',
      'hvac': 'bg-info-100 text-info-800', 
      'safety': 'bg-danger-100 text-danger-800',
      'electrical': 'bg-warning-100 text-warning-800',
      'plumbing': 'bg-info-100 text-info-800',
      'equipment': 'bg-neutral-100 text-neutral-800'
    }
    return colorMap[type] || 'bg-neutral-100 text-neutral-800'
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString()
  }

  // Define columns for DataTable
  const columns: Column<Asset & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'asset',
      title: 'Asset',
      dataIndex: 'name',
      sortable: true,
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">{record.name}</div>
          <div className="text-sm text-neutral-500">
            {record.manufacturer} {record.modelNumber}
          </div>
          {record.serialNumber && (
            <div className="text-xs text-neutral-400">SN: {record.serialNumber}</div>
          )}
        </div>
      )
    },
    {
      key: 'location',
      title: 'Location',
      dataIndex: 'locationDescription',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-neutral-900">{value || 'N/A'}</span>
      )
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(value || '')}`}>
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'warranty',
      title: 'Warranty',
      dataIndex: 'warrantyExpiryDate',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-neutral-900">
          {formatDate(value)}
        </span>
      )
    }
  ], [])

  // Define table actions
  const tableActions: TableAction<Asset & { isActive: boolean }>[] = [
    {
      key: 'view',
      label: 'View',
      onClick: handleViewAsset,
      variant: 'outline'
    },
    {
      key: 'edit',
      label: 'Edit', 
      onClick: handleEditAsset,
      variant: 'outline'
    },
    {
      key: 'delete',
      label: 'Delete',
      onClick: (record) => handleDeleteAsset(record.id),
      variant: 'outline'
    }
  ]

  // Filter assets for status filter
  const filteredAssets = useMemo(() => {
    let result = assets.filter(asset => {
      // Only show active assets (soft delete implementation)
      const isActive = asset.isActive
      
      // Building-scoped filtering: only show assets for the selected building
      const matchesBuilding = !selectedBuildingId || asset.buildingId === selectedBuildingId
      
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (asset.manufacturer && asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (asset.modelNumber && asset.modelNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = filterStatus === 'all' || asset.status === filterStatus
      
      return isActive && matchesBuilding && matchesSearch && matchesStatus
    })
    return result
  }, [assets, selectedBuildingId, searchTerm, filterStatus])

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
          {/* Add Asset Button */}
          <Button onClick={() => setShowCreateAsset(true)}>Add Asset</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search assets by name, manufacturer, model, or serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
          />
        </div>
        <div className="relative flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
          >
            <option value="all">All Status</option>
            <option value={AssetStatus.OPERATIONAL}>Operational</option>
            <option value={AssetStatus.NEEDS_REPAIR}>Needs Repair</option>
            <option value={AssetStatus.IN_REPAIR}>In Repair</option>
            <option value={AssetStatus.DECOMMISSIONED}>Decommissioned</option>
          </select>
          <ChevronDown className="absolute right-2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
        
        {/* Bulk Import/Export */}
        <BulkImportExport
          dataType="assets"
          buildings={buildings}
          selectedBuildingId={selectedBuildingId || ''}
          onExport={() => exportAssetsToCSV(filteredAssets, selectedBuilding?.name || 'Unknown')}
          onImport={handleAssetImport}
          onImportConfirm={handleBulkImportConfirm}
          className="ml-auto"
        />
      </div>

      {/* Assets Table */}
      <DataTable
        data={filteredAssets}
        columns={columns}
        actions={tableActions}
        searchable={false}
        emptyMessage="No assets found. Get started by adding your first asset."
      />

      {/* Create Asset Modal */}
      {showCreateAsset && (
        <Modal
          isOpen={showCreateAsset}
          onClose={() => setShowCreateAsset(false)}
          title="Add New Asset"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Asset Name</label>
                <input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Location</label>
                <input
                  type="text"
                  value={assetForm.locationDescription}
                  onChange={(e) => setAssetForm({...assetForm, locationDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Category *</label>
                <select
                  value={assetForm.category}
                  onChange={(e) => setAssetForm({...assetForm, category: e.target.value as AssetCategory})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                >
                  <option value={AssetCategory.HVAC}>HVAC</option>
                  <option value={AssetCategory.ELECTRICAL}>Electrical</option>
                  <option value={AssetCategory.PLUMBING}>Plumbing</option>
                  <option value={AssetCategory.SECURITY}>Security</option>
                  <option value={AssetCategory.FIRE_SAFETY}>Fire Safety</option>
                  <option value={AssetCategory.ELEVATORS}>Elevators</option>
                  <option value={AssetCategory.LIGHTING}>Lighting</option>
                  <option value={AssetCategory.APPLIANCES}>Appliances</option>
                  <option value={AssetCategory.FURNITURE}>Furniture</option>
                  <option value={AssetCategory.IT_EQUIPMENT}>IT Equipment</option>
                  <option value={AssetCategory.CLEANING_EQUIPMENT}>Cleaning Equipment</option>
                  <option value={AssetCategory.LANDSCAPING}>Landscaping</option>
                  <option value={AssetCategory.OTHER}>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Type</label>
                <input
                  type="text"
                  value={assetForm.type}
                  onChange={(e) => setAssetForm({...assetForm, type: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  placeholder="e.g. Fire Extinguisher, Boiler, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <select
                  value={assetForm.status}
                  onChange={(e) => setAssetForm({...assetForm, status: e.target.value as AssetStatus})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                >
                  <option value={AssetStatus.OPERATIONAL}>Operational</option>
                  <option value={AssetStatus.NEEDS_REPAIR}>Needs Repair</option>
                  <option value={AssetStatus.IN_REPAIR}>In Repair</option>
                  <option value={AssetStatus.DECOMMISSIONED}>Decommissioned</option>
                </select>
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Manufacturer</label>
                <input
                  type="text"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Model Number</label>
                <input
                  type="text"
                  value={assetForm.modelNumber}
                  onChange={(e) => setAssetForm({...assetForm, modelNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Serial Number</label>
                <input
                  type="text"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Installation Date</label>
                <input
                  type="date"
                  value={assetForm.installationDate}
                  onChange={(e) => setAssetForm({...assetForm, installationDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Warranty Expiry Date</label>
              <input
                type="date"
                value={assetForm.warrantyExpiryDate}
                onChange={(e) => setAssetForm({...assetForm, warrantyExpiryDate: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={assetForm.notes}
                onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCreateAsset(false)}>Cancel</Button>
              <Button onClick={handleCreateAsset}>Add Asset</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* View Asset Modal */}
      {showViewAsset && selectedAsset && (
        <Modal
          isOpen={showViewAsset}
          onClose={() => setShowViewAsset(false)}
          title="Asset Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Asset Name</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedAsset.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Type</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getTypeColor(selectedAsset.type || 'unknown')}`}>
                  {selectedAsset.type || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Location</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedAsset.locationDescription || 'N/A'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Manufacturer</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedAsset.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Model Number</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedAsset.modelNumber || 'N/A'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Serial Number</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedAsset.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Installation Date</label>
                <p className="text-sm text-neutral-900 font-inter">{formatDate(selectedAsset.installationDate)}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Warranty Expiry Date</label>
              <p className="text-sm text-neutral-900 font-inter">{formatDate(selectedAsset.warrantyExpiryDate)}</p>
            </div>
            
            {selectedAsset.notes && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedAsset.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowViewAsset(false)}>Close</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Edit Asset Modal */}
      {showEditAsset && selectedAsset && (
        <Modal
          isOpen={showEditAsset}
          onClose={() => setShowEditAsset(false)}
          title="Edit Asset"
          size="lg"
        >
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Asset Name *</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Category *</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({...assetForm, category: e.target.value as AssetCategory})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  >
                    <option value={AssetCategory.HVAC}>HVAC</option>
                    <option value={AssetCategory.ELECTRICAL}>Electrical</option>
                    <option value={AssetCategory.PLUMBING}>Plumbing</option>
                    <option value={AssetCategory.SECURITY}>Security</option>
                    <option value={AssetCategory.FIRE_SAFETY}>Fire Safety</option>
                    <option value={AssetCategory.ELEVATORS}>Elevators</option>
                    <option value={AssetCategory.LIGHTING}>Lighting</option>
                    <option value={AssetCategory.APPLIANCES}>Appliances</option>
                    <option value={AssetCategory.FURNITURE}>Furniture</option>
                    <option value={AssetCategory.IT_EQUIPMENT}>IT Equipment</option>
                    <option value={AssetCategory.CLEANING_EQUIPMENT}>Cleaning Equipment</option>
                    <option value={AssetCategory.LANDSCAPING}>Landscaping</option>
                    <option value={AssetCategory.OTHER}>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Type</label>
                  <input
                    type="text"
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({...assetForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                    placeholder="e.g. Fire Extinguisher, Boiler, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Location</label>
                  <input
                    type="text"
                    value={assetForm.locationDescription}
                    onChange={(e) => setAssetForm({...assetForm, locationDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <select
                  value={assetForm.status}
                  onChange={(e) => setAssetForm({...assetForm, status: e.target.value as AssetStatus})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                >
                  <option value={AssetStatus.OPERATIONAL}>Operational</option>
                  <option value={AssetStatus.NEEDS_REPAIR}>Needs Repair</option>
                  <option value={AssetStatus.IN_REPAIR}>In Repair</option>
                  <option value={AssetStatus.DECOMMISSIONED}>Decommissioned</option>
                </select>
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Manufacturer</label>
                <input
                  type="text"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Model Number</label>
                <input
                  type="text"
                  value={assetForm.modelNumber}
                  onChange={(e) => setAssetForm({...assetForm, modelNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Serial Number</label>
                <input
                  type="text"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Installation Date</label>
                <input
                  type="date"
                  value={assetForm.installationDate}
                  onChange={(e) => setAssetForm({...assetForm, installationDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Warranty Expiry Date</label>
              <input
                type="date"
                value={assetForm.warrantyExpiryDate}
                onChange={(e) => setAssetForm({...assetForm, warrantyExpiryDate: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={assetForm.notes}
                onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowEditAsset(false)}>Cancel</Button>
              <Button onClick={handleUpdateAsset}>Update Asset</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AssetsDataTable
