import React, { useState, useEffect } from 'react'
import { Truck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { supplierService } from '../../services/supplierService'
import { Supplier } from '../../types'

const SuppliersDataTableMinimal: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId } = useBuilding()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        console.log('🔥 Loading suppliers...')
        setLoading(true)
        setError(null)
        const suppliersData = await supplierService.getSuppliers()
        console.log('🔥 Suppliers loaded:', suppliersData.length)
        setSuppliers(suppliersData)
      } catch (error) {
        console.error('🚨 Error loading suppliers:', error)
        setError(error instanceof Error ? error.message : 'Failed to load suppliers')
        if (currentUser) {
          addNotification({
            title: 'Error',
            message: 'Failed to load suppliers',
            type: 'error',
            userId: currentUser.id
          })
        }
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      loadSuppliers()
    } else {
      setLoading(false)
      setError('No user authenticated')
    }
  }, [currentUser, addNotification])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-sm text-neutral-600">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Truck className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Error Loading Suppliers</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Truck className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Authentication Required</h3>
          <p className="text-sm text-neutral-600">Please log in to view suppliers.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary-600" />
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Suppliers</h2>
            <p className="text-sm text-neutral-600">{suppliers.length} suppliers found</p>
          </div>
        </div>
        <div className="text-sm text-neutral-500">
          Building: {selectedBuildingId || 'None selected'}
        </div>
      </div>

      {/* Simple supplier list */}
      <div className="bg-white rounded-lg border border-neutral-200">
        {suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Suppliers Found</h3>
            <p className="text-neutral-600">No suppliers have been added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {suppliers.map((supplier, index) => (
              <div key={supplier.id || index} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-neutral-900">
                      {supplier.companyName || supplier.name || 'Unknown Supplier'}
                    </h4>
                    <p className="text-sm text-neutral-600 mt-1">{supplier.email}</p>
                    <p className="text-sm text-neutral-600">{supplier.phone || 'No phone'}</p>
                    {supplier.specialties && supplier.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {supplier.specialties.map((specialty, idx) => (
                          <span key={idx} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {supplier.rating && (
                      <div className="text-sm text-neutral-600">
                        Rating: {supplier.rating}/5
                      </div>
                    )}
                    <div className="text-xs text-neutral-500 mt-1">
                      {supplier.isActive !== false ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="bg-neutral-50 rounded-lg p-4 text-xs text-neutral-600">
        <p><strong>Debug Info:</strong></p>
        <p>Current User: {currentUser?.email || 'None'}</p>
        <p>Selected Building: {selectedBuildingId || 'None'}</p>
        <p>Suppliers Count: {suppliers.length}</p>
        <p>Loading: {loading.toString()}</p>
        <p>Error: {error || 'None'}</p>
      </div>
    </div>
  )
}

export default SuppliersDataTableMinimal
