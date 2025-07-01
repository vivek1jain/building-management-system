import { Link } from 'react-router-dom'
import { 
  Ticket, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { TicketStatus } from '../types'
import TestFirebase from '../components/TestFirebase'

// Mock data for demonstration
const mockStats = {
  totalTickets: 24,
  ticketsByStatus: {
    'New': 5,
    'Quote Requested': 3,
    'Quote Received': 2,
    'PO Sent': 1,
    'Contracted': 2,
    'Scheduled': 4,
    'In Progress': 3,
    'Complete': 3,
    'Closed': 1
  },
  urgentTickets: 3,
  upcomingEvents: 7
}

const mockRecentActivity = [
  {
    id: '1',
    action: 'Ticket Created',
    description: 'New ticket #T-001 for HVAC maintenance',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'ticket'
  },
  {
    id: '2',
    action: 'Quote Received',
    description: 'ABC Plumbing submitted quote for $2,500',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: 'quote'
  },
  {
    id: '3',
    action: 'Event Scheduled',
    description: 'Electrical inspection scheduled for tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    type: 'event'
  }
]

const Dashboard = () => {
  const { currentUser } = useAuth()

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quote Requested': return 'bg-yellow-100 text-yellow-800'
      case 'Quote Received': return 'bg-purple-100 text-purple-800'
      case 'PO Sent': return 'bg-indigo-100 text-indigo-800'
      case 'Contracted': return 'bg-orange-100 text-orange-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Complete': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your building management today.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalTickets}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% from last month</span>
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
              <p className="text-sm font-medium text-gray-600">Urgent Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.urgentTickets}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">-3 from yesterday</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockStats.ticketsByStatus['Complete'] + mockStats.ticketsByStatus['Closed']}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+8% this week</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.upcomingEvents}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600">Next: Tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Status</h3>
          <div className="space-y-3">
            {Object.entries(mockStats.ticketsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status as TicketStatus)}`}>
                    {status}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/tickets/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Create Ticket</p>
              <p className="text-sm text-gray-600">Raise a new maintenance request</p>
            </div>
          </Link>
          
          <Link
            to="/suppliers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Users className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Suppliers</p>
              <p className="text-sm text-gray-600">View and contact suppliers</p>
            </div>
          </Link>
          
          <Link
            to="/events"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Calendar className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Schedule Events</p>
              <p className="text-sm text-gray-600">Plan building maintenance</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Firebase Test Component */}
      <div className="mt-8">
        <TestFirebase />
      </div>
    </div>
  )
}

export default Dashboard 