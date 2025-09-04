import React from 'react'
import { FileText } from 'lucide-react'

interface DocumentManagerProps {
  buildingId?: string
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ buildingId }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-neutral-900">Document Manager</h1>
      </div>
      
      <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
        <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Document Management</h3>
        <p className="text-gray-600 mb-4">
          Document management features will be available soon.
        </p>
        <p className="text-sm text-neutral-500">
          Building ID: {buildingId || 'Not specified'}
        </p>
      </div>
    </div>
  )
}

export default DocumentManager
