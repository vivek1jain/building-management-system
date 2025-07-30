import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getAllBuildings } from '../services/buildingService'
import { getFlatStats } from '../services/flatService'
import { Flat, Building } from '../types'
import { 
  Home, 
  Users, 
  DollarSign, 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Star
} from 'lucide-react'

const FlatsPage: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateFlat, setShowCreateFlat] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form states
  const [flatForm, setFlatForm] = useState({
    flatNumber: '',
    floor: 1,
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    type: 'apartment',
    status: 'available',
    groundRent: 0,
    serviceCharge: 0,
    description: ''
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadFlats()
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
      addNotification({
        title: 'Error',
        message: 'Failed to load buildings',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFlats = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      // For now, we'll create mock data since the flat service functions don't exist yet
      const mockFlats: Flat[] = [
        {
          id: '1',
          buildingId: selectedBuilding,
          flatNumber: 'A101',
          floor: 1,
          area: 850,
          bedrooms: 2,
          bathrooms: 1,
          type: 'apartment',
          status: 'occupied',
          groundRent: 1200,
          serviceCharge: 300,
          description: 'Spacious 2-bedroom apartment with garden view',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          buildingId: selectedBuilding,
          flatNumber: 'A102',
          floor: 1,
          area: 650,
          bedrooms: 1,
          bathrooms: 1,
          type: 'apartment',
          status: 'available',
          groundRent: 900,
          serviceCharge: 250,
          description: 'Modern 1-bedroom apartment',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          buildingId: selectedBuilding,
          flatNumber: 'B201',
          floor: 2,
          area: 1200,
          bedrooms: 3,
          bathrooms: 2,
          type: 'penthouse',
          status: 'occupied',
          groundRent: 2000,
          serviceCharge: 500,
          description: 'Luxury penthouse with terrace',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      setFlats(mockFlats)
    } catch (error) {
      console.error('Error loading flats:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load flats',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlat = async () => {
    if (!selectedBuilding || !currentUser) return
    
    try {
      setLoading(true)
      // Mock creation - in real implementation, this would call the flat service
      const newFlat: Flat = {
        id: Date.now().toString(),
        buildingId: selectedBuilding,
        ...flatForm,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setFlats([...flats, newFlat])
      setShowCreateFlat(false)
      setFlatForm({
        flatNumber: '',
        floor: 1,
        area: 0,
        bedrooms: 1,
        bathrooms: 1,
        type: 'apartment',
        status: 'available',
        groundRent: 0,
        serviceCharge: 0,
        description: ''
      })
      
      addNotification({
        title: 'Success',
        message: 'Flat created successfully',
        type: 'success',
        userId: 'current'
      })
    } catch (error) {
      console.error('Error creating flat:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to create flat',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800'
      case 'available': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'reserved': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'apartment': return 'bg-blue-100 text-blue-800'
      case 'penthouse': return 'bg-purple-100 text-purple-800'
      case 'studio': return 'bg-green-100 text-green-800'
      case 'duplex': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const filteredFlats = flats.filter(flat => {
    const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flat.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || flat.status === filterStatus
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flats Management</h1>
          <p className="text-gray-600 mt-1">Manage flat units and occupancy</p>
        </div>
        <button
          onClick={() => setShowCreateFlat(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Flat</span>
        </button>
      </div>

      {/* Building Selection */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Building
        </label>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search flats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFlats.map((flat) => (
          <div key={flat.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{flat.flatNumber}</h3>
                <p className="text-sm text-gray-600">Floor {flat.floor}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-blue-600">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-green-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(flat.type)}`}>
                  {flat.type}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flat.status)}`}>
                  {flat.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Area</span>
                <span className="text-sm font-medium text-gray-900">{flat.area} sq ft</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bedrooms</span>
                <span className="text-sm font-medium text-gray-900">{flat.bedrooms}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ground Rent</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(flat.groundRent)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Charge</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(flat.serviceCharge)}</span>
              </div>
            </div>
            
            {flat.description && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">{flat.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Flat Modal */}
      {showCreateFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Flat</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
                <input
                  type="text"
                  value={flatForm.flatNumber}
                  onChange={(e) => setFlatForm({...flatForm, flatNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <input
                    type="number"
                    value={flatForm.floor}
                    onChange={(e) => setFlatForm({...flatForm, floor: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq ft)</label>
                  <input
                    type="number"
                    value={flatForm.area}
                    onChange={(e) => setFlatForm({...flatForm, area: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={flatForm.bedrooms}
                    onChange={(e) => setFlatForm({...flatForm, bedrooms: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={flatForm.bathrooms}
                    onChange={(e) => setFlatForm({...flatForm, bathrooms: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={flatForm.type}
                  onChange={(e) => setFlatForm({...flatForm, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="studio">Studio</option>
                  <option value="duplex">Duplex</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={flatForm.status}
                  onChange={(e) => setFlatForm({...flatForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ground Rent</label>
                  <input
                    type="number"
                    value={flatForm.groundRent}
                    onChange={(e) => setFlatForm({...flatForm, groundRent: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge</label>
                  <input
                    type="number"
                    value={flatForm.serviceCharge}
                    onChange={(e) => setFlatForm({...flatForm, serviceCharge: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={flatForm.description}
                  onChange={(e) => setFlatForm({...flatForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateFlat(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFlat}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Create Flat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlatsPage 