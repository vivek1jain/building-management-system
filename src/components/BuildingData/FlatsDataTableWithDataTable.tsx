import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Home, Edit, Trash2, Eye, Building as BuildingIcon, MapPin, DollarSign, Users, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Flat, Building } from '../../types'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding } from '../../services/flatService'
import DataTable, { Column, TableAction } from '../UI/DataTable'

const FlatsDataTableWithDataTable: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [flats, setFlats] = useState<(Flat & { isActive: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
      console.log('🔥 Loading buildings from Firebase...')
      const buildingsData = await getAllBuildings()
      console.log('🔥 Buildings loaded:', buildingsData.length)
      setBuildings(buildingsData)
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('🚨 Error initializing data:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load buildings',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadFlats = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      console.log('🔥 Loading flats from Firebase for building:', selectedBuilding)
      const buildingFlats = await getFlatsByBuilding(selectedBuilding)
      console.log('🔥 Flats loaded:', buildingFlats.length)
      // Add isActive property for compatibility
      const flatsWithActiveFlag = buildingFlats.map(flat => ({ ...flat, isActive: true }))
      setFlats(flatsWithActiveFlag)
    } catch (error) {
      console.error('🚨 Error loading flats:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load flats from Firebase',
          type: 'error',
          userId: currentUser.id
        })
      }
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

  // Filter flats with memoization
  const filteredFlats = useMemo(() => {
    return flats.filter(flat => {
      const isActive = flat.isActive
      const matchesBuilding = !selectedBuilding || flat.buildingId === selectedBuilding
      const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           flat.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return isActive && matchesBuilding && matchesSearch
    })
  }, [flats, selectedBuilding, searchTerm])

  // Define table columns
  const columns: Column<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'flatInfo',
      title: 'Flat',
      dataIndex: 'flatNumber',
      sortable: true,
      render: (value, flat) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">{flat.flatNumber}</div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-neutral-400" />
            <span className="text-xs text-neutral-500">Floor {flat.floor}</span>
          </div>
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
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {flat.bedrooms || 0} bed
            </span>
            <span>{flat.bathrooms || 0} bath</span>
          </div>
        </div>
      )
    }
  ], [])

  // Define row actions
  const rowActions: TableAction<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (flat) => console.log('View flat:', flat.id),
      variant: 'outline'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Flats Management - With DataTable</h2>
          <p className="text-sm text-gray-600">Testing with DataTable component</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded border mb-4">
        <p>Buildings: {buildings.length}, Flats: {flats.length}, Filtered: {filteredFlats.length}</p>
        <p>Columns: {columns.length}, Actions: {rowActions.length}</p>
      </div>
      
      {/* Flats Table */}
      <DataTable
        data={filteredFlats}
        columns={columns}
        actions={rowActions}
        emptyMessage="No flats found. Get started by adding your first flat."
      />
    </div>
  )
}

export default FlatsDataTableWithDataTable
