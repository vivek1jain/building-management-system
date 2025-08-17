import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBuilding } from '../contexts/BuildingContext'
import { getPeopleStats } from '../services/peopleService'
import { Person, PersonStatus, Building } from '../types'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

const PeoplePage: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { buildings, selectedBuildingId, selectedBuilding: selectedBuildingData } = useBuilding()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreatePerson, setShowCreatePerson] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form states
  const [personForm, setPersonForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'resident',
    status: 'active',
    flatId: '',
    moveInDate: '',
    moveOutDate: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: ''
  })

  // Load people when selected building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadPeople()
    }
  }, [selectedBuildingId])

  const loadPeople = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      
      // Create different mock data based on selected building to show switching works
      const mockPeople: Person[] = [
        {
          id: `${selectedBuildingId}-1`,
          buildingId: selectedBuildingId,
          firstName: selectedBuildingData?.name.includes('Tower') ? 'Alice' : 'John',
          lastName: selectedBuildingData?.name.includes('Tower') ? 'Chen' : 'Smith',
          email: selectedBuildingData?.name.includes('Tower') ? 'alice.chen@email.com' : 'john.smith@email.com',
          phone: selectedBuildingData?.name.includes('Tower') ? '+1-555-1001' : '+1-555-0123',
          role: 'resident',
          status: 'active',
          flatId: selectedBuildingData?.name.includes('Tower') ? 'T301' : 'A101',
          moveInDate: new Date('2023-01-15'),
          moveOutDate: null,
          emergencyContact: {
            name: selectedBuildingData?.name.includes('Tower') ? 'David Chen' : 'Jane Smith',
            phone: selectedBuildingData?.name.includes('Tower') ? '+1-555-1002' : '+1-555-0124',
            relationship: 'Spouse'
          },
          notes: `Primary contact for ${selectedBuildingData?.name || 'building'}`,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `${selectedBuildingId}-2`,
          buildingId: selectedBuildingId,
          firstName: selectedBuildingData?.name.includes('Tower') ? 'Michael' : 'Sarah',
          lastName: selectedBuildingData?.name.includes('Tower') ? 'Rodriguez' : 'Johnson',
          email: selectedBuildingData?.name.includes('Tower') ? 'michael.rodriguez@email.com' : 'sarah.johnson@email.com',
          phone: selectedBuildingData?.name.includes('Tower') ? '+1-555-1003' : '+1-555-0125',
          role: 'owner',
          status: 'active',
          flatId: selectedBuildingData?.name.includes('Tower') ? 'T401' : 'B201',
          moveInDate: new Date('2022-06-01'),
          moveOutDate: null,
          emergencyContact: {
            name: selectedBuildingData?.name.includes('Tower') ? 'Sofia Rodriguez' : 'Mike Johnson',
            phone: selectedBuildingData?.name.includes('Tower') ? '+1-555-1004' : '+1-555-0126',
            relationship: selectedBuildingData?.name.includes('Tower') ? 'Wife' : 'Brother'
          },
          notes: selectedBuildingData?.name.includes('Tower') ? 'High-floor unit owner' : 'Penthouse owner',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      setPeople(mockPeople)
    } catch (error) {
      console.error('Error loading people:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load people',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePerson = async () => {
    if (!selectedBuildingId || !currentUser) return
    
    try {
      setLoading(true)
      // Mock creation
      const newPerson: Person = {
        id: Date.now().toString(),
        buildingId: selectedBuildingId,
        ...personForm,
        moveInDate: personForm.moveInDate ? new Date(personForm.moveInDate) : new Date(),
        moveOutDate: personForm.moveOutDate ? new Date(personForm.moveOutDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setPeople([...people, newPerson])
      setShowCreatePerson(false)
      setPersonForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'resident',
        status: 'active',
        flatId: '',
        moveInDate: '',
        moveOutDate: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: ''
      })
      
      addNotification({
        title: 'Success',
        message: 'Person added successfully',
        type: 'success',
        userId: 'current'
      })
    } catch (error) {
      console.error('Error creating person:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add person',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: PersonStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'resident': return 'bg-blue-100 text-blue-800'
      case 'tenant': return 'bg-green-100 text-green-800'
      case 'visitor': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const filteredPeople = people.filter(person => {
    const matchesSearch = 
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || person.status === filterStatus
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
          <h1 className="text-2xl font-bold text-gray-900">People Management</h1>
          <p className="text-gray-600 mt-1">Manage residents, owners, and tenants</p>
        </div>
        <button
          onClick={() => setShowCreatePerson(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Person</span>
        </button>
      </div>


      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search people..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Move In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPeople.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {person.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.phone}</div>
                    <div className="text-sm text-gray-500">
                      <Mail className="inline h-3 w-3 mr-1" />
                      {person.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(person.role)}`}>
                      {person.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(person.status)}`}>
                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {person.flatId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(person.moveInDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
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
        </div>
      </div>

      {/* Create Person Modal */}
      {showCreatePerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Person</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={personForm.firstName}
                    onChange={(e) => setPersonForm({...personForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={personForm.lastName}
                    onChange={(e) => setPersonForm({...personForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={personForm.email}
                  onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={personForm.phone}
                  onChange={(e) => setPersonForm({...personForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={personForm.role}
                    onChange={(e) => setPersonForm({...personForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="resident">Resident</option>
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                    <option value="visitor">Visitor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={personForm.status}
                    onChange={(e) => setPersonForm({...personForm, status: e.target.value as PersonStatus})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flat ID</label>
                <input
                  type="text"
                  value={personForm.flatId}
                  onChange={(e) => setPersonForm({...personForm, flatId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move In Date</label>
                  <input
                    type="date"
                    value={personForm.moveInDate}
                    onChange={(e) => setPersonForm({...personForm, moveInDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move Out Date</label>
                  <input
                    type="date"
                    value={personForm.moveOutDate}
                    onChange={(e) => setPersonForm({...personForm, moveOutDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={personForm.notes}
                  onChange={(e) => setPersonForm({...personForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreatePerson(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePerson}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PeoplePage 