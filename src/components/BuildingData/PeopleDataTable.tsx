import { Search, Plus, Users, Edit, Trash2, Eye, Building as BuildingIcon, ChevronDown, Info } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getPeopleByBuilding, createPerson, updatePerson } from '../../services/peopleService'
import { tokens } from '../../styles/tokens'
import { Person, Building, PersonStatus } from '../../types'
import { getBadgeColors, getStatusColors, getButtonColors } from '../../utils/colors'
import { Badge , Modal, ModalFooter, Dropdown, DropdownOption } from '../UI'
import Button from '../UI/Button'

const PeopleDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId, selectedBuilding } = useBuilding()
  const [people, setPeople] = useState<(Person & { isActive: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePerson, setShowCreatePerson] = useState(false)
  const [showViewPerson, setShowViewPerson] = useState(false)
  const [showEditPerson, setShowEditPerson] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedPeople, setExpandedPeople] = useState<Set<string>>(new Set())

  // Person status dropdown options
  const statusOptions: DropdownOption[] = [
    { value: 'all', label: 'All Status', description: 'Show all people' },
    { value: PersonStatus.OWNER, label: 'Owner', description: 'Property owners' },
    { value: PersonStatus.TENANT, label: 'Tenant', description: 'Current tenants' },
    { value: PersonStatus.RESIDENT, label: 'Resident', description: 'General residents' },
    { value: PersonStatus.MANAGER, label: 'Manager', description: 'Property managers' },
    { value: PersonStatus.PENDING_APPROVAL, label: 'Pending Approval', description: 'Awaiting approval' }
  ];

  // Form states
  const [personForm, setPersonForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'resident',
    status: PersonStatus.RESIDENT,
    flatId: '',
    moveInDate: '',
    moveOutDate: '',
    notes: '',
    buildingId: ''
  })

  useEffect(() => {
    if (selectedBuildingId) {
      loadPeople()
    }
  }, [selectedBuildingId])


  const loadPeople = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      console.log('🔥 Loading people from Firebase for building:', selectedBuildingId)
      const buildingPeople = await getPeopleByBuilding(selectedBuildingId)
      console.log('🔥 People loaded:', buildingPeople.length)
      // Add isActive property for compatibility
      const peopleWithActiveFlag = buildingPeople.map(person => ({ ...person, isActive: true }))
      setPeople(peopleWithActiveFlag)
    } catch (error) {
      console.error('🚨 Error loading people:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load people from Firebase',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePerson = async () => {
    if (!currentUser || !selectedBuildingId) return
    
    if (!personForm.name || !personForm.email || !personForm.phone) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Creating person in Firebase...')
      const personData = {
        name: personForm.name,
        buildingId: selectedBuildingId,
        accessibleBuildingIds: [selectedBuildingId],
        flatId: personForm.flatId || null,
        flatNumber: personForm.flatId || null,
        status: personForm.status,
        email: personForm.email,
        phone: personForm.phone,
        isPrimaryContact: true, // Default to true for new people
        moveInDate: personForm.moveInDate ? new Date(personForm.moveInDate) : null,
        moveOutDate: personForm.moveOutDate ? new Date(personForm.moveOutDate) : null,
        notes: personForm.notes,
        createdByUid: currentUser.id,
        updatedByUid: currentUser.id
      }

      // Create person in Firebase
      const createdPerson = await createPerson(personData)
      console.log('🔥 Person created successfully:', createdPerson.id)
      
      // Add to local state with isActive flag
      const personWithActiveFlag = { ...createdPerson, isActive: true }
      setPeople(prev => [...prev, personWithActiveFlag])
      
      // Reset form
      setPersonForm({
        name: '',
        email: '',
        phone: '',
        role: 'resident',
        status: PersonStatus.RESIDENT,
        flatId: '',
        moveInDate: '',
        moveOutDate: '',
        notes: '',
        buildingId: ''
      })
      
      setShowCreatePerson(false)
      
      addNotification({
        title: 'Success',
        message: 'Person added successfully to Firebase!',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error creating person:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add person to Firebase',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleViewPerson = (person: Person & { isActive: boolean }) => {
    console.log('View person clicked:', person.id)
    setSelectedPerson(person)
    setShowViewPerson(true)
  }

  const handleEditPerson = (person: Person & { isActive: boolean }) => {
    console.log('Edit person clicked:', person.id)
    setSelectedPerson(person)
    setPersonForm({
      name: person.name,
      email: person.email || '',
      phone: person.phone || '',
      role: 'resident', // Default role
      status: person.status,
      flatId: person.flatId || '',
      moveInDate: person.moveInDate ? person.moveInDate.toISOString().split('T')[0] : '',
      moveOutDate: person.moveOutDate ? person.moveOutDate.toISOString().split('T')[0] : '',
      notes: person.notes || '',
      buildingId: person.buildingId || ''
    })
    setShowEditPerson(true)
  }

  const handleUpdatePerson = async () => {
    if (!currentUser || !selectedPerson) return
    
    if (!personForm.name || !personForm.email || !personForm.phone) {
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields',
        type: 'error',
        userId: currentUser.id
      })
      return
    }
    
    try {
      console.log('🔥 Updating person in Firebase...', selectedPerson.id)
      
      // Prepare the update data
      const updateData = {
        name: personForm.name,
        email: personForm.email,
        phone: personForm.phone,
        status: personForm.status,
        flatId: personForm.flatId || null,
        flatNumber: personForm.flatId || null,
        moveInDate: personForm.moveInDate ? new Date(personForm.moveInDate) : null,
        moveOutDate: personForm.moveOutDate ? new Date(personForm.moveOutDate) : null,
        notes: personForm.notes,
        updatedByUid: currentUser.id
      }
      
      // Update in Firebase first
      await updatePerson(selectedPerson.id, updateData)
      console.log('🔥 Person updated successfully in Firebase')
      
      // Update local state only after Firebase update succeeds
      setPeople(prev => prev.map(p => 
        p.id === selectedPerson.id 
          ? {
              ...p,
              ...updateData,
              updatedAt: new Date()
            }
          : p
      ))
      
      setShowEditPerson(false)
      setSelectedPerson(null)
      
      addNotification({
        title: 'Success',
        message: 'Person updated successfully in Firebase!',
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('🚨 Error updating person:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update person in Firebase',
        type: 'error',
        userId: currentUser.id
      })
    }
  }

  const handleDeletePerson = async (personId: string) => {
    console.log('Delete person clicked:', personId)
    if (!currentUser) return
    
    if (window.confirm('Are you sure you want to delete this person? This will hide the person but they can be restored later.')) {
      try {
        // Soft delete: mark as inactive instead of removing
        setPeople(prev => prev.map(p => 
          p.id === personId 
            ? { ...p, isActive: false }
            : p
        ))
        addNotification({
          title: 'Success',
          message: 'Person deleted successfully (can be restored)',
          type: 'success',
          userId: currentUser.id
        })
      } catch (error) {
        console.error('Error deleting person:', error)
        addNotification({
          title: 'Error',
          message: 'Failed to delete person',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }


  const getStatusBadge = (status: PersonStatus) => {
    const variant = getStatusColors(status)
    const colors = getBadgeColors(variant)
    return `${colors.bg} ${colors.text} ${colors.border}`
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString()
  }

  // Filtered data for the DataTable
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      // Only show active people (soft delete implementation)
      const isActive = person.isActive
      
      // Building-scoped filtering: only show people for the selected building
      const matchesBuilding = !selectedBuildingId || person.buildingId === selectedBuildingId
      
      // Status filtering (handled by separate status filter)
      const matchesStatus = filterStatus === 'all' || person.status === filterStatus
      
      return isActive && matchesBuilding && matchesStatus
    })
  }, [people, selectedBuildingId, filterStatus])

  // Desktop accordion state
  const [expandedDesktopPeople, setExpandedDesktopPeople] = useState<Set<string>>(new Set())

  const toggleDesktopExpanded = (personId: string) => {
    // Single-expand behavior: expand only this person, collapse others
    if (expandedDesktopPeople.has(personId)) {
      // Clicking the same open item collapses all
      setExpandedDesktopPeople(new Set())
    } else {
      // Open only this item
      setExpandedDesktopPeople(new Set([personId]))
    }
  }


  const toggleExpanded = (personId: string) => {
    // Single-expand behavior: expand only this person, collapse others
    if (expandedPeople.has(personId)) {
      // Clicking the same open item collapses all
      setExpandedPeople(new Set())
    } else {
      // Open only this item
      setExpandedPeople(new Set([personId]))
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
      {/* Mobile header with tooltip */}
      <div className="md:hidden mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-neutral-900 font-inter">People</h2>
          <div className="group relative">
            <Info className="h-4 w-4 text-neutral-400 cursor-help" />
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg font-inter">
              <strong className="text-success-300">P</strong> indicates Primary Contact - the main person responsible for this flat
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Controls - Search/Filter/Add aligned horizontally under tabs */}
      <div className="hidden md:flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search people by name, email, or flat..."
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
          onClick={() => setShowCreatePerson(true)}
          className="hidden"
          data-testid="add-person"
        >
          Add Person
        </button>
      </div>

      {/* Desktop: Accordion View */}
      <div className="hidden md:block">
        {filteredPeople.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-neutral-200">
            <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No People Found</h3>
            <p className="text-gray-600 font-inter mt-2">Get started by adding your first person.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden" data-testid="people-list">
            {/* Header Row */}
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className="min-w-[200px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Name</span>
                  </div>
                  <div className="min-w-[80px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Flat</span>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Status</span>
                  </div>
                  <div className="min-w-[140px]">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-inter">Phone</span>
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
            {filteredPeople.map((person, index) => {
              const isExpanded = expandedDesktopPeople.has(person.id)
              const isLastRow = index === filteredPeople.length - 1
              
              return (
                <div key={person.id} className={`bg-white ${!isLastRow ? 'border-b border-neutral-200' : ''}`} data-testid="person-item">
                  {/* Collapsed View - Main Info */}
                  <div 
                    onClick={() => toggleDesktopExpanded(person.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      {/* Name & Primary Contact Badge */}
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <h4 className="text-sm font-medium text-neutral-900 font-inter">
                          {person.name}
                        </h4>
                        {person.isPrimaryContact && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-100 text-success-700 text-xs font-bold font-inter flex-shrink-0">
                            P
                          </span>
                        )}
                      </div>
                      
                      {/* Flat Number */}
                      <div className="min-w-[80px]">
                        <span className="text-sm text-neutral-600 font-inter">
                          {person.flatNumber || 'No flat'}
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="min-w-[120px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusBadge(person.status)}`}>
                          {person.status}
                        </span>
                      </div>
                      
                      {/* Phone */}
                      <div className="min-w-[140px]">
                        <span className="text-sm text-neutral-900 font-inter">
                          {person.phone || 'No phone'}
                        </span>
                      </div>
                      
                      {/* Email */}
                      <div className="flex-1">
                        <span className="text-sm text-neutral-900 font-inter truncate">
                          {person.email || 'No email'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPerson(person)
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center gap-1.5"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePerson(person.id)
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
                          toggleDesktopExpanded(person.id)
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
                      <div className="grid grid-cols-2 gap-6 mt-2">
                        {/* Move In Date */}
                        {person.moveInDate && (
                          <div>
                            <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Move In Date</h5>
                            <p className="text-sm text-neutral-900 font-inter">{formatDate(person.moveInDate)}</p>
                          </div>
                        )}
                        
                        {/* Move Out Date */}
                        {person.moveOutDate && (
                          <div>
                            <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Move Out Date</h5>
                            <p className="text-sm text-neutral-900 font-inter">{formatDate(person.moveOutDate)}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Notes */}
                      {person.notes && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-neutral-500 mb-1 font-inter">Notes</h5>
                          <p className="text-sm text-neutral-700 font-inter">{person.notes}</p>
                        </div>
                      )}
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
        {filteredPeople.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 font-inter">No People Found</h3>
            <p className="text-gray-600 font-inter">Get started by adding your first person.</p>
          </div>
        ) : (
          filteredPeople.map((person) => {
            const isExpanded = expandedPeople.has(person.id)
            
            return (
              <div key={person.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                {/* Collapsed View - Name, Phone, and Flat */}
                <div 
                  onClick={() => toggleExpanded(person.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 pr-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-neutral-900 font-inter truncate">
                        {person.name}
                      </h4>
                      {person.isPrimaryContact && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-100 text-success-700 text-xs font-bold font-inter flex-shrink-0">
                          P
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-inter mt-0.5 truncate">
                      {person.phone || 'No phone'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-neutral-600 font-inter">
                      {person.flatNumber || 'No flat'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
                
                {/* Expanded View - All Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-neutral-100">
                    <div className="space-y-3 mt-3">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 font-inter">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusBadge(person.status)}`}>
                          {person.status}
                        </span>
                      </div>
                      
                      {/* Contact Details */}
                      {person.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500 font-inter">Email:</span>
                          <span className="text-sm text-neutral-900 font-inter">{person.email}</span>
                        </div>
                      )}
                      
                      {person.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500 font-inter">Phone:</span>
                          <span className="text-sm text-neutral-900 font-inter">{person.phone}</span>
                        </div>
                      )}
                      
                      {/* Move In Date */}
                      {person.moveInDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500 font-inter">Move In:</span>
                          <span className="text-sm text-neutral-900 font-inter">{formatDate(person.moveInDate)}</span>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditPerson(person)
                          }}
                          className="flex-1 px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-inter flex items-center justify-center min-h-[44px]"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePerson(person.id)
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

      {/* Create Person Modal */}
{showCreatePerson && (
        <Modal
          isOpen={showCreatePerson}
          onClose={() => setShowCreatePerson(false)}
          title="Add New Person"
          size="lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Name *</label>
                <input
                  type="text"
                  value={personForm.name}
                  onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Email *</label>
                <input
                  type="email"
                  value={personForm.email}
                  onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                <input
                  type="tel"
                  value={personForm.phone}
                  onChange={(e) => setPersonForm({...personForm, phone: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <Dropdown
                  options={statusOptions.filter(opt => opt.value !== 'all')}
                  value={personForm.status}
                  onChange={(value) => setPersonForm({...personForm, status: value as PersonStatus})}
                  placeholder="Select Status"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Flat Number</label>
                <input
                  type="text"
                  value={personForm.flatId}
                  onChange={(e) => setPersonForm({...personForm, flatId: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Move In Date</label>
                <input
                  type="date"
                  value={personForm.moveInDate}
                  onChange={(e) => setPersonForm({...personForm, moveInDate: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Move Out Date</label>
                <input
                  type="date"
                  value={personForm.moveOutDate}
                  onChange={(e) => setPersonForm({...personForm, moveOutDate: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={personForm.notes}
                onChange={(e) => setPersonForm({...personForm, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter resize-none"
              />
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCreatePerson(false)}>Cancel</Button>
              <Button onClick={handleCreatePerson}>Add Person</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* View Person Modal */}
{showViewPerson && selectedPerson && (
        <Modal
          isOpen={showViewPerson}
          onClose={() => setShowViewPerson(false)}
          title="Person Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building</label>
                <p className="text-sm text-neutral-900 font-inter">
                  {selectedBuilding?.name || 'Unknown Building'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusBadge(selectedPerson.status)}`}>
                  {selectedPerson.status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Primary Contact</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.isPrimaryContact ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.phone || 'N/A'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Flat Number</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.flatNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Primary Contact</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.isPrimaryContact ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Move In Date</label>
                <p className="text-sm text-neutral-900 font-inter">{formatDate(selectedPerson.moveInDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Move Out Date</label>
                <p className="text-sm text-neutral-900 font-inter">{formatDate(selectedPerson.moveOutDate)}</p>
              </div>
            </div>
            
            {selectedPerson.notes && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
                <p className="text-sm text-neutral-900 font-inter">{selectedPerson.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowViewPerson(false)}>Close</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Edit Person Modal */}
{showEditPerson && selectedPerson && (
        <Modal
          isOpen={showEditPerson}
          onClose={() => setShowEditPerson(false)}
          title="Edit Person"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building</label>
              <div className="px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-sm font-medium text-neutral-700">
                {selectedBuilding?.name || 'No building selected'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name *</label>
                <input
                  type="text"
                  value={personForm.name}
                  onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  data-testid="person-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email *</label>
                <input
                  type="email"
                  value={personForm.email}
                  onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  data-testid="person-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone *</label>
                <input
                  type="tel"
                  value={personForm.phone}
                  onChange={(e) => setPersonForm({...personForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  data-testid="person-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                <select
                  value={personForm.status}
                  onChange={(e) => setPersonForm({...personForm, status: e.target.value as PersonStatus})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  data-testid="person-status"
                >
                  <option value={PersonStatus.RESIDENT}>Resident</option>
                  <option value={PersonStatus.OWNER}>Owner</option>
                  <option value={PersonStatus.TENANT}>Tenant</option>
                  <option value={PersonStatus.MANAGER}>Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Flat ID</label>
              <input
                type="text"
                value={personForm.flatId}
                onChange={(e) => setPersonForm({...personForm, flatId: e.target.value})}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Move In Date</label>
                <input
                  type="date"
                  value={personForm.moveInDate}
                  onChange={(e) => setPersonForm({...personForm, moveInDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Move Out Date</label>
                <input
                  type="date"
                  value={personForm.moveOutDate}
                  onChange={(e) => setPersonForm({...personForm, moveOutDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Notes</label>
              <textarea
                value={personForm.notes}
                onChange={(e) => setPersonForm({...personForm, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowEditPerson(false)}>Cancel</Button>
              <Button onClick={handleUpdatePerson} data-testid="save-person">Update Person</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PeopleDataTable
