import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Star, Truck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { supplierService } from '../../services/supplierService'
import { Supplier } from '../../types'
import DataTable, { Column, TableAction } from '../UI/DataTable'
import Button from '../UI/Button'
import { Dropdown, DropdownOption } from '../UI'

const SuppliersDataTableIntermediate: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId } = useBuilding()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')

  // Supplier specialty dropdown options
  const specialtyOptions: DropdownOption[] = [
    { value: 'all', label: 'All Specialties', description: 'Show all suppliers' },
    { value: 'plumbing', label: 'Plumbing', description: 'Plumbing and water systems' },
    { value: 'electrical', label: 'Electrical', description: 'Electrical systems and wiring' },
    { value: 'hvac', label: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
    { value: 'cleaning', label: 'Cleaning', description: 'Cleaning and janitorial services' },
    { value: 'security', label: 'Security', description: 'Security systems and services' },
    { value: 'landscaping', label: 'Landscaping', description: 'Landscaping and gardening' }
  ];

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true)
        console.log('🔥 Loading suppliers with DataTable...')
        const suppliersData = await supplierService.getSuppliers()
        console.log('🔥 Suppliers loaded for DataTable:', suppliersData.length)
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

    if (currentUser) {
      loadSuppliers()
    }
  }, [currentUser, addNotification])

  const handleViewSupplier = (supplier: Supplier) => {
    console.log('View supplier clicked:', supplier)
    // Simple alert instead of modal for testing
    alert(`Viewing supplier: ${supplier.companyName || supplier.name}`)
  }

  const getSpecialtyColor = (specialty: string | undefined) => {
    if (!specialty) return 'text-gray-600 bg-neutral-100'
    switch (specialty.toLowerCase()) {
      case 'plumbing': return 'text-blue-600 bg-blue-100'
      case 'electrical': return 'text-yellow-600 bg-yellow-100'
      case 'hvac': return 'text-green-600 bg-green-100'
      case 'cleaning': return 'text-purple-600 bg-purple-100'
      case 'security': return 'text-red-600 bg-red-100'
      case 'landscaping': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
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
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const isActive = supplier.isActive !== false
      const matchesSearch = supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          supplier.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSpecialty = selectedSpecialty === 'all' || 
                              (supplier.specialties || []).some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase()))
      
      return isActive && matchesSearch && matchesSpecialty
    })
  }, [suppliers, searchTerm, selectedSpecialty])

  // Define table columns - simplified
  const columns: Column<Supplier>[] = useMemo(() => [
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
            <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
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
  ], [])

  // Define row actions - simplified
  const rowActions: TableAction<Supplier>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      onClick: handleViewSupplier,
      variant: 'outline'
    }
  ], [])

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
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Suppliers (DataTable Test)</h2>
            <p className="text-sm text-neutral-600">{filteredSuppliers.length} suppliers found</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search and Filter */}
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
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="min-w-[200px] px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {specialtyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredSuppliers}
        columns={columns}
        actions={rowActions}
        searchable={false} // Using our own search
        emptyMessage="No suppliers found. Get started by adding your first supplier."
        loading={loading}
      />

      {/* Debug info */}
      <div className="bg-neutral-50 rounded-lg p-4 text-xs text-neutral-600">
        <p><strong>DataTable Debug:</strong></p>
        <p>Current User: {currentUser?.email || 'None'}</p>
        <p>Selected Building: {selectedBuildingId || 'None'}</p>
        <p>Suppliers Count: {suppliers.length}</p>
        <p>Filtered Count: {filteredSuppliers.length}</p>
        <p>Loading: {loading.toString()}</p>
      </div>
    </div>
  )
}

export default SuppliersDataTableIntermediate
