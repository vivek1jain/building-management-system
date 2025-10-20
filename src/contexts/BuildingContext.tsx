import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Building } from '../types'
import { getAllBuildings } from '../services/buildingService'
import { useAuth } from './AuthContext'

interface BuildingContextType {
  buildings: Building[]
  selectedBuilding: Building | null
  selectedBuildingId: string
  setSelectedBuildingId: (buildingId: string) => void
  loading: boolean
  error: string | null
  refreshBuildings: () => Promise<void>
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined)

interface BuildingProviderProps {
  children: ReactNode
}

export const BuildingProvider: React.FC<BuildingProviderProps> = ({ children }) => {
  const { currentUser } = useAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load buildings on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      loadBuildings()
    }
  }, [currentUser])

  // Auto-select first building if none selected but buildings available
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      // Try to load from localStorage first
      const savedBuildingId = localStorage.getItem('selectedBuildingId')
      if (savedBuildingId && buildings.some(b => b.id === savedBuildingId)) {
        setSelectedBuildingId(savedBuildingId)
      } else {
        // Default to first building
        setSelectedBuildingId(buildings[0].id)
      }
    }
  }, [buildings, selectedBuildingId])

  // Save selected building to localStorage
  useEffect(() => {
    if (selectedBuildingId) {
      localStorage.setItem('selectedBuildingId', selectedBuildingId)
    }
  }, [selectedBuildingId])

  const loadBuildings = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🏢 Loading buildings from BuildingContext...')
      
      const buildingsData = await getAllBuildings()
      console.log('🏢 Buildings loaded in context:', buildingsData.length)
      
      setBuildings(buildingsData)
      
      // If no buildings found, show appropriate message
      if (buildingsData.length === 0) {
        setError('No buildings found. Please add a building first.')
      }
    } catch (err) {
      console.error('❌ Error loading buildings in context:', err)
      setError('Failed to load buildings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshBuildings = async () => {
    await loadBuildings()
  }

  const handleSetSelectedBuildingId = (buildingId: string) => {
    console.log('🏢 Building selected:', buildingId)
    setSelectedBuildingId(buildingId)
  }

  // Get the currently selected building object
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null

  const value: BuildingContextType = {
    buildings,
    selectedBuilding,
    selectedBuildingId,
    setSelectedBuildingId: handleSetSelectedBuildingId,
    loading,
    error,
    refreshBuildings
  }

  return (
    <BuildingContext.Provider value={value}>
      {children}
    </BuildingContext.Provider>
  )
}

export const useBuilding = (): BuildingContextType => {
  const context = useContext(BuildingContext)
  if (context === undefined) {
    throw new Error('useBuilding must be used within a BuildingProvider')
  }
  return context
}

export default BuildingContext
