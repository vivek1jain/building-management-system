import React, { useState } from 'react'
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { seedFirebaseData } from '../../utils/seedFirebaseData'
import { useNotifications } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'

const SeedDataButton: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { addNotification } = useNotifications()
  const { currentUser } = useAuth()

  const handleSeedData = async () => {
    if (!currentUser) {
      addNotification({
        title: 'Authentication Required',
        message: 'Please log in to seed data',
        type: 'error',
        userId: 'current'
      })
      return
    }

    setIsSeeding(true)
    setSeedingStatus('idle')

    try {
      console.log('🌱 Starting data seeding process...')
      
      await seedFirebaseData()
      
      setSeedingStatus('success')
      addNotification({
        title: 'Data Seeding Complete!',
        message: 'Successfully created comprehensive mock data in Firebase. You can now test all functionality.',
        type: 'success',
        userId: currentUser.id
      })
      
      console.log('✅ Data seeding completed successfully!')
      
    } catch (error: any) {
      console.error('❌ Data seeding failed:', error)
      setSeedingStatus('error')
      addNotification({
        title: 'Data Seeding Failed',
        message: `Failed to create mock data: ${error.message || 'Unknown error'}`,
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const getButtonContent = () => {
    if (isSeeding) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Seeding Data...
        </>
      )
    }

    if (seedingStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Data Seeded Successfully
        </>
      )
    }

    if (seedingStatus === 'error') {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
          Seeding Failed - Retry
        </>
      )
    }

    return (
      <>
        <Database className="h-4 w-4 mr-2" />
        Seed Firebase Data
      </>
    )
  }

  const getButtonClass = () => {
    if (seedingStatus === 'success') {
      return 'bg-green-600 hover:bg-green-700 text-white'
    }
    if (seedingStatus === 'error') {
      return 'bg-red-600 hover:bg-red-700 text-white'
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Firebase Test Data</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create comprehensive mock data for testing all Building Management System functionality
          </p>
          
          {seedingStatus === 'idle' && (
            <div className="mt-3 text-sm text-gray-500">
              <p><strong>This will create:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>3 UK buildings (Riverside Gardens, Victoria Heights, Canary Wharf Towers)</li>
                <li>78 flats across all buildings with realistic UK property data</li>
                <li>~60 residents with contact details and flat assignments</li>
                <li>9 suppliers (maintenance, cleaning, security services)</li>
                <li>9 assets (elevators, CCTV, boilers) with maintenance schedules</li>
                <li>24 tickets covering various building issues</li>
                <li>18 work orders for maintenance and upgrades</li>
                <li>9 events (meetings, drills, maintenance schedules)</li>
              </ul>
            </div>
          )}
          
          {seedingStatus === 'success' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ Mock data created successfully! You can now navigate through all modules and test:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-green-700 space-y-1">
                <li>Building Data Management (People, Flats, Suppliers, Assets)</li>
                <li>Financial Management (Service Charges, Budgets)</li>
                <li>Tickets & Work Orders workflow</li>
                <li>Events scheduling and management</li>
                <li>Multi-building selection and filtering</li>
              </ul>
            </div>
          )}
          
          {seedingStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                ❌ Data seeding failed. Please check the console for details and try again.
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSeedData}
          disabled={isSeeding}
          className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center ${getButtonClass()} ${
            isSeeding ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {getButtonContent()}
        </button>
      </div>
    </div>
  )
}

export default SeedDataButton
