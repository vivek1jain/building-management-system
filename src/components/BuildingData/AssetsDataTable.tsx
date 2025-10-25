import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Wrench, Edit, Trash2, Eye, Building as BuildingIcon, Package, ChevronDown, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { Asset, Building, AssetStatus, AssetCategory } from '../../types'
import { getAssetsByBuilding, createAsset, updateAsset, deleteAsset } from '../../services/buildingService'
import { Button, Modal, ModalFooter, Dropdown, DropdownOption } from '../UI'

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
  const [expandedDesktopAssets, setExpandedDesktopAssets] = useState<Set<string>>(new Set())
  const [expandedMobileAssets, setExpandedMobileAssets] = useState<Set<string>>(new Set())

  // Asset status dropdown options
  const statusOptions: DropdownOption[] = [
    { value: 'all', label: 'All Status', description: 'Show all assets' },
    { value: AssetStatus.OPERATIONAL, label: 'Operational', description: 'Currently operational' },
    { value: AssetStatus.NEEDS_REPAIR, label: 'Needs Repair', description: 'Requires repairs' },
    { value: AssetStatus.IN_REPAIR, label: 'In Repair', description: 'Currently being repaired' },
    { value: AssetStatus.DECOMMISSIONED, label: 'Decommissioned', description: 'No longer in use' }
  ];

  // Asset category dropdown options
  const categoryOptions: DropdownOption[] = [
    { value: AssetCategory.HVAC, label: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
    { value: AssetCategory.ELECTRICAL, label: 'Electrical', description: 'Electrical systems' },
    { value: AssetCategory.PLUMBING, label: 'Plumbing', description: 'Plumbing systems' },
    { value: AssetCategory.SECURITY, label: 'Security', description: 'Security systems' },
    { value: AssetCategory.FIRE_SAFETY, label: 'Fire Safety', description: 'Fire safety equipment' },
    { value: AssetCategory.ELEVATORS, label: 'Elevators', description: 'Elevator systems' },
    { value: AssetCategory.LIGHTING, label: 'Lighting', description: 'Lighting systems' },
    { value: AssetCategory.APPLIANCES, label: 'Appliances', description: 'Appliances' },
    { value: AssetCategory.FURNITURE, label: 'Furniture', description: 'Furniture' },
    { value: AssetCategory.IT_EQUIPMENT, label: 'IT Equipment', description: 'IT equipment' },
    { value: AssetCategory.CLEANING_EQUIPMENT, label: 'Cleaning Equipment', description: 'Cleaning equipment' },
    { value: AssetCategory.LANDSCAPING, label: 'Landscaping', description: 'Landscaping equipment' },
    { value: AssetCategory.OTHER, label: 'Other', description: 'Other assets' }
  ];

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

  // Toggle functions for accordion
  const toggleDesktopExpanded = (assetId: string) => {
    const newExpanded = new Set(expandedDesktopAssets)
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId)
    } else {
      newExpanded.add(assetId)
    }
    setExpandedDesktopAssets(newExpanded)
  }

  const toggleMobileExpanded = (assetId: string) => {
    const newExpanded = new Set(expandedMobileAssets)
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId)
    } else {
      newExpanded.add(assetId)
    }
    setExpandedMobileAssets(newExpanded)
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
    <div className="space-y-3">
      {/* Desktop Controls - Search/Filter/Add aligned horizontally under tabs */}
      <div className="hidden md:flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm"
            />
          </div>
          <Dropdown
            options={statusOptions}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            placeholder="Filter by status"
            size="sm"
            className="min-w-[200px]"
          />
        </div>
        
        {/* Hidden Add Button for parent component to trigger */}
        <button
          data-add-button
          onClick={() => setShowCreateAsset(true)}
          className="hidden"
        >
          Add Asset
        </button>
      </div>

      {/* Desktop: Accordion View */}
      <div className="hidden md:block">
        {filteredAssets.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-neutral-200">
            <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No Assets Found</h3>
            <p className="text-gray-600 font-inter mt-2">Get started by adding your first asset.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className="min-w-[180px]"><span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Asset Name</span></div>
                  <div className="min-w-[120px]"><span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Type</span></div>
                  <div className="min-w-[140px]"><span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Location</span></div>
                  <div className="min-w-[120px]"><span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Status</span></div>
                  <div className="flex-1"><span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Manufacturer</span></div>
                </div>
                <div className="min-w-[180px] text-center"><span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Actions</span></div>
              </div>
            </div>
            {filteredAssets.map((asset, index) => {
              const isExpanded = expandedDesktopAssets.has(asset.id)
              const isLastRow = index === filteredAssets.length - 1
              return (
                <div key={asset.id} className={`bg-white ${!isLastRow ? 'border-b border-neutral-200' : ''}`}>
                  <div onClick={() => toggleDesktopExpanded(asset.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="min-w-[180px]"><h4 className="text-sm font-medium text-neutral-900 font-inter">{asset.name}</h4></div>
                      <div className="min-w-[120px]"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(asset.type || '')}`}>{asset.type || 'N/A'}</span></div>
                      <div className="min-w-[140px]"><span className="text-sm text-neutral-900 font-inter">{asset.locationDescription || 'No location'}</span></div>
                      <div className="min-w-[120px]"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span></div>
                      <div className="flex-1"><span className="text-sm text-neutral-900 font-inter">{asset.manufacturer || 'N/A'}</span></div>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center gap-1.5"><Edit className="h-3.5 w-3.5" />Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-inter flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                      <button onClick={(e) => { e.stopPropagation(); toggleDesktopExpanded(asset.id); }} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors" title={isExpanded ? 'Show less' : 'Show more'}><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} /></button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-neutral-50">
                      <div className="grid grid-cols-3 gap-6 mt-2">
                        {asset.modelNumber && (<div><h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Model Number</h5><p className="text-sm text-neutral-900 font-inter">{asset.modelNumber}</p></div>)}
                        {asset.serialNumber && (<div><h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Serial Number</h5><p className="text-sm text-neutral-900 font-inter">{asset.serialNumber}</p></div>)}
                        {asset.warrantyExpiryDate && (<div><h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Warranty Expiry</h5><p className="text-sm text-neutral-900 font-inter">{formatDate(asset.warrantyExpiryDate)}</p></div>)}
                      </div>
                      {asset.notes && (<div className="mt-3"><h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Notes</h5><p className="text-sm text-neutral-700 font-inter">{asset.notes}</p></div>)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mobile: Accordion View */}
      <div className="md:hidden space-y-2">
        {filteredAssets.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center"><Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-neutral-900 font-inter">No Assets Found</h3><p className="text-gray-600 font-inter">Get started by adding your first asset.</p></div>
        ) : (
          filteredAssets.map((asset) => {
            const isExpanded = expandedMobileAssets.has(asset.id)
            return (
              <div key={asset.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                <div onClick={() => toggleMobileExpanded(asset.id)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors">
                  <div className="flex-1 pr-3 min-w-0"><h4 className="text-sm font-medium text-neutral-900 font-inter truncate">{asset.name}</h4><p className="text-xs text-neutral-500 font-inter mt-0.5">{asset.locationDescription || 'No location'}</p></div>
                  <div className="flex items-center gap-2 flex-shrink-0"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span><ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} /></div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-neutral-100">
                    <div className="space-y-3 mt-3">
                      {asset.manufacturer && (<div className="flex items-center justify-between"><span className="text-xs font-medium text-neutral-500 font-inter">Manufacturer:</span><span className="text-sm text-neutral-900 font-inter">{asset.manufacturer}</span></div>)}
                      {asset.type && (<div className="flex items-center justify-between"><span className="text-xs font-medium text-neutral-500 font-inter">Type:</span><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(asset.type)}`}>{asset.type}</span></div>)}
                      <div className="flex gap-2 pt-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="flex-1 px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center justify-center min-h-[44px]"><Edit className="h-5 w-5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }} className="flex-1 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-inter flex items-center justify-center min-h-[44px]"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Create Asset Modal */}
      {showCreateAsset && (
        <Modal
          isOpen={showCreateAsset}
          onClose={() => setShowCreateAsset(false)}
          title="Add New Asset"
          size="lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Asset Name *</label>
                <input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Type *</label>
                <input
                  type="text"
                  value={assetForm.type}
                  onChange={(e) => setAssetForm({...assetForm, type: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  placeholder="e.g. Fire Extinguisher, Boiler"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Category *</label>
                <Dropdown
                  options={categoryOptions}
                  value={assetForm.category}
                  onChange={(value) => setAssetForm({...assetForm, category: value as AssetCategory})}
                  placeholder="Select Category"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <Dropdown
                  options={statusOptions.filter(opt => opt.value !== 'all')}
                  value={assetForm.status}
                  onChange={(value) => setAssetForm({...assetForm, status: value as AssetStatus})}
                  placeholder="Select Status"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Location</label>
                <input
                  type="text"
                  value={assetForm.locationDescription}
                  onChange={(e) => setAssetForm({...assetForm, locationDescription: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Manufacturer</label>
                <input
                  type="text"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Model Number</label>
                <input
                  type="text"
                  value={assetForm.modelNumber}
                  onChange={(e) => setAssetForm({...assetForm, modelNumber: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Serial Number</label>
                <input
                  type="text"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Installation Date</label>
                <input
                  type="date"
                  value={assetForm.installationDate}
                  onChange={(e) => setAssetForm({...assetForm, installationDate: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Warranty Expiry</label>
                <input
                  type="date"
                  value={assetForm.warrantyExpiryDate}
                  onChange={(e) => setAssetForm({...assetForm, warrantyExpiryDate: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={assetForm.notes}
                onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter resize-none"
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
