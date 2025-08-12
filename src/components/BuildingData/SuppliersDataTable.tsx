import React, { useState, useEffect } from 'react'
import { Search, Plus, Star, MapPin, Edit, Trash2, Eye, Building as BuildingIcon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getAllBuildings } from '../../services/buildingService'
import { Supplier, Building } from '../../types'
import BuildingSelector from './BuildingSelector'
import BulkImportExport from './BulkImportExport'
import { exportSuppliersToCSV } from '../../utils/csvExport'
import { importSuppliersFromCSV, ImportValidationResult } from '../../utils/csvImport'
import { mockBuildings, mockSuppliers } from '../../services/mockData'

const SuppliersDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [suppliers, setSuppliers] = useState<(Supplier & { buildingId: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)
  const [showViewSupplier, setShowViewSupplier] = useState(false)
  const [showEditSupplier, setShowEditSupplier] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    specialty: '',
    rating: 0,
    notes: '',
    buildingId: ''
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        // Use mock buildings for testing
        setBuildings(mockBuildings)
        if (mockBuildings.length > 0) {
          setSelectedBuilding(mockBuildings[0].id)
        }
        // Load all suppliers from mock data
        setSuppliers(mockSuppliers)
      } catch (error) {
        console.error('Error initializing data:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      // Initialize form with selected building if not already set
      if (!supplierForm.buildingId) {
        setSupplierForm(prev => ({ ...prev, buildingId: selectedBuilding }))
      }
    }
  }, [selectedBuilding])



  const handleCreateSupplier = async () => {
    if (!supplierForm.buildingId || !currentUser) {
      addNotification({
        title: 'Error',
        message: 'Please select a building and ensure you are logged in',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }
    
    try {
      const newSupplier: Supplier & { buildingId: string } = {
        id: `supplier-${Date.now()}`,
        name: supplierForm.name,
        email: supplierForm.email,
        phone: supplierForm.phone,
        role: 'supplier' as const,
        companyName: supplierForm.companyName,
        specialties: [supplierForm.specialty],
        rating: supplierForm.rating || 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        buildingId: selectedBuilding,
      }

      setSuppliers(prev => [...prev, newSupplier])
      setShowCreateSupplier(false)
      
      // Reset form
      setSupplierForm({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        specialty: '',
        rating: 0,
        notes: '',
        buildingId: selectedBuilding || ''
      })

      addNotification({
        title: 'Success',
        message: 'Supplier created successfully',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error creating supplier:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to create supplier',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleViewSupplier = (supplier: Supplier) => {
    console.log('View supplier clicked:', supplier)
    setSelectedSupplier(supplier)
    setShowViewSupplier(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    console.log('Edit supplier clicked:', supplier)
    setSelectedSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || '',
      companyName: supplier.companyName,
      specialty: supplier.specialties[0] || '',
      rating: supplier.rating || 0,
      notes: '',
      buildingId: (supplier as any).buildingId || selectedBuilding || ''
    })
    setShowEditSupplier(true)
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    console.log('Delete supplier clicked:', supplierId)
    if (!currentUser) return
    
    if (window.confirm('Are you sure you want to delete this supplier? This will hide the supplier but it can be restored later.')) {
      try {
        // Soft delete: mark as inactive instead of removing
        setSuppliers(prev => prev.map(s => 
          s.id === supplierId 
            ? { ...s, isActive: false, updatedAt: new Date() }
            : s
        ))
        addNotification({
          title: 'Success',
          message: 'Supplier deleted successfully (can be restored)',
          type: 'success',
          userId: currentUser.id
        })
      } catch (error) {
        console.error('Error deleting supplier:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete supplier',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier || !currentUser) return
    
    try {
      const updatedSupplier: Supplier = {
        ...selectedSupplier,
        name: supplierForm.name,
        email: supplierForm.email,
        phone: supplierForm.phone,
        companyName: supplierForm.companyName,
        specialties: [supplierForm.specialty],
        rating: supplierForm.rating || 0,
        updatedAt: new Date(),
      }

      setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? updatedSupplier : s))
      setShowEditSupplier(false)
      setSelectedSupplier(null)
      
      // Reset form
      setSupplierForm({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        specialty: '',
        rating: 0,
        notes: '',
        buildingId: selectedBuilding || ''
      })

      addNotification({
        title: 'Success',
        message: 'Supplier updated successfully',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error updating supplier:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update supplier',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const getSpecialtyColor = (specialty: string | undefined) => {
    if (!specialty) return 'text-gray-600 bg-gray-100'
    switch (specialty.toLowerCase()) {
      case 'plumbing': return 'text-blue-600 bg-blue-100'
      case 'electrical': return 'text-yellow-600 bg-yellow-100'
      case 'hvac': return 'text-green-600 bg-green-100'
      case 'cleaning': return 'text-purple-600 bg-purple-100'
      case 'security': return 'text-red-600 bg-red-100'
      case 'landscaping': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Bulk import/export handlers
  const handleExportSuppliers = (buildingId: string, buildingName?: string) => {
    const buildingSuppliers = suppliers.filter(s => s.buildingId === buildingId && s.isActive)
    exportSuppliersToCSV(buildingSuppliers, buildingName)
  }

  const handleImportSuppliers = (csvText: string, buildingId: string): ImportValidationResult<any> => {
    return importSuppliersFromCSV(csvText, buildingId)
  }

  const handleImportConfirm = (validSuppliers: (Supplier & { buildingId: string })[]) => {
    setSuppliers(prev => [...prev, ...validSuppliers])
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-sm"
          />
        )
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <Star className="h-4 w-4 text-gray-300 fill-gray-200 absolute" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
            </div>
          </div>
        )
      } else {
        // Empty star
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-gray-300 fill-gray-200"
          />
        )
      }
    }
    
    return (
      <div className="flex items-center gap-0.5">
        <div className="flex items-center">
          {stars}
        </div>
        <span className="ml-1.5 text-xs text-gray-600 font-medium font-inter">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  // Debug logging
  console.log('Suppliers data:', suppliers)
  console.log('Selected building:', selectedBuilding)
  console.log('Search term:', searchTerm)
  console.log('Selected specialty:', selectedSpecialty)

  const filteredSuppliers = suppliers.filter(supplier => {
    // Only show active suppliers (soft delete implementation)
    const isActive = supplier.isActive
    
    // Building-scoped filtering: only show suppliers for the selected building
    const matchesBuilding = !selectedBuilding || supplier.buildingId === selectedBuilding
    
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            supplier.specialties.some(s => s.toLowerCase() === selectedSpecialty.toLowerCase())
    
    return isActive && matchesBuilding && matchesSearch && matchesSpecialty
  })
  
  console.log('Filtered suppliers:', filteredSuppliers)

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
          <BuildingIcon className="h-5 w-5 text-green-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 font-inter">Suppliers Management</h2>
            <p className="text-sm text-gray-600 font-inter">Manage service providers and contractors</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateSupplier(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-inter"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
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
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
          />
        </div>
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
        >
          <option value="all">All Specialties</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="hvac">HVAC</option>
          <option value="cleaning">Cleaning</option>
          <option value="security">Security</option>
          <option value="landscaping">Landscaping</option>
        </select>
        
        {/* Bulk Import/Export */}
        <BulkImportExport
          dataType="suppliers"
          buildings={buildings}
          selectedBuildingId={selectedBuilding}
          onExport={handleExportSuppliers}
          onImport={handleImportSuppliers}
          onImportConfirm={handleImportConfirm}
          className="ml-auto"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Specialty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 font-inter">{supplier.name}</div>
                    {supplier.companyName && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 font-inter">{supplier.companyName}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-inter">{supplier.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-inter">{supplier.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {supplier.specialties.map((specialty, index) => (
                      <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supplier.rating ? renderStars(supplier.rating) : 'No rating'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewSupplier(supplier)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="View supplier details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditSupplier(supplier)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit supplier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete supplier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <BuildingIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 font-inter">No suppliers found</h3>
            <p className="text-gray-600 font-inter">Get started by adding your first supplier</p>
          </div>
        )}
      </div>

      {/* Create Supplier Modal */}
      {showCreateSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4 font-inter">Add New Supplier</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Name</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Company Name</label>
                <input
                  type="text"
                  value={supplierForm.companyName}
                  onChange={(e) => setSupplierForm({...supplierForm, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Phone</label>
                  <input
                    type="tel"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Specialty</label>
                  <select
                    value={supplierForm.specialty}
                    onChange={(e) => setSupplierForm({...supplierForm, specialty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value="">Select Specialty</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Security">Security</option>
                    <option value="Landscaping">Landscaping</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Rating</label>
                  <select
                    value={supplierForm.rating}
                    onChange={(e) => setSupplierForm({...supplierForm, rating: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4.5}>4.5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3.5}>3.5 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2.5}>2.5 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1.5}>1.5 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Notes</label>
                <textarea
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateSupplier(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSupplier}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter"
              >
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {showViewSupplier && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Supplier Details</h3>
              <button
                onClick={() => setShowViewSupplier(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Name</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedSupplier.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Company</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedSupplier.companyName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Email</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedSupplier.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Phone</label>
                  <p className="text-sm text-gray-900 font-inter">{selectedSupplier.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Specialties</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedSupplier.specialties.map((specialty, index) => (
                      <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Rating</label>
                  <div className="flex items-center gap-1">
                    {selectedSupplier.rating ? renderStars(selectedSupplier.rating) : 'No rating'}
                    {selectedSupplier.rating && <span className="text-sm text-gray-600 ml-1 font-inter">{selectedSupplier.rating}</span>}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  selectedSupplier.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {selectedSupplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewSupplier(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplier && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Edit Supplier</h3>
              <button
                onClick={() => setShowEditSupplier(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Name</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Company Name</label>
                <input
                  type="text"
                  value={supplierForm.companyName}
                  onChange={(e) => setSupplierForm({...supplierForm, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Phone</label>
                  <input
                    type="tel"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Specialty</label>
                  <select
                    value={supplierForm.specialty}
                    onChange={(e) => setSupplierForm({...supplierForm, specialty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value="">Select specialty</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Security">Security</option>
                    <option value="Landscaping">Landscaping</option>
                    <option value="Maintenance">General Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Rating</label>
                  <select
                    value={supplierForm.rating}
                    onChange={(e) => setSupplierForm({...supplierForm, rating: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  >
                    <option value={0}>No rating</option>
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditSupplier(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSupplier}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter"
              >
                Update Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuppliersDataTable
