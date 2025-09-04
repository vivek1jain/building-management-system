import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Flat, Building } from '../../types'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding } from '../../services/flatService'
import DataTable, { Column } from '../UI/DataTable'

const FlatsDataTableMinimal: React.FC = () => {
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

  // Minimal columns - just text, no complex rendering
  const columns: Column<Flat & { isActive: boolean }>[] = useMemo(() => [
    {
      key: 'flatNumber',
      title: 'Flat Number',
      dataIndex: 'flatNumber',
      sortable: true
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
        <h2 className="text-xl font-semibold text-neutral-900">Flats - Minimal DataTable Test</h2>
        <p>Buildings: {buildings.length}, Flats: {flats.length}</p>
      </div>
      
      {/* Minimal DataTable - no actions, no complex rendering */}
      <DataTable
        data={flats}
        columns={columns}
        emptyMessage="No flats found"
      />
    </div>
  )
}

export default FlatsDataTableMinimal
