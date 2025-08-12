import React, { useState } from 'react'
import { 
  Building2, 
  Users, 
  Home, 
  Truck, 
  Package,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Braces
} from 'lucide-react'
import PeopleDataTable from '../components/BuildingData/PeopleDataTable'
import FlatsDataTable from '../components/BuildingData/FlatsDataTable'
import SuppliersDataTable from '../components/BuildingData/SuppliersDataTable'
import AssetsDataTable from '../components/BuildingData/AssetsDataTable'

interface TabConfig {
  id: string
  label: string
  icon: React.ComponentType<any>
  component: React.ComponentType<any>
}

const BuildingDataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('people')

  const tabs: TabConfig[] = [
    {
      id: 'people',
      label: 'People',
      icon: Users,
      component: PeopleDataTable
    },
    {
      id: 'flats',
      label: 'Flats',
      icon: Home,
      component: FlatsDataTable
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      component: SuppliersDataTable
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Package,
      component: AssetsDataTable
    }
  ]

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      // This will be implemented with actual export functionality
      console.log(`Exporting ${activeTab} data as ${format}`)
      
      // For now, just show a success message
      // In real implementation, this would call the appropriate export service
      alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} data exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleImport = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      // This will trigger file upload dialog and import functionality
      console.log(`Importing ${activeTab} data from ${format}`)
      
      // For now, just show a message
      // In real implementation, this would open file picker and call import service
      alert(`Import ${format.toUpperCase()} file for ${activeTab}`)
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please try again.')
    }
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PeopleDataTable

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-green-700" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-inter">Building Data Management</h1>
                <p className="text-gray-600 font-inter">Manage all building-related data with bulk import/export capabilities</p>
              </div>
            </div>

            {/* Bulk Import/Export Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 font-inter">Import:</span>
                <button
                  onClick={() => handleImport('csv')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  CSV
                </button>
                <button
                  onClick={() => handleImport('xlsx')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  Excel
                </button>
                <button
                  onClick={() => handleImport('json')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  JSON
                </button>
              </div>

              <div className="h-4 w-px bg-gray-300"></div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 font-inter">Export:</span>
                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-700 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-green-700 text-green-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 font-inter transition-colors`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuildingDataManagement
