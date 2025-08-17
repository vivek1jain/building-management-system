import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Flat, Building } from '../../types'
import { getAllBuildings } from '../../services/buildingService'
import { getFlatsByBuilding } from '../../services/flatService'

const FlatsDataTableWithFirebase: React.FC = () => {
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
          <h2 className="text-xl font-semibold text-neutral-900">Flats Management - With Firebase</h2>
          <p className="text-sm text-gray-600">Testing with Firebase service calls</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded border">
        <p>Current user: {currentUser?.name || 'No user'}</p>
        <p>Buildings loaded: {buildings.length}</p>
        <p>Selected building: {selectedBuilding}</p>
        <p>Flats loaded: {flats.length}</p>
        
        {buildings.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Buildings:</h3>
            <ul className="list-disc list-inside">
              {buildings.map(building => (
                <li key={building.id}>{building.name} ({building.id})</li>
              ))}
            </ul>
          </div>
        )}
        
        {flats.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Flats:</h3>
            <ul className="list-disc list-inside">
              {flats.slice(0, 3).map(flat => (
                <li key={flat.id}>{flat.flatNumber} - Floor {flat.floor}</li>
              ))}
              {flats.length > 3 && <li>... and {flats.length - 3} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlatsDataTableWithFirebase
