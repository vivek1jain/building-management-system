import React, { useState } from 'react'
import { 
  Building2, 
  Users, 
  Home, 
  Truck, 
  Package
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
                <p className="text-gray-600 font-inter">Manage all building-related data and operations</p>
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
