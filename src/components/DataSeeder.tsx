import React, { useState } from 'react'
import { seedAllData, seedFinancialData, seedMaintenanceData } from '../services/dataSeedingService'
import { useNotifications } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'
import { Database, DollarSign, Wrench, CheckCircle, AlertCircle } from 'lucide-react'

const DataSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [seedingType, setSeedingType] = useState<string>('')
  const { addNotification } = useNotifications()
  const { currentUser } = useAuth()

  const handleSeedAllData = async () => {
    if (!currentUser) return
    
    setLoading(true)
    setSeedingType('all')
    
    try {
      const result = await seedAllData()
      
      if (result.success) {
        addNotification({
          title: 'Data Seeding Successful',
          message: `Successfully seeded ${Object.values(result.dataCount).reduce((a, b) => a + b, 0)} records across all collections`,
          type: 'success',
          userId: currentUser.id
        })
      } else {
        addNotification({
          title: 'Data Seeding Failed',
          message: result.message,
          type: 'error',
          userId: currentUser.id
        })
      }
    } catch (error) {
      addNotification({
        title: 'Data Seeding Error',
        message: `Error seeding data: ${error}`,
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
      setSeedingType('')
    }
  }

  const handleSeedFinancialData = async () => {
    if (!currentUser) return
    
    setLoading(true)
    setSeedingType('financial')
    
    try {
      const result = await seedFinancialData()
      
      if (result.success) {
        addNotification({
          title: 'Financial Data Seeding Successful',
          message: 'Successfully seeded budgets, invoices, service charges, income, and expenditure data',
          type: 'success',
          userId: currentUser.id
        })
      } else {
        addNotification({
          title: 'Financial Data Seeding Failed',
          message: result.message,
          type: 'error',
          userId: currentUser.id
        })
      }
    } catch (error) {
      addNotification({
        title: 'Financial Data Seeding Error',
        message: `Error seeding financial data: ${error}`,
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
      setSeedingType('')
    }
  }

  const handleSeedMaintenanceData = async () => {
    if (!currentUser) return
    
    setLoading(true)
    setSeedingType('maintenance')
    
    try {
      const result = await seedMaintenanceData()
      
      if (result.success) {
        addNotification({
          title: 'Maintenance Data Seeding Successful',
          message: 'Successfully seeded assets, tickets, and work orders data',
          type: 'success',
          userId: currentUser.id
        })
      } else {
        addNotification({
          title: 'Maintenance Data Seeding Failed',
          message: result.message,
          type: 'error',
          userId: currentUser.id
        })
      }
    } catch (error) {
      addNotification({
        title: 'Maintenance Data Seeding Error',
        message: `Error seeding maintenance data: ${error}`,
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
      setSeedingType('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Data Seeding</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Populate the database with realistic dummy data for testing all application features.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleSeedAllData}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
            loading && seedingType === 'all'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {loading && seedingType === 'all' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span className="font-medium">
            {loading && seedingType === 'all' ? 'Seeding...' : 'Seed All Data'}
          </span>
        </button>
        
        <button
          onClick={handleSeedFinancialData}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
            loading && seedingType === 'financial'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
          }`}
        >
          {loading && seedingType === 'financial' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          ) : (
            <DollarSign className="h-4 w-4" />
          )}
          <span className="font-medium">
            {loading && seedingType === 'financial' ? 'Seeding...' : 'Seed Financial Data'}
          </span>
        </button>
        
        <button
          onClick={handleSeedMaintenanceData}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
            loading && seedingType === 'maintenance'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
          }`}
        >
          {loading && seedingType === 'maintenance' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
          ) : (
            <Wrench className="h-4 w-4" />
          )}
          <span className="font-medium">
            {loading && seedingType === 'maintenance' ? 'Seeding...' : 'Seed Maintenance Data'}
          </span>
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">What will be seeded:</p>
            <ul className="text-xs space-y-1">
              <li>• <strong>All Data:</strong> Buildings, flats, people, assets, tickets, budgets, invoices, service charges, income, expenditure, work orders, reminders</li>
              <li>• <strong>Financial Data:</strong> Budgets, invoices, service charges, income, expenditure</li>
              <li>• <strong>Maintenance Data:</strong> Assets, tickets, work orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataSeeder 