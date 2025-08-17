import React from 'react'
import { ChevronDown, Building } from 'lucide-react'
import { useBuilding } from '../../contexts/BuildingContext'

const HeaderBuildingSwitcher: React.FC = () => {
  const { 
    buildings, 
    selectedBuilding, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    loading, 
    error 
  } = useBuilding()

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <Building className="h-4 w-4 text-neutral-400 animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (error || buildings.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-neutral-500">
        <Building className="h-4 w-4" />
        <span>No buildings</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={selectedBuildingId}
        onChange={(e) => setSelectedBuildingId(e.target.value)}
        className="appearance-none bg-white border border-neutral-200 rounded-lg pl-10 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[160px]"
        title={`Current building: ${selectedBuilding?.name || 'Select building'}`}
      >
        {!selectedBuildingId && (
          <option value="">Select Building</option>
        )}
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-neutral-400" />
      </div>
      
      {/* Building icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Building className="h-4 w-4 text-neutral-400" />
      </div>
    </div>
  )
}

export default HeaderBuildingSwitcher
