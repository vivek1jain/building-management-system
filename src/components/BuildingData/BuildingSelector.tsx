import React from 'react'
import { Building } from '../../types'

interface BuildingSelectorProps {
  buildings: Building[]
  selectedBuildingId: string
  onBuildingChange: (buildingId: string) => void
  label?: string
  required?: boolean
  className?: string
}

const BuildingSelector: React.FC<BuildingSelectorProps> = ({
  buildings,
  selectedBuildingId,
  onBuildingChange,
  label = "Building",
  required = false,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={selectedBuildingId}
        onChange={(e) => onBuildingChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
        required={required}
      >
        <option value="">Select Building</option>
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default BuildingSelector
