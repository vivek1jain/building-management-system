import React, { useState } from 'react'
import { 
  Building2, 
  Users, 
  Home, 
  Truck, 
  Package
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '../components/UI'
import PeopleDataTable from '../components/BuildingData/PeopleDataTable'
import FlatsDataTable from '../components/BuildingData/FlatsDataTableFixed'
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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter">Building Data Management</h1>
            <p className="text-gray-600 font-inter">Manage people, flats, suppliers, and assets data for your buildings</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}

export default BuildingDataManagement
