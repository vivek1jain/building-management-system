import { Search, Plus, Star, Edit, Trash2, Eye, Building as BuildingIcon, ChevronDown, Truck } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { supplierService } from '../../services/supplierService'
import { Supplier, Building } from '../../types'
import { Modal, ModalFooter, Dropdown, DropdownOption } from '../UI'
import Button from '../UI/Button'

const SuppliersDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId, selectedBuilding } = useBuilding()
  const [suppliers, setSuppliers] = useState<(Supplier & { buildingId: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)
  const [showViewSupplier, setShowViewSupplier] = useState(false)
  const [showEditSupplier, setShowEditSupplier] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [expandedDesktopSuppliers, setExpandedDesktopSuppliers] = useState<Set<string>>(new Set())
  const [expandedMobileSuppliers, setExpandedMobileSuppliers] = useState<Set<string>>(new Set())

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

  // Rating dropdown options
  const ratingOptions: DropdownOption[] = [
    { value: '5', label: '5', description: 'Excellent' },
    { value: '4.5', label: '4.5', description: 'Very good' },
    { value: '4', label: '4', description: 'Good' },
    { value: '3.5', label: '3.5', description: 'Above average' },
    { value: '3', label: '3', description: 'Average' },
    { value: '2.5', label: '2.5', description: 'Below average' },
    { value: '2', label: '2', description: 'Poor' },
    { value: '1.5', label: '1.5', description: 'Very poor' },
    { value: '1', label: '1', description: 'Terrible' }
  ];

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

  // Load suppliers on component mount
  useEffect(() => {
    const loadInitialSuppliers = async () => {
      try {
        setLoading(true)
        console.log('🔥 Loading suppliers from Firebase...')
        const suppliersData = await supplierService.getSuppliers()
        console.log('🔥 Suppliers loaded:', suppliersData.length)
        // Add buildingId to suppliers for compatibility with existing code
        const suppliersWithBuilding = suppliersData.map(supplier => ({
          ...supplier,
          buildingId: selectedBuildingId || ''
        }))
        setSuppliers(suppliersWithBuilding)
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

    loadInitialSuppliers()
  }, [])

  // Subscribe to real-time supplier updates
  useEffect(() => {
    if (!selectedBuildingId) return

    console.log('🔥 Setting up real-time supplier subscription...')
    const unsubscribe = supplierService.subscribeToSuppliers((suppliersData) => {
      console.log('🔥 Received real-time supplier update:', suppliersData.length)
      // Add buildingId to suppliers for compatibility with existing code
      const suppliersWithBuilding = suppliersData.map(supplier => ({
        ...supplier,
        buildingId: selectedBuildingId
      }))
      setSuppliers(suppliersWithBuilding)
    })

    return () => {
      console.log('🔥 Unsubscribing from supplier updates')
      unsubscribe()
    }
  }, [selectedBuildingId])

  useEffect(() => {
    if (selectedBuildingId) {
      // Initialize form with selected building if not already set
      if (!supplierForm.buildingId) {
        setSupplierForm(prev => ({ ...prev, buildingId: selectedBuildingId }))
      }
    }
  }, [selectedBuildingId])



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

    // Validate required fields
    if (!supplierForm.name || !supplierForm.email || !supplierForm.companyName || !supplierForm.specialty) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields (Name, Email, Company, Specialty)',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Creating supplier in Firebase...')
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
      
      // Add to local state with the Firebase-generated ID
      const newSupplier: Supplier & { buildingId: string } = {
        id: supplierId,
        ...supplierData,
        createdAt: new Date(),
        updatedAt: new Date(),
        buildingId: selectedBuildingId,
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
        buildingId: selectedBuildingId || ''
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
      name: supplier.companyName || 'Unknown Supplier',
      email: supplier.email,
      phone: supplier.phone || '',
      companyName: supplier.companyName,
      specialty: (supplier.specialties || [])[0] || '',
      rating: supplier.rating || 0,
      notes: '',
      buildingId: (supplier as any).buildingId || selectedBuildingId || ''
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

    // Validate required fields
    if (!supplierForm.name || !supplierForm.email || !supplierForm.companyName || !supplierForm.specialty) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields (Name, Email, Company, Specialty)',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Updating supplier in Firebase...')
      const supplierUpdates = {
        name: supplierForm.name,
        email: supplierForm.email,
        phone: supplierForm.phone,
        companyName: supplierForm.companyName,
        specialties: [supplierForm.specialty],
        rating: supplierForm.rating || 0,
      }

      await supplierService.updateSupplier(selectedSupplier.id, supplierUpdates)
      console.log('🔥 Supplier updated successfully')

      // Update local state
      const updatedSupplier: Supplier & { buildingId: string } = {
        ...selectedSupplier as (Supplier & { buildingId: string }),
        ...supplierUpdates,
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
        buildingId: selectedBuildingId || ''
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
    if (!specialty) return 'text-gray-600 bg-neutral-100'
    switch (specialty.toLowerCase()) {
      case 'plumbing': return 'text-primary-600 bg-blue-100'
      case 'electrical': return 'text-yellow-600 bg-yellow-100'
      case 'hvac': return 'text-success-600 bg-success-100'
      case 'cleaning': return 'text-purple-600 bg-purple-100'
      case 'security': return 'text-red-600 bg-red-100'
      case 'landscaping': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
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

  // Filter suppliers with memoization
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Only show active suppliers (soft delete implementation)
      const isActive = supplier.isActive
      
      // Building-scoped filtering: only show suppliers for the selected building
      const matchesBuilding = !selectedBuildingId || supplier.buildingId === selectedBuildingId
      
      const matchesSearch = (supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (supplier.specialties || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
      
      const matchesSpecialty = selectedSpecialty === 'all' || 
                              (supplier.specialties || []).some(s => s.toLowerCase() === selectedSpecialty.toLowerCase())
      
      return isActive && matchesBuilding && matchesSearch && matchesSpecialty
    })
  }, [suppliers, selectedBuildingId, searchTerm, selectedSpecialty])

  // Toggle functions for accordion - single-expand behavior
  const toggleDesktopExpanded = (supplierId: string) => {
    if (expandedDesktopSuppliers.has(supplierId)) {
      setExpandedDesktopSuppliers(new Set())
    } else {
      setExpandedDesktopSuppliers(new Set([supplierId]))
    }
  }

  const toggleMobileExpanded = (supplierId: string) => {
    if (expandedMobileSuppliers.has(supplierId)) {
      setExpandedMobileSuppliers(new Set())
    } else {
      setExpandedMobileSuppliers(new Set([supplierId]))
    }
  }

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
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm"
            />
          </div>
          <Dropdown
            options={specialtyOptions}
            value={selectedSpecialty}
            onChange={(value) => setSelectedSpecialty(value)}
            placeholder="Filter by specialty"
            size="sm"
            className="min-w-[200px]"
          />
        </div>
        
        {/* Hidden Add Button for parent component to trigger */}
        <button
          data-add-button
          onClick={() => setShowCreateSupplier(true)}
          className="hidden"
        >
          Add Supplier
        </button>
      </div>

      {/* Desktop: Accordion View */}
      <div className="hidden md:block">
        {filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-neutral-200">
            <Truck className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No Suppliers Found</h3>
            <p className="text-gray-600 font-inter mt-2">Get started by adding your first supplier.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {/* Header Row */}
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className="min-w-[180px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Company</span>
                  </div>
                  <div className="min-w-[140px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Contact</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Email</span>
                  </div>
                </div>
                <div className="min-w-[180px] text-center">
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Actions</span>
                </div>
              </div>
            </div>
            
            {/* Data Rows */}
            {filteredSuppliers.map((supplier, index) => {
              const isExpanded = expandedDesktopSuppliers.has(supplier.id)
              const isLastRow = index === filteredSuppliers.length - 1
              
              return (
                <div key={supplier.id} className={`bg-white ${!isLastRow ? 'border-b border-neutral-200' : ''}`}>
                  {/* Collapsed View - Main Info */}
                  <div 
                    onClick={() => toggleDesktopExpanded(supplier.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      {/* Company Name */}
                      <div className="min-w-[180px]">
                        <h4 className="text-sm font-medium text-neutral-900 font-inter">
                          {supplier.companyName || 'Unknown Supplier'}
                        </h4>
                      </div>
                      
                      {/* Contact Name */}
                      <div className="min-w-[140px]">
                        <span className="text-sm text-neutral-900 font-inter">
                          {supplier.name || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Email */}
                      <div className="flex-1">
                        <span className="text-sm text-neutral-900 font-inter">
                          {supplier.email || 'No email'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditSupplier(supplier)
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center gap-1.5"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSupplier(supplier.id)
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-inter flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDesktopExpanded(supplier.id)
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        title={isExpanded ? 'Show less' : 'Show more'}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded View - Detailed Info */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-neutral-50">
                      <div className="grid grid-cols-3 gap-6 mt-2">
                        {/* Phone */}
                        <div>
                          <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Phone</h5>
                          <p className="text-sm text-neutral-900 font-inter">{supplier.phone || 'No phone'}</p>
                        </div>
                        
                        {/* Specialties */}
                        <div>
                          <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Specialties</h5>
                          <div className="flex flex-wrap gap-1">
                            {(supplier.specialties || []).map((specialty, idx) => (
                              <span key={idx} className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Rating */}
                        <div>
                          <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Rating</h5>
                          <p className="text-sm text-neutral-900 font-inter">{supplier.rating ? supplier.rating.toFixed(1) : 'No rating'}</p>
                        </div>
                      </div>
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
        {filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <Truck className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No Suppliers Found</h3>
            <p className="text-gray-600 font-inter">Get started by adding your first supplier.</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => {
            const isExpanded = expandedMobileSuppliers.has(supplier.id)
            
            return (
              <div key={supplier.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                {/* Collapsed View - Company and Email */}
                <div 
                  onClick={() => toggleMobileExpanded(supplier.id)}
                  className="p-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  {/* Full width supplier name */}
                  <div className="w-full mb-2">
                    <h4 className="text-sm font-medium text-neutral-900 font-inter overflow-hidden whitespace-nowrap text-ellipsis">
                      {supplier.companyName || 'Unknown Supplier'}
                    </h4>
                  </div>
                  
                  {/* Contact name, email, and chevron */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-500 font-inter overflow-hidden whitespace-nowrap text-ellipsis flex-shrink min-w-0">
                      {supplier.name || 'No contact name'}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs text-neutral-600 font-inter overflow-hidden whitespace-nowrap text-ellipsis max-w-[140px]">
                        {supplier.email || 'No email'}
                      </p>
                      <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>
                
                {/* Expanded View - All Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-neutral-100">
                    <div className="space-y-2 mt-3">
                      {/* Phone and Rating on same line */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-neutral-500 font-inter">Phone: </span>
                          <span className="text-xs text-neutral-900 font-inter">{supplier.phone || 'No phone'}</span>
                        </div>
                        {supplier.rating && (
                          <div className="text-right">
                            <span className="text-xs font-medium text-neutral-500 font-inter">Rating: </span>
                            <span className="text-xs text-neutral-900 font-inter">{supplier.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Specialties */}
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-medium text-neutral-500 font-inter">Specialties:</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(supplier.specialties || []).map((specialty, idx) => (
                            <span key={idx} className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditSupplier(supplier)
                          }}
                          className="flex-1 px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center justify-center min-h-[44px]"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSupplier(supplier.id)
                          }}
                          className="flex-1 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-inter flex items-center justify-center min-h-[44px]"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Create Supplier Modal */}
{showCreateSupplier && (
        <Modal
          isOpen={showCreateSupplier}
          onClose={() => setShowCreateSupplier(false)}
          title="Add New Supplier"
          size="lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Contact Name</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Company Name *</label>
                <input
                  type="text"
                  value={supplierForm.companyName}
                  onChange={(e) => setSupplierForm({...supplierForm, companyName: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Email *</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Specialty *</label>
                <Dropdown
                  options={specialtyOptions.filter(opt => opt.value !== 'all')}
                  value={supplierForm.specialty}
                  onChange={(value) => setSupplierForm({...supplierForm, specialty: value})}
                  placeholder="Select Specialty"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Rating</label>
                <Dropdown
                  options={ratingOptions}
                  value={supplierForm.rating.toString()}
                  onChange={(value) => setSupplierForm({...supplierForm, rating: parseFloat(value)})}
                  placeholder="Select Rating"
                  size="sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter resize-none"
              />
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
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedSupplier.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Company</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedSupplier.companyName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedSupplier.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedSupplier.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Specialties</label>
                <div className="flex flex-wrap gap-1">
                  {(selectedSupplier.specialties || []).map((specialty, index) => (
                    <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Rating</label>
                <div className="flex items-center gap-1">
                  {selectedSupplier.rating ? renderStars(selectedSupplier.rating) : 'No rating'}
                  {selectedSupplier.rating && <span className="text-sm text-gray-600 ml-1 font-inter">{selectedSupplier.rating}</span>}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                selectedSupplier.isActive ? 'text-success-600 bg-success-100' : 'text-red-600 bg-red-100'
              }`}>
                {selectedSupplier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowViewSupplier(false)}>Close</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplier && selectedSupplier && (
        <Modal
          isOpen={showEditSupplier}
          onClose={() => setShowEditSupplier(false)}
          title="Edit Supplier"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name</label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Company Name</label>
              <input
                type="text"
                value={supplierForm.companyName}
                onChange={(e) => setSupplierForm({...supplierForm, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Specialty</label>
                <Dropdown
                  options={specialtyOptions.filter(opt => opt.value !== 'all')}
                  value={supplierForm.specialty}
                  onChange={(value) => setSupplierForm({...supplierForm, specialty: value})}
                  placeholder="Select Specialty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Rating</label>
                <select
                  value={supplierForm.rating}
                  onChange={(e) => setSupplierForm({...supplierForm, rating: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
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
              <Button variant="secondary" onClick={() => setShowEditSupplier(false)}>Cancel</Button>
              <Button onClick={handleUpdateSupplier}>Update Supplier</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SuppliersDataTable
