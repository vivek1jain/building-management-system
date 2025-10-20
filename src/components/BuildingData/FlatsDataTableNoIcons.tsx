import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Flat, Building } from '../../types'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding } from '../../services/flatService'
import DataTable, { Column, TableAction } from '../UI/DataTable'

const FlatsDataTableNoIcons: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [flats, setFlats] = useState<(Flat & { isActive: boolean })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeData()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadFlats()
    }
  }, [selectedBuilding])

  const initializeData = async () => {
    try {
      setLoading(true)
      const buildingsData = await getAllBuildings()
      setBuildings(buildingsData)
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFlats = async () => {
    if (!selectedBuilding) return
    try {
      setLoading(true)
      const buildingFlats = await getFlatsByBuilding(selectedBuilding)
      const flatsWithActiveFlag = buildingFlats.map(flat => ({ ...flat, isActive: true }))
      setFlats(flatsWithActiveFlag)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  // Complex columns but NO ICONS
  const columns: Column<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'flatInfo',
      title: 'Flat',
      dataIndex: 'flatNumber',
      sortable: true,
      render: (value, flat) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">{flat.flatNumber}</div>
          <div className="text-xs text-neutral-500">Floor {flat.floor}</div>
        </div>
      )
    },
    {
      key: 'details',
      title: 'Details',
      dataIndex: 'areaSqFt',
      sortable: false,
      render: (value, flat) => (
        <div className="space-y-1">
          <div className="text-sm text-neutral-900">{flat.areaSqFt || 0} sq ft</div>
          <div className="text-xs text-neutral-500">
            {flat.bedrooms || 0} bed, {flat.bathrooms || 0} bath
          </div>
        </div>
      )
    },
    {
      key: 'rent',
      title: 'Rent',
      dataIndex: 'currentRent',
      sortable: true,
      render: (value, flat) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-neutral-900">{formatCurrency(flat.currentRent || 0)}</div>
          <div className="text-xs text-neutral-500">
            Ground: {formatCurrency(flat.groundRent || 0)}
          </div>
        </div>
      )
    }
  ], [])

  // Actions without icons - just text
  const rowActions: TableAction<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      onClick: (flat) => console.log('View flat:', flat.id),
      variant: 'outline'
    },
    {
      key: 'edit',
      label: 'Edit',
      onClick: (flat) => console.log('Edit flat:', flat.id),
      variant: 'outline'
    }
  ], [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Flats - DataTable without Icons</h2>
        <p>Buildings: {buildings.length}, Flats: {flats.length}</p>
        <p>Testing complex columns and actions but without any icons</p>
      </div>
      
      <DataTable
        data={flats}
        columns={columns}
        actions={rowActions}
        emptyMessage="No flats found"
      />
    </div>
  )
}

export default FlatsDataTableNoIcons
