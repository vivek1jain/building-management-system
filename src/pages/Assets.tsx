import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getAllBuildings } from '../services/buildingService'
import { Asset, Building, AssetStatus } from '../types'
import { 
  Package, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  MapPin
} from 'lucide-react'

const AssetsPage: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAsset, setShowCreateAsset] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form states
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
    notes: ''
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadAssets()
    }
  }, [selectedBuilding])

  const loadBuildings = async () => {
    try {
      setLoading(true)
      const buildingsData = await getAllBuildings()
      setBuildings(buildingsData)
      
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('Error loading buildings:', error)
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

  const loadAssets = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      // Mock data for demonstration - replace with actual service call
      const mockAssets: Asset[] = [
        {
          id: '1',
          buildingId: selectedBuilding,
          name: 'Main Elevator',
          description: 'Primary passenger elevator serving all floors',
          location: 'Central Lobby',
          installationDate: new Date('2020-01-15'),
          manufacturer: 'Otis',
          model: 'Gen2 Premier',
          serialNumber: 'OT-2020-001',
          warrantyExpiry: new Date('2025-01-15'),
          status: 'operational',
          category: 'elevator',
          maintenanceSchedule: 'monthly',
          notes: 'Regular maintenance required',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          buildingId: selectedBuilding,
          name: 'HVAC System - Floor 1',
          description: 'Heating, ventilation, and air conditioning for ground floor',
          location: 'Mechanical Room 1',
          installationDate: new Date('2019-06-01'),
          manufacturer: 'Carrier',
          model: 'AquaEdge 19DV',
          serialNumber: 'CR-2019-045',
          warrantyExpiry: new Date('2024-06-01'),
          status: 'needs_repair',
          category: 'hvac',
          maintenanceSchedule: 'quarterly',
          notes: 'Requires filter replacement',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          buildingId: selectedBuilding,
          name: 'Fire Alarm System',
          description: 'Building-wide fire detection and alarm system',
          location: 'Throughout Building',
          installationDate: new Date('2018-03-10'),
          manufacturer: 'Honeywell',
          model: 'NOTIFIER NFS2-3030',
          serialNumber: 'HW-2018-012',
          warrantyExpiry: new Date('2023-03-10'),
          status: 'operational',
          category: 'safety',
          maintenanceSchedule: 'monthly',
          notes: 'Annual inspection due',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      setAssets(mockAssets)
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
    if (!selectedBuilding || !currentUser) return
    
    try {
      // In a real implementation, this would call an asset service
      const newAsset: Asset = {
        id: Date.now().toString(),
        buildingId: selectedBuilding,
        name: assetForm.name,
        description: assetForm.description,
        location: assetForm.location,
        installationDate: new Date(assetForm.installationDate),
        manufacturer: assetForm.manufacturer,
        model: assetForm.model,
        serialNumber: assetForm.serialNumber,
        warrantyExpiry: new Date(assetForm.warrantyExpiry),
        status: assetForm.status as any,
        category: assetForm.category,
        maintenanceSchedule: assetForm.maintenanceSchedule,
        notes: assetForm.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setAssets(prev => [...prev, newAsset])
      setShowCreateAsset(false)
      
      // Reset form
      setAssetForm({
        name: '',
        description: '',
        location: '',
        installationDate: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        warrantyExpiry: '',
        status: 'operational',
        category: 'equipment',
        maintenanceSchedule: 'monthly',
        notes: ''
      })

      addNotification({
        title: 'Success',
        message: 'Asset created successfully',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error creating asset:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to create asset',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100'
      case 'needs_repair': return 'text-yellow-600 bg-yellow-100'
      case 'in_repair': return 'text-blue-600 bg-blue-100'
      case 'decommissioned': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'elevator': return 'text-purple-600 bg-purple-100'
      case 'hvac': return 'text-blue-600 bg-blue-100'
      case 'safety': return 'text-red-600 bg-red-100'
      case 'electrical': return 'text-yellow-600 bg-yellow-100'
      case 'plumbing': return 'text-cyan-600 bg-cyan-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString()
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

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
          <Package className="h-6 w-6 text-gray-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assets Management</h2>
            <p className="text-sm text-gray-600">Track and manage building assets and equipment</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateAsset(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      {/* Building Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Building:</label>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="operational">Operational</option>
          <option value="needs_repair">Needs Repair</option>
          <option value="in_repair">In Repair</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Warranty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    <div className="text-sm text-gray-500">{asset.description}</div>
                    <div className="text-xs text-gray-400">
                      {asset.manufacturer} {asset.model}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{asset.location}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(asset.category)}`}>
                    {asset.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(asset.warrantyExpiry)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">Get started by adding your first asset</p>
          </div>
        )}
      </div>

      {/* Create Asset Modal */}
      {showCreateAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Asset</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({...assetForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={assetForm.description}
                  onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={assetForm.manufacturer}
                    onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={assetForm.model}
                    onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({...assetForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="equipment">Equipment</option>
                    <option value="elevator">Elevator</option>
                    <option value="hvac">HVAC</option>
                    <option value="safety">Safety</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={assetForm.installationDate}
                    onChange={(e) => setAssetForm({...assetForm, installationDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={assetForm.warrantyExpiry}
                    onChange={(e) => setAssetForm({...assetForm, warrantyExpiry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({...assetForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operational">Operational</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="in_repair">In Repair</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Schedule</label>
                  <select
                    value={assetForm.maintenanceSchedule}
                    onChange={(e) => setAssetForm({...assetForm, maintenanceSchedule: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateAsset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAsset}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetsPage
