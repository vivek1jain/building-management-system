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
import PeoplePage from './People'
import FlatsPage from './Flats'
import SuppliersPage from './Suppliers'
import AssetsPage from './Assets' // We'll create this

interface TabConfig {
  id: string
  label: string
  icon: React.ComponentType<any>
  component: React.ComponentType<any>
}

const BuildingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('people')

  const tabs: TabConfig[] = [
    {
      id: 'people',
      label: 'People',
      icon: Users,
      component: PeoplePage
    },
    {
      id: 'flats',
      label: 'Flats',
      icon: Home,
      component: FlatsPage
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      component: SuppliersPage
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Package,
      component: AssetsPage
    }
  ]

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    // This will be implemented with actual export functionality
    console.log(`Exporting ${activeTab} data as ${format}`)
  }

  const handleImport = (format: 'csv' | 'xlsx' | 'json') => {
    // This will be implemented with actual import functionality
    console.log(`Importing ${activeTab} data from ${format}`)
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PeoplePage

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Building Management</h1>
                <p className="text-gray-600">Manage all building-related data and operations</p>
              </div>
            </div>

            {/* Bulk Import/Export Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Import:</span>
                <button
                  onClick={() => handleImport('csv')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FileText className="h-3 w-3" />
                  CSV
                </button>
                <button
                  onClick={() => handleImport('xlsx')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel
                </button>
                <button
                  onClick={() => handleImport('json')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Braces className="h-3 w-3" />
                  JSON
                </button>
              </div>

              <div className="h-4 w-px bg-gray-300"></div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Export:</span>
                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Download className="h-3 w-3" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
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

export default BuildingManagement
