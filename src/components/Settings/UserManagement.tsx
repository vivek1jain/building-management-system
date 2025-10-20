import React from 'react'
import { Users } from 'lucide-react'

export const UserManagement: React.FC<any> = (props) => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
        <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">User Management</h3>
        <p className="text-gray-600 mb-4">
          User management features will be available soon.
        </p>
        <p className="text-sm text-neutral-500">
          Current users: {props.users?.length || 0}
        </p>
      </div>
    </div>
  )
}
