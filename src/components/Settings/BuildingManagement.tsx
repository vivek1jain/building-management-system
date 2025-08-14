import React from 'react'
import { Building2 } from 'lucide-react'

export const BuildingManagement: React.FC<any> = (props) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Building Management</h2>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Building Management</h3>
        <p className="text-gray-600 mb-4">
          Building management features will be available soon.
        </p>
        <p className="text-sm text-gray-500">
          Current buildings: {props.buildings?.length || 0}
        </p>
      </div>
    </div>
  )
}
