import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'
import { 
  Building, Users, Wrench, DollarSign, TrendingUp, TrendingDown, 
  Calendar, AlertTriangle, CheckCircle, Clock, Home, Zap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getAllBuildings } from '../../services/buildingService'
import { Building as BuildingType } from '../../types'

interface AnalyticsData {
  totalFlats: number
  occupiedFlats: number
  vacantFlats: number
  totalRevenue: number
  monthlyRevenue: number
  pendingTickets: number
  completedTickets: number
  activeSuppliers: number
  averageRating: number
  maintenanceCosts: number
  revenueGrowth: number
  occupancyRate: number
}

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  tickets: number
  occupancy: number
}

interface TicketStatusData {
  name: string
  value: number
  color: string
}

const BuildingAnalytics: React.FC = () => {
  const { currentUser } = useAuth()
  const [buildings, setBuildings] = useState<BuildingType[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  
  // Mock analytics data - in real app, this would come from API
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalFlats: 120,
    occupiedFlats: 108,
    vacantFlats: 12,
    totalRevenue: 2850000,
    monthlyRevenue: 285000,
    pendingTickets: 23,
    completedTickets: 187,
    activeSuppliers: 45,
    averageRating: 4.2,
    maintenanceCosts: 45000,
    revenueGrowth: 8.5,
    occupancyRate: 90
  })

  const monthlyData: MonthlyData[] = [
    { month: 'Jan', revenue: 275000, expenses: 45000, tickets: 28, occupancy: 88 },
    { month: 'Feb', revenue: 280000, expenses: 42000, tickets: 31, occupancy: 89 },
    { month: 'Mar', revenue: 285000, expenses: 48000, tickets: 25, occupancy: 90 },
    { month: 'Apr', revenue: 290000, expenses: 44000, tickets: 29, occupancy: 91 },
    { month: 'May', revenue: 285000, expenses: 46000, tickets: 33, occupancy: 90 },
    { month: 'Jun', revenue: 295000, expenses: 43000, tickets: 27, occupancy: 92 }
  ]

  const ticketStatusData: TicketStatusData[] = [
    { name: 'Completed', value: 187, color: '#10B981' },
    { name: 'In Progress', value: 23, color: '#F59E0B' },
    { name: 'Pending', value: 12, color: '#EF4444' },
    { name: 'On Hold', value: 8, color: '#6B7280' }
  ]

  const expenseCategories = [
    { name: 'Maintenance', value: 25000, color: '#3B82F6' },
    { name: 'Utilities', value: 15000, color: '#10B981' },
    { name: 'Security', value: 8000, color: '#F59E0B' },
    { name: 'Cleaning', value: 7000, color: '#8B5CF6' },
    { name: 'Other', value: 5000, color: '#6B7280' }
  ]

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const buildingsData = await getAllBuildings()
        setBuildings(buildingsData)
        if (buildingsData.length > 0) {
          setSelectedBuilding(buildingsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching buildings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuildings()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-inter">Building Analytics</h1>
            <p className="text-sm text-gray-600 font-inter">Comprehensive insights and performance metrics</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Building Selector */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter text-sm"
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-inter">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 font-inter">{formatCurrency(analyticsData.totalRevenue)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-inter">{formatPercentage(analyticsData.revenueGrowth)}</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-inter">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900 font-inter">{analyticsData.occupancyRate}%</p>
              <p className="text-sm text-gray-500 font-inter">{analyticsData.occupiedFlats}/{analyticsData.totalFlats} flats</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-inter">Active Tickets</p>
              <p className="text-2xl font-bold text-gray-900 font-inter">{analyticsData.pendingTickets}</p>
              <p className="text-sm text-gray-500 font-inter">{analyticsData.completedTickets} completed</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-inter">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900 font-inter">{analyticsData.averageRating}/5</p>
              <p className="text-sm text-gray-500 font-inter">{analyticsData.activeSuppliers} suppliers</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Expenses Chart */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">Revenue & Expenses</h3>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2"
                  stroke="#EF4444" 
                  fill="#EF4444"
                  fillOpacity={0.6}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Status Distribution */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">Ticket Status Distribution</h3>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Tickets Trend */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">Monthly Tickets</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">Expense Categories</h3>
          <div className="space-y-3">
            {expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 font-inter">{category.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 font-inter">
                  {formatCurrency(category.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600 font-inter">Completion Rate</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 font-inter">89%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 font-inter">Avg. Response Time</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 font-inter">2.4 hrs</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600 font-inter">Energy Efficiency</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 font-inter">B+</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-600 font-inter">Critical Issues</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 font-inter">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuildingAnalytics
