import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Users, Edit, Trash2, Eye, Building as BuildingIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Person, Building, PersonStatus } from '../../types'
import BulkImportExport from './BulkImportExport'
import { exportPeopleToCSV } from '../../utils/csvExport'
import { importPeopleFromCSV, ImportValidationResult } from '../../utils/csvImport'
import { getAllBuildings } from '../../services/buildingService'
import { getPeopleByBuilding, createPerson, updatePerson } from '../../services/peopleService'
import DataTable, { Column, TableAction } from '../UI/DataTable'
import Button from '../UI/Button'
import { tokens } from '../../styles/tokens'
import { getBadgeColors, getStatusColors, getButtonColors } from '../../utils/colors'

const PeopleDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [people, setPeople] = useState<(Person & { isActive: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePerson, setShowCreatePerson] = useState(false)
  const [showViewPerson, setShowViewPerson] = useState(false)
  const [showEditPerson, setShowEditPerson] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

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
    initializeData()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadPeople()
    }
  }, [selectedBuilding])

  const initializeData = async () => {
    try {
      setLoading(true)
      console.log('🔥 Loading buildings from Firebase...')
      const buildingsData = await getAllBuildings()
      console.log('🔥 Buildings loaded:', buildingsData.length)
      setBuildings(buildingsData)
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('🚨 Error initializing data:', error)
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

  const loadPeople = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      console.log('🔥 Loading people from Firebase for building:', selectedBuilding)
      const buildingPeople = await getPeopleByBuilding(selectedBuilding)
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
    if (!currentUser || !selectedBuilding) return
    
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
        buildingId: selectedBuilding,
        accessibleBuildingIds: [selectedBuilding],
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

  // Export/Import handlers
  const handleExportPeople = (buildingId: string, buildingName?: string) => {
    const buildingPeople = people.filter(person => person.buildingId === buildingId)
    exportPeopleToCSV(buildingPeople, buildingName)
  }

  const handleImportPeople = (csvText: string, buildingId: string): ImportValidationResult<Person & { isActive: boolean }> => {
    return importPeopleFromCSV(csvText, buildingId)
  }

  const handleImportConfirm = async (validPeople: (Person & { isActive: boolean })[]) => {
    if (!currentUser) return
    
    try {
      // Add imported people to the current list
      setPeople(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newPeople = validPeople.filter(p => !existingIds.has(p.id))
        return [...prev, ...newPeople]
      })
      
      addNotification({
        title: 'Success',
        message: `${validPeople.length} people imported successfully`,
        type: 'success',
        userId: currentUser.id
      })
    } catch (error) {
      console.error('Error importing people:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to import people',
        type: 'error',
        userId: currentUser.id
      })
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
      const matchesBuilding = !selectedBuilding || person.buildingId === selectedBuilding
      
      // Status filtering (handled by separate status filter)
      const matchesStatus = filterStatus === 'all' || person.status === filterStatus
      
      return isActive && matchesBuilding && matchesStatus
    })
  }, [people, selectedBuilding, filterStatus])

  // Column definitions for DataTable
  const columns: Column<Person & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'person',
      title: 'Person',
      dataIndex: 'name',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="text-sm font-medium text-neutral-900 font-inter">{record.name}</div>
          {record.isPrimaryContact && (
            <div className="text-xs text-success-600 font-inter">Primary Contact</div>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      title: 'Contact',
      dataIndex: 'email',
      render: (value, record) => (
        <div className="space-y-1">
          {record.email && (
            <div className="text-xs text-neutral-900 font-inter">{record.email}</div>
          )}
          {record.phone && (
            <div className="text-xs text-neutral-500 font-inter">{record.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'flat',
      title: 'Flat',
      dataIndex: 'flatNumber',
      sortable: true,
      render: (value, record) => (
        <span className="text-sm text-neutral-900 font-inter">{record.flatNumber || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      sortable: true,
      render: (value, record) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusBadge(record.status)}`}
        >
          {record.status}
        </span>
      ),
    },
    {
      key: 'moveInDate',
      title: 'Move In',
      dataIndex: 'moveInDate',
      sortable: true,
      render: (value, record) => (
        <span className="text-sm text-neutral-900 font-inter">{formatDate(record.moveInDate)}</span>
      ),
    },
  ], [getStatusBadge, formatDate])

  // Action definitions for DataTable
  const actions: TableAction<Person & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      variant: 'outline',
      onClick: handleViewPerson,
    },
    {
      key: 'edit',
      label: 'Edit',
      variant: 'outline',
      onClick: handleEditPerson,
    },
    {
      key: 'delete',
      label: 'Delete',
      variant: 'outline',
      onClick: (record) => handleDeletePerson(record.id),
    },
  ], [handleViewPerson, handleEditPerson, handleDeletePerson])

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
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 font-inter">People Management</h2>
          <p className="text-sm text-neutral-600 font-inter">Manage building residents and contacts</p>
        </div>
        
        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          {/* Building Selector */}
          <div className="relative flex items-center gap-2">
            <BuildingIcon className="h-4 w-4 text-neutral-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
              title={`Current building: ${buildings.find(b => b.id === selectedBuilding)?.name || 'Select building'}`}
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>
          
          {/* Add Person Button */}
          <button
            onClick={() => setShowCreatePerson(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors font-inter"
          >
            Add Person
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search people by name, email, or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
          />
        </div>
        <div className="relative flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
          >
            <option value="all">All Status</option>
            <option value={PersonStatus.OWNER}>Owner</option>
            <option value={PersonStatus.TENANT}>Tenant</option>
            <option value={PersonStatus.RESIDENT}>Resident</option>
            <option value={PersonStatus.MANAGER}>Manager</option>
            <option value={PersonStatus.PENDING_APPROVAL}>Pending Approval</option>
          </select>
          <ChevronDown className="absolute right-2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
        
        {/* Bulk Import/Export */}
        <BulkImportExport
          dataType="people"
          buildings={buildings}
          selectedBuildingId={selectedBuilding}
          onExport={handleExportPeople}
          onImport={handleImportPeople}
          onImportConfirm={handleImportConfirm}
          className="ml-auto"
        />
      </div>

      {/* People DataTable */}
      <DataTable
        data={filteredPeople}
        columns={columns}
        actions={actions}
        searchable={false}
        emptyMessage="No people found. Get started by adding your first person."
      />

      {/* Create Person Modal */}
      {showCreatePerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 font-inter">Add New Person</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building *</label>
                <select
                  value={personForm.buildingId || selectedBuilding || ''}
                  onChange={(e) => setPersonForm({...personForm, buildingId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name *</label>
                  <input
                    type="text"
                    value={personForm.name}
                    onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email *</label>
                  <input
                    type="email"
                    value={personForm.email}
                    onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                  <input
                    type="tel"
                    value={personForm.phone}
                    onChange={(e) => setPersonForm({...personForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                  <select
                    value={personForm.status}
                    onChange={(e) => setPersonForm({...personForm, status: e.target.value as PersonStatus})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
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

              <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreatePerson(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePerson}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors font-inter"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Person Modal */}
      {showViewPerson && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 font-inter">Person Details</h3>
              <button
                onClick={() => setShowViewPerson(false)}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building</label>
                  <p className="text-sm text-neutral-900 font-inter">
                    {buildings.find(b => b.id === selectedPerson.buildingId)?.name || 'Unknown Building'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusBadge(selectedPerson.status)}`}>
                    {selectedPerson.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name</label>
                  <p className="text-sm text-neutral-900 font-inter">{selectedPerson.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Primary Contact</label>
                  <p className="text-sm text-neutral-900 font-inter">{selectedPerson.isPrimaryContact ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email</label>
                  <p className="text-sm text-neutral-900 font-inter">{selectedPerson.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone</label>
                  <p className="text-sm text-neutral-900 font-inter">{selectedPerson.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewPerson(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-inter"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {showEditPerson && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 font-inter">Edit Person</h3>
              <button
                onClick={() => setShowEditPerson(false)}
                className="text-neutral-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Building *</label>
                <select
                  value={personForm.buildingId || selectedBuilding || ''}
                  onChange={(e) => setPersonForm({...personForm, buildingId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Name *</label>
                  <input
                    type="text"
                    value={personForm.name}
                    onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Email *</label>
                  <input
                    type="email"
                    value={personForm.email}
                    onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Phone *</label>
                  <input
                    type="tel"
                    value={personForm.phone}
                    onChange={(e) => setPersonForm({...personForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">Status</label>
                  <select
                    value={personForm.status}
                    onChange={(e) => setPersonForm({...personForm, status: e.target.value as PersonStatus})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
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

              <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditPerson(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePerson}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors font-inter"
              >
                Update Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PeopleDataTable
