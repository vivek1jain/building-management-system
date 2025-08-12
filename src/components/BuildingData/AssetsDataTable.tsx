import React, { useState, useEffect } from 'react'
import { Search, Plus, Wrench, Edit, Trash2, Eye, Building as BuildingIcon, Package, MapPin } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Asset, Building, AssetStatus } from '../../types'
import BulkImportExport from './BulkImportExport'
import { exportAssetsToCSV } from '../../utils/csvExport'
import { ImportValidationResult } from '../../utils/csvImport'
import { mockBuildings, mockAssets } from '../../services/mockData'

const AssetsDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
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
    initializeData()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadAssets()
    }
  }, [selectedBuilding])

  const initializeData = async () => {
    try {
      setLoading(true)
      // Use mock buildings for testing
      setBuildings(mockBuildings)
      if (mockBuildings.length > 0) {
        setSelectedBuilding(mockBuildings[0].id)
      }
      // Load all assets from mock data
      setAssets(mockAssets)
    } catch (error) {
      console.error('Error initializing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssets = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      // Filter mock assets data by selected building
      const buildingAssets = mockAssets.filter(asset => asset.buildingId === selectedBuilding)
      setAssets(buildingAssets)
    } catch (error) {
      console.error('Error loading assets:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load assets',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAsset = async () => {
    if (!currentUser || !selectedBuilding) return
    
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
      const newAsset: Asset & { isActive: boolean } = {
        id: `asset-${Date.now()}`,
        name: assetForm.name,
        buildingId: selectedBuilding,
        type: assetForm.type,
        status: assetForm.status,
        locationDescription: assetForm.locationDescription,
        manufacturer: assetForm.manufacturer,
        modelNumber: assetForm.modelNumber,
        serialNumber: assetForm.serialNumber,
        installationDate: assetForm.installationDate ? new Date(assetForm.installationDate) : null,
        warrantyExpiryDate: assetForm.warrantyExpiryDate ? new Date(assetForm.warrantyExpiryDate) : null,
        notes: assetForm.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUid: currentUser.id,
        isActive: true
      }

      setAssets(prev => [...prev, newAsset])
      
      // Reset form
      setAssetForm({
        name: '',
        type: '',
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
        message: 'Asset added successfully',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error creating asset:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add asset',
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
        message: 'Please fill in all required fields',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      setAssets(prev => prev.map(a => 
        a.id === selectedAsset.id 
          ? {
              ...a,
              name: assetForm.name,
              type: assetForm.type,
              status: assetForm.status,
              locationDescription: assetForm.locationDescription,
              manufacturer: assetForm.manufacturer,
              modelNumber: assetForm.modelNumber,
              serialNumber: assetForm.serialNumber,
              installationDate: assetForm.installationDate ? new Date(assetForm.installationDate) : null,
              warrantyExpiryDate: assetForm.warrantyExpiryDate ? new Date(assetForm.warrantyExpiryDate) : null,
              notes: assetForm.notes,
              updatedAt: new Date()
            }
          : a
      ))
      
      setShowEditAsset(false)
      setSelectedAsset(null)
      
      addNotification({
        title: 'Success',
        message: 'Asset updated successfully',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error updating asset:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update asset',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    console.log('Delete asset clicked:', assetId)
    if (!currentUser) return
    
    if (window.confirm('Are you sure you want to delete this asset? This will hide the asset but it can be restored later.')) {
      try {
        // Soft delete: mark as inactive instead of removing
        setAssets(prev => prev.map(a => 
          a.id === assetId 
            ? { ...a, isActive: false, updatedAt: new Date() }
            : a
        ))
        addNotification({
          title: 'Success',
          message: 'Asset deleted successfully (can be restored)',
          type: 'success',
          userId: currentUser.id
        })
      } catch (error) {
        console.error('Error deleting asset:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete asset',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.OPERATIONAL: return 'text-green-600 bg-green-100'
      case AssetStatus.NEEDS_REPAIR: return 'text-yellow-600 bg-yellow-100'
      case AssetStatus.IN_REPAIR: return 'text-blue-600 bg-blue-100'
      case AssetStatus.DECOMMISSIONED: return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'elevator': return 'text-purple-600 bg-purple-100'
      case 'hvac': return 'text-blue-600 bg-blue-100'
      case 'safety': return 'text-red-600 bg-red-100'
      case 'electrical': return 'text-yellow-600 bg-yellow-100'
      case 'plumbing': return 'text-cyan-600 bg-cyan-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString()
  }

  const filteredAssets = assets.filter(asset => {
    // Only show active assets (soft delete implementation)
    const isActive = asset.isActive
    
    // Building-scoped filtering: only show assets for the selected building
    const matchesBuilding = !selectedBuilding || asset.buildingId === selectedBuilding
    
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.locationDescription && asset.locationDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.type && asset.type.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus
    
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
          <Package className="h-6 w-6 text-green-700" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 font-inter">Assets Management</h2>
            <p className="text-sm text-gray-600 font-inter">Track and manage building assets and equipment</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateAsset(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-inter"
        >
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      {/* Building Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 font-inter">Building:</label>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name} - {building.address}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
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
          <option value={AssetStatus.OPERATIONAL}>Operational</option>
          <option value={AssetStatus.NEEDS_REPAIR}>Needs Repair</option>
          <option value={AssetStatus.IN_REPAIR}>In Repair</option>
          <option value={AssetStatus.DECOMMISSIONED}>Decommissioned</option>
        </select>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Warranty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 font-inter">{asset.name}</div>
                    <div className="text-sm text-gray-500 font-inter">
                      {asset.manufacturer} {asset.modelNumber}
                    </div>
                    {asset.serialNumber && (
                      <div className="text-xs text-gray-400 font-inter">SN: {asset.serialNumber}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 font-inter">{asset.locationDescription || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getTypeColor(asset.type || '')}`}>
                    {asset.type || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-inter">
                  {formatDate(asset.warrantyExpiryDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewAsset(asset)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="View Asset"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditAsset(asset)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit Asset"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 font-inter">No assets found</h3>
            <p className="text-gray-600 font-inter">Get started by adding your first asset</p>
          </div>
        )}
      </div>

      {/* Create Asset Modal */}
      {showCreateAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4 font-inter">Add New Asset</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Asset Name</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Location</label>
                  <input
                    type="text"
                    value={assetForm.locationDescription}
                    onChange={(e) => setAssetForm({...assetForm, locationDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Type</label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({...assetForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value="">Select Type</option>
                    <option value="elevator">Elevator</option>
                    <option value="hvac">HVAC</option>
                    <option value="safety">Safety</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({...assetForm, status: e.target.value as AssetStatus})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value={AssetStatus.OPERATIONAL}>Operational</option>
                    <option value={AssetStatus.NEEDS_REPAIR}>Needs Repair</option>
                    <option value={AssetStatus.IN_REPAIR}>In Repair</option>
                    <option value={AssetStatus.DECOMMISSIONED}>Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Manufacturer</label>
                  <input
                    type="text"
                    value={assetForm.manufacturer}
                    onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Model Number</label>
                  <input
                    type="text"
                    value={assetForm.modelNumber}
                    onChange={(e) => setAssetForm({...assetForm, modelNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Serial Number</label>
                  <input
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Installation Date</label>
                  <input
                    type="date"
                    value={assetForm.installationDate}
                    onChange={(e) => setAssetForm({...assetForm, installationDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Warranty Expiry Date</label>
                <input
                  type="date"
                  value={assetForm.warrantyExpiryDate}
                  onChange={(e) => setAssetForm({...assetForm, warrantyExpiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                <textarea
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateAsset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAsset}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Asset Modal */}
      {showViewAsset && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Asset Details</h3>
              <button
                onClick={() => setShowViewAsset(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Asset Name</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedAsset.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Type</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getTypeColor(selectedAsset.type || 'unknown')}`}>
                    {selectedAsset.type || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Location</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedAsset.locationDescription || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Manufacturer</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedAsset.manufacturer || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Model Number</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedAsset.modelNumber || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Serial Number</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedAsset.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Installation Date</label>
                  <p className="text-sm text-gray-900 font-inter">{formatDate(selectedAsset.installationDate)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Warranty Expiry Date</label>
                <p className="text-sm text-gray-900 font-inter">{formatDate(selectedAsset.warrantyExpiryDate)}</p>
              </div>
              
              {selectedAsset.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewAsset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditAsset && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Edit Asset</h3>
              <button
                onClick={() => setShowEditAsset(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Asset Name *</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Type *</label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({...assetForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value="">Select Type</option>
                    <option value="elevator">Elevator</option>
                    <option value="hvac">HVAC</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="safety">Safety</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Location</label>
                  <input
                    type="text"
                    value={assetForm.locationDescription}
                    onChange={(e) => setAssetForm({...assetForm, locationDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({...assetForm, status: e.target.value as AssetStatus})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value={AssetStatus.OPERATIONAL}>Operational</option>
                    <option value={AssetStatus.NEEDS_REPAIR}>Needs Repair</option>
                    <option value={AssetStatus.IN_REPAIR}>In Repair</option>
                    <option value={AssetStatus.DECOMMISSIONED}>Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Manufacturer</label>
                  <input
                    type="text"
                    value={assetForm.manufacturer}
                    onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Model Number</label>
                  <input
                    type="text"
                    value={assetForm.modelNumber}
                    onChange={(e) => setAssetForm({...assetForm, modelNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Serial Number</label>
                  <input
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Installation Date</label>
                  <input
                    type="date"
                    value={assetForm.installationDate}
                    onChange={(e) => setAssetForm({...assetForm, installationDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Warranty Expiry Date</label>
                <input
                  type="date"
                  value={assetForm.warrantyExpiryDate}
                  onChange={(e) => setAssetForm({...assetForm, warrantyExpiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                <textarea
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditAsset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAsset}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter"
              >
                Update Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetsDataTable
