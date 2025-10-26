import { Building } from 'lucide-react'
import React from 'react'
import { useBuilding } from '../../contexts/BuildingContext'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { Dropdown, DropdownOption } from '../UI'

const HeaderBuildingSwitcher: React.FC = () => {
  const { 
    buildings, 
    selectedBuilding, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    loading, 
    error 
  } = useBuilding()
  const isMobile = useIsMobile()

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

  // Convert buildings to dropdown options (simplified for mobile)
  const buildingOptions: DropdownOption[] = buildings.map((building) => ({
    value: building.id,
    label: building.name,
    description: isMobile 
      ? `${building.units} units` // Simplified for mobile
      : building.address ? `${building.units} units • ${building.address}` : `${building.units} units`
  }))

  return (
    <Dropdown
      options={buildingOptions}
      value={selectedBuildingId}
      onChange={setSelectedBuildingId}
      placeholder={isMobile ? "Building" : "Select Building"}
      icon={<Building className="h-4 w-4" />}
      size="sm"
      variant="default"
      showSearch={buildingOptions.length > 5}
      className={isMobile ? "min-w-[120px] max-w-[140px]" : "min-w-[200px]"}
      buttonClassName={`text-sm font-medium ${isMobile ? 'truncate' : ''}`}
      dropdownClassName={isMobile ? "w-64 right-0" : "w-full"}
    />
  )
}

export default HeaderBuildingSwitcher
