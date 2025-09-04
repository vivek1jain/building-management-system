import React, { useState, useEffect } from 'react'
import { Search, Plus, Star, Edit, Trash2, Eye, Truck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { supplierService } from '../../services/supplierService'
import { Supplier } from '../../types'
import DataTable, { Column, TableAction } from '../UI/DataTable'
import Button from '../UI/Button'
import { Modal, ModalFooter } from '../UI'

const SuppliersDataTableSimple: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId } = useBuilding()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showViewSupplier, setShowViewSupplier] = useState(false)

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    specialty: 'plumbing',
    rating: 0
  })

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true)
        console.log('🔥 Loading suppliers...')
        const suppliersData = await supplierService.getSuppliers()
        console.log('🔥 Suppliers loaded:', suppliersData.length)
        setSuppliers(suppliersData)
      } catch (error) {
        console.error('🚨 Error loading suppliers:', error)
        if (currentUser) {
          addNotification({
            title: 'Error',
            message: 'Failed to load suppliers',
            type: 'error',
            userId: currentUser.id
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadSuppliers()
  }, [])

  const handleCreateSupplier = async () => {
    if (!currentUser) return

    // Validate required fields
    if (!supplierForm.name || !supplierForm.email || !supplierForm.companyName) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields (Name, Email, Company)',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Creating supplier...')
      const supplierData = {
        name: supplierForm.name,
        email: supplierForm.email,
        phone: supplierForm.phone,
        role: 'supplier' as const,
        companyName: supplierForm.companyName,
        specialties: [supplierForm.specialty],
        rating: supplierForm.rating || 0,
        isActive: true,
      }

      const supplierId = await supplierService.createSupplier(supplierData)
      console.log('🔥 Supplier created with ID:', supplierId)
      
      // Add to local state
      const newSupplier: Supplier = {
        id: supplierId,
        ...supplierData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setSuppliers(prev => [...prev, newSupplier])
      setShowCreateSupplier(false)
      
      // Reset form
      setSupplierForm({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        specialty: 'plumbing',
        rating: 0
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
    setSelectedSupplier(supplier)
    setShowViewSupplier(true)
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400 fill-yellow-400"
          />
        )
      } else {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-gray-300 fill-gray-200"
          />
        )
      }
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => 
    (supplier.isActive !== false) &&
    (supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Define table columns
  const columns: Column<Supplier>[] = [
    {
      key: 'supplierInfo',
      title: 'Supplier',
      dataIndex: 'name',
      sortable: true,
      render: (value, supplier) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {supplier.companyName || 'Unknown Supplier'}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {supplier.name}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      sortable: true,
      render: (value, supplier) => (
        <div className="text-sm text-neutral-900">{supplier.email}</div>
      )
    },
    {
      key: 'phone',
      title: 'Phone',
      dataIndex: 'phone',
      sortable: true,
      render: (value, supplier) => (
        <div className="text-sm text-neutral-900">{supplier.phone || 'N/A'}</div>
      )
    },
    {
      key: 'specialty',
      title: 'Specialties',
      dataIndex: 'specialties',
      sortable: false,
      render: (value, supplier) => (
        <div className="flex flex-wrap gap-1">
          {(supplier.specialties || []).map((specialty, index) => (
            <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {specialty}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'rating',
      title: 'Rating',
      dataIndex: 'rating',
      sortable: true,
      render: (value, supplier) => (
        <div className="text-sm text-neutral-900">
          {supplier.rating ? renderStars(supplier.rating) : 'No rating'}
        </div>
      )
    }
  ]

  // Define row actions
  const rowActions: TableAction<Supplier>[] = [
    {
      key: 'view',
      label: 'View',
      onClick: handleViewSupplier,
      variant: 'outline'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-900">Suppliers</h2>
        </div>
        <Button onClick={() => setShowCreateSupplier(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <DataTable
        data={filteredSuppliers}
        columns={columns}
        actions={rowActions}
        searchable={false}
        emptyMessage="No suppliers found. Get started by adding your first supplier."
      />

      {/* Create Supplier Modal */}
      {showCreateSupplier && (
        <Modal
          isOpen={showCreateSupplier}
          onClose={() => setShowCreateSupplier(false)}
          title="Add New Supplier"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={supplierForm.companyName}
                onChange={(e) => setSupplierForm({...supplierForm, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Specialty</label>
                <select
                  value={supplierForm.specialty}
                  onChange={(e) => setSupplierForm({...supplierForm, specialty: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="security">Security</option>
                  <option value="landscaping">Landscaping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Rating</label>
                <select
                  value={supplierForm.rating}
                  onChange={(e) => setSupplierForm({...supplierForm, rating: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCreateSupplier(false)}>Cancel</Button>
              <Button onClick={handleCreateSupplier}>Add Supplier</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* View Supplier Modal */}
      {showViewSupplier && selectedSupplier && (
        <Modal
          isOpen={showViewSupplier}
          onClose={() => setShowViewSupplier(false)}
          title="Supplier Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <p className="text-sm text-neutral-900">{selectedSupplier.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company</label>
                <p className="text-sm text-neutral-900">{selectedSupplier.companyName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <p className="text-sm text-neutral-900">{selectedSupplier.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                <p className="text-sm text-neutral-900">{selectedSupplier.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Specialties</label>
                <div className="flex flex-wrap gap-1">
                  {(selectedSupplier.specialties || []).map((specialty, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {selectedSupplier.rating ? renderStars(selectedSupplier.rating) : 'No rating'}
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowViewSupplier(false)}>Close</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SuppliersDataTableSimple
