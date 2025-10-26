import { Building as BuildingIcon, ChevronDown, Edit, Trash2, Home, Search } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getFlatsByBuilding, createFlat, updateFlat, deleteFlat } from '../../services/flatService'
import { Flat, Building } from '../../types'
import { Modal, ModalFooter, Dropdown, DropdownOption } from '../UI'
import Button from '../UI/Button'

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
  const [expandedDesktopFlats, setExpandedDesktopFlats] = useState<Set<string>>(new Set())
  const [expandedMobileFlats, setExpandedMobileFlats] = useState<Set<string>>(new Set())

  // Flat status dropdown options
  const statusOptions: DropdownOption[] = [
    { value: 'all', label: 'All Status', description: 'Show all flats' },
    { value: 'vacant', label: 'Vacant', description: 'Available for rent' },
    { value: 'occupied', label: 'Occupied', description: 'Currently rented' },
    { value: 'maintenance', label: 'Maintenance', description: 'Under maintenance' },
    { value: 'reserved', label: 'Reserved', description: 'Reserved for tenant' }
  ];

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

  // Toggle functions for accordion
  const toggleDesktopExpanded = (flatId: string) => {
    const newExpanded = new Set(expandedDesktopFlats)
    if (newExpanded.has(flatId)) {
      newExpanded.delete(flatId)
    } else {
      newExpanded.add(flatId)
    }
    setExpandedDesktopFlats(newExpanded)
  }

  const toggleMobileExpanded = (flatId: string) => {
    const newExpanded = new Set(expandedMobileFlats)
    if (newExpanded.has(flatId)) {
      newExpanded.delete(flatId)
    } else {
      newExpanded.add(flatId)
    }
    setExpandedMobileFlats(newExpanded)
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
              placeholder="Search flats..."
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
          onClick={() => setShowCreateFlat(true)}
          className="hidden"
        >
          Add Flat
        </button>
      </div>

      {/* Desktop: Accordion View */}
      <div className="hidden md:block">
        {filteredFlats.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-neutral-200">
            <Home className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No Flats Found</h3>
            <p className="text-gray-600 font-inter mt-2">Get started by adding your first flat.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {/* Header Row */}
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className="min-w-[150px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Flat Number</span>
                  </div>
                  <div className="min-w-[80px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Floor</span>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Area</span>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Status</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Ground Rent</span>
                  </div>
                </div>
                <div className="min-w-[180px] text-center">
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Actions</span>
                </div>
              </div>
            </div>
            
            {/* Data Rows */}
            {filteredFlats.map((flat, index) => {
              const isExpanded = expandedDesktopFlats.has(flat.id)
              const isLastRow = index === filteredFlats.length - 1
              
              return (
                <div key={flat.id} className={`bg-white ${!isLastRow ? 'border-b border-neutral-200' : ''}`}>
                  {/* Collapsed View - Main Info */}
                  <div 
                    onClick={() => toggleDesktopExpanded(flat.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      {/* Flat Number */}
                      <div className="min-w-[150px]">
                        <h4 className="text-sm font-medium text-neutral-900 font-inter">
                          {flat.flatNumber}
                        </h4>
                      </div>
                      
                      {/* Floor */}
                      <div className="min-w-[80px]">
                        <span className="text-sm text-neutral-600 font-inter">
                          Floor {flat.floor || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Area */}
                      <div className="min-w-[120px]">
                        <span className="text-sm text-neutral-900 font-inter">
                          {flat.areaSqFt || 0} sq ft
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="min-w-[120px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(flat.status || 'unknown')}`}>
                          {flat.status || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Ground Rent */}
                      <div className="flex-1">
                        <span className="text-sm text-neutral-900 font-inter">
                          {formatCurrency(flat.groundRent || 0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditFlat(flat)
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center gap-1.5"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFlat(flat.id)
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
                          toggleDesktopExpanded(flat.id)
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
                      <div className="flex items-start gap-6 mt-2">
                        {/* Bedrooms - aligned with Flat Number column */}
                        <div className="min-w-[150px]">
                          <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Bedrooms</h5>
                          <p className="text-sm text-neutral-900 font-inter">{flat.bedrooms || 0}</p>
                        </div>
                        
                        {/* Bathrooms - aligned with Floor column */}
                        <div className="min-w-[80px]">
                          <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Bathrooms</h5>
                          <p className="text-sm text-neutral-900 font-inter">{flat.bathrooms || 0}</p>
                        </div>
                        
                        {/* Notes - aligned with Area column and beyond */}
                        {flat.notes ? (
                          <div className="flex-1">
                            <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Notes</h5>
                            <p className="text-sm text-neutral-700 font-inter">{flat.notes}</p>
                          </div>
                        ) : flat.currentRent ? (
                          <div className="min-w-[120px]">
                            <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Current Rent</h5>
                            <p className="text-sm text-neutral-900 font-inter">{formatCurrency(flat.currentRent)}</p>
                          </div>
                        ) : null}
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
        {filteredFlats.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <Home className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No Flats Found</h3>
            <p className="text-gray-600 font-inter">Get started by adding your first flat.</p>
          </div>
        ) : (
          filteredFlats.map((flat) => {
            const isExpanded = expandedMobileFlats.has(flat.id)
            
            return (
              <div key={flat.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                {/* Collapsed View - Flat Number with Floor and Area on right */}
                <div 
                  onClick={() => toggleMobileExpanded(flat.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex flex-col justify-center flex-1 pr-3 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 font-inter truncate">
                      {flat.flatNumber}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-inter mt-1 ${getStatusColor(flat.status || 'unknown')}`}>
                      {flat.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right mr-2">
                      <p className="text-xs text-neutral-600 font-inter">
                        Floor {flat.floor || 'N/A'}
                      </p>
                      <p className="text-xs text-neutral-500 font-inter">
                        {flat.areaSqFt || 0} sq ft
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
                
                {/* Expanded View - All Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-neutral-100">
                    <div className="space-y-2 mt-3">
                      {/* Bedrooms and Bathrooms on same line */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-neutral-500 font-inter">Bedrooms: </span>
                          <span className="text-xs text-neutral-900 font-inter">{flat.bedrooms || 0}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-neutral-500 font-inter">Bathrooms: </span>
                          <span className="text-xs text-neutral-900 font-inter">{flat.bathrooms || 0}</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-neutral-500 font-inter">Ground Rent: </span>
                        <span className="text-xs text-neutral-900 font-inter">{formatCurrency(flat.groundRent || 0)}</span>
                      </div>
                      
                      {flat.currentRent && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500 font-inter">Current Rent:</span>
                          <span className="text-xs text-neutral-900 font-inter">{formatCurrency(flat.currentRent)}</span>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {flat.notes && (
                        <div className="pt-2">
                          <span className="text-xs font-medium text-neutral-500 font-inter block mb-1">Notes:</span>
                          <p className="text-xs text-neutral-700 font-inter">{flat.notes}</p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditFlat(flat)
                          }}
                          className="flex-1 px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center justify-center min-h-[44px]"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFlat(flat.id)
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

      {/* Create Flat Modal */}
{showCreateFlat && (
        <Modal
          isOpen={showCreateFlat}
          onClose={() => setShowCreateFlat(false)}
          title="Add New Flat"
          size="lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Flat Number *</label>
                <input
                  type="text"
                  value={flatForm.flatNumber}
                  onChange={(e) => setFlatForm({...flatForm, flatNumber: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Floor *</label>
                <input
                  type="number"
                  value={flatForm.floor}
                  onChange={(e) => setFlatForm({...flatForm, floor: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Area (sq ft) *</label>
                <input
                  type="number"
                  value={flatForm.areaSqFt}
                  onChange={(e) => setFlatForm({...flatForm, areaSqFt: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <Dropdown
                  options={statusOptions.filter(opt => opt.value !== 'all')}
                  value={flatForm.status}
                  onChange={(value) => setFlatForm({...flatForm, status: value})}
                  placeholder="Select Status"
                  size="sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Bedrooms</label>
                <input
                  type="number"
                  value={flatForm.bedrooms}
                  onChange={(e) => setFlatForm({...flatForm, bedrooms: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Bathrooms</label>
                <input
                  type="number"
                  value={flatForm.bathrooms}
                  onChange={(e) => setFlatForm({...flatForm, bathrooms: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Ground Rent (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={flatForm.groundRent}
                  onChange={(e) => setFlatForm({...flatForm, groundRent: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={flatForm.notes}
                onChange={(e) => setFlatForm({...flatForm, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter resize-none"
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
