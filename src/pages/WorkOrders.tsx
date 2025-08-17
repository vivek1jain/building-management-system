import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getAllBuildings } from '../services/buildingService'
import { getWorkOrderStats } from '../services/workOrderService'
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, Building } from '../types'
import { 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  Star,
  MapPin,
  User,
  Calendar,
  DollarSign
} from 'lucide-react'

const WorkOrdersPage: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateWorkOrder, setShowCreateWorkOrder] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Form states
  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as WorkOrderPriority,
    status: WorkOrderStatus.TRIAGE,
    flatId: '',
    category: 'repairs',
    estimatedCost: 0,
    scheduledDate: '',
    assignedTo: '',
    notes: ''
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadWorkOrders()
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

  const loadWorkOrders = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      // Mock data for demonstration
      const mockWorkOrders: WorkOrder[] = [
        {
          id: '1',
          buildingId: selectedBuilding,
          title: 'Leaking Faucet Repair',
          description: 'Kitchen faucet is leaking and needs replacement',
          priority: 'high',
          status: 'in_progress',
          flatId: 'A101',
          category: 'plumbing',
          estimatedCost: 150,
          actualCost: 120,
          scheduledDate: new Date('2024-03-20'),
          completedDate: null,
          assignedTo: 'John Contractor',
          requestedBy: 'John Smith',
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-18'),
          activityLog: [
            {
              id: '1',
              action: 'Work Order Created',
              description: 'Work order created by resident',
              performedBy: 'John Smith',
              timestamp: new Date('2024-03-15'),
              metadata: {}
            },
            {
              id: '2',
              action: 'Assigned to Contractor',
              description: 'Work order assigned to John Contractor',
              performedBy: 'Building Manager',
              timestamp: new Date('2024-03-16'),
              metadata: { contractorId: 'contractor-1' }
            }
          ],
          quotes: [],
          userFeedback: null
        },
        {
          id: '2',
          buildingId: selectedBuilding,
          title: 'HVAC Maintenance',
          description: 'Annual HVAC system maintenance and cleaning',
          priority: 'medium',
          status: 'scheduled',
          flatId: 'B201',
          category: 'hvac',
          estimatedCost: 300,
          actualCost: 0,
          scheduledDate: new Date('2024-03-25'),
          completedDate: null,
          assignedTo: 'HVAC Services Ltd',
          requestedBy: 'Building Manager',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10'),
          activityLog: [
            {
              id: '1',
              action: 'Work Order Created',
              description: 'Scheduled HVAC maintenance',
              performedBy: 'Building Manager',
              timestamp: new Date('2024-03-10'),
              metadata: {}
            }
          ],
          quotes: [],
          userFeedback: null
        },
        {
          id: '3',
          buildingId: selectedBuilding,
          title: 'Electrical Outlet Repair',
          description: 'Electrical outlet not working in bedroom',
          priority: 'urgent',
          status: 'triage',
          flatId: 'A102',
          category: 'electrical',
          estimatedCost: 200,
          actualCost: 0,
          scheduledDate: null,
          completedDate: null,
          assignedTo: '',
          requestedBy: 'Sarah Johnson',
          createdAt: new Date('2024-03-19'),
          updatedAt: new Date('2024-03-19'),
          activityLog: [
            {
              id: '1',
              action: 'Work Order Created',
              description: 'Electrical issue reported',
              performedBy: 'Sarah Johnson',
              timestamp: new Date('2024-03-19'),
              metadata: {}
            }
          ],
          quotes: [],
          userFeedback: null
        }
      ]
      
      setWorkOrders(mockWorkOrders)
    } catch (error) {
      console.error('Error loading work orders:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load work orders',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkOrder = async () => {
    if (!selectedBuilding || !currentUser) return
    
    try {
      setLoading(true)
      // Mock creation
      const newWorkOrder: WorkOrder = {
        id: Date.now().toString(),
        buildingId: selectedBuilding,
        ...workOrderForm,
        actualCost: 0,
        completedDate: null,
        requestedBy: currentUser.name || 'Unknown',
        scheduledDate: workOrderForm.scheduledDate ? new Date(workOrderForm.scheduledDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLog: [
          {
            id: Date.now().toString(),
            action: 'Work Order Created',
            description: 'Work order created by user',
            performedBy: currentUser.name || 'Unknown',
            timestamp: new Date(),
            metadata: {}
          }
        ],
        quotes: [],
        userFeedback: null
      }
      
      setWorkOrders([...workOrders, newWorkOrder])
      setShowCreateWorkOrder(false)
      setWorkOrderForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'triage',
        flatId: '',
        category: 'repairs',
        estimatedCost: 0,
        scheduledDate: '',
        assignedTo: '',
        notes: ''
      })
      
      addNotification({
        title: 'Success',
        message: 'Work order created successfully',
        type: 'success',
        userId: 'current'
      })
    } catch (error) {
      console.error('Error creating work order:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to create work order',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'triage': return 'bg-neutral-100 text-gray-800'
      case 'quoting': return 'bg-blue-100 text-blue-800'
      case 'with_user': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-success-100 text-success-800'
      case 'closed': return 'bg-neutral-100 text-gray-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'low': return 'bg-success-100 text-success-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'low': return <Star className="h-4 w-4 text-success-600" />
      case 'medium': return <Star className="h-4 w-4 text-yellow-600" />
      case 'high': return <Star className="h-4 w-4 text-orange-600" />
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: WorkOrderStatus) => {
    switch (status) {
      case 'triage': return <Clock className="h-4 w-4 text-gray-600" />
      case 'quoting': return <Search className="h-4 w-4 text-primary-600" />
      case 'with_user': return <User className="h-4 w-4 text-yellow-600" />
      case 'scheduled': return <Calendar className="h-4 w-4 text-purple-600" />
      case 'in_progress': return <Wrench className="h-4 w-4 text-orange-600" />
      case 'resolved': return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = 
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.flatId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalWorkOrders = workOrders.length
  const inProgressCount = workOrders.filter(order => order.status === 'in_progress').length
  const urgentCount = workOrders.filter(order => order.priority === 'urgent').length
  const totalEstimatedCost = workOrders.reduce((sum, order) => sum + order.estimatedCost, 0)

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
          <h1 className="text-2xl font-bold text-neutral-900">Work Orders</h1>
          <p className="text-gray-600 mt-1">Manage maintenance and repair requests</p>
        </div>
        <button
          onClick={() => setShowCreateWorkOrder(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Building Selection */}
      <div className="card">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Select Building
        </label>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Work Orders</p>
              <p className="text-2xl font-bold text-neutral-900">{totalWorkOrders}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-neutral-900">{inProgressCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-neutral-900">{urgentCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(totalEstimatedCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="triage">Triage</option>
              <option value="quoting">Quoting</option>
              <option value="with_user">With User</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Work Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Flat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Estimated Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{order.title}</div>
                      <div className="text-sm text-neutral-500 truncate max-w-xs">{order.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {order.flatId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPriorityIcon(order.priority)}
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {order.assignedTo || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {formatCurrency(order.estimatedCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-success-600 hover:text-success-700">
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

      {/* Create Work Order Modal */}
      {showCreateWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Create Work Order</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={workOrderForm.title}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={workOrderForm.description}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                  <select
                    value={workOrderForm.priority}
                    onChange={(e) => setWorkOrderForm({...workOrderForm, priority: e.target.value as WorkOrderPriority})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <select
                    value={workOrderForm.category}
                    onChange={(e) => setWorkOrderForm({...workOrderForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="repairs">Repairs</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Flat ID</label>
                <input
                  type="text"
                  value={workOrderForm.flatId}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, flatId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Estimated Cost</label>
                <input
                  type="number"
                  value={workOrderForm.estimatedCost}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, estimatedCost: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={workOrderForm.scheduledDate}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, scheduledDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={workOrderForm.assignedTo}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                <textarea
                  value={workOrderForm.notes}
                  onChange={(e) => setWorkOrderForm({...workOrderForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateWorkOrder(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkOrder}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Create Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkOrdersPage 