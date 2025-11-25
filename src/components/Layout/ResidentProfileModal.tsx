import { Home, User, Phone, Mail, Calendar, MapPin, AlertCircle, Info, X } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getPeopleByBuilding } from '../../services/peopleService'
import { getFlatsByBuilding } from '../../services/flatService'
import { Person, Flat } from '../../types'

interface ResidentProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const ResidentProfileModal: React.FC<ResidentProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth()
  const { selectedBuilding } = useBuilding()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(true)
  const [person, setPerson] = useState<Person | null>(null)
  const [flat, setFlat] = useState<Flat | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadResidentProfile()
    }
  }, [isOpen, currentUser?.id, selectedBuilding?.id])

  const loadResidentProfile = async () => {
    // Early return without notification if data not ready
    if (!currentUser || !selectedBuilding) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Get resident's person record
      const people = await getPeopleByBuilding(selectedBuilding.id)
      const personRecord = people.find(p => p.uid === currentUser.id)

      if (!personRecord) {
        addNotification({
          title: 'Profile Not Found',
          message: 'Your profile information is not available. Please contact management.',
          type: 'warning',
          userId: currentUser.id
        })
        setLoading(false)
        return
      }

      setPerson(personRecord)

      // Get flat information if associated
      if (personRecord.flatId) {
        try {
          const flats = await getFlatsByBuilding(selectedBuilding.id)
          const flatRecord = flats.find(f => f.id === personRecord.flatId)
          setFlat(flatRecord || null)
        } catch (flatError) {
          console.error('Error loading flat information (non-critical):', flatError)
          setFlat(null)
        }
      }

    } catch (error) {
      console.error('Error loading resident profile:', error)
      if (!person) {
        addNotification({
          title: 'Error',
          message: 'Failed to load profile information',
          type: 'error',
          userId: currentUser?.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : !person ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Profile Not Available</h3>
                <p className="text-neutral-600">
                  Your profile has not been set up yet. Please contact building management.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="bg-neutral-50 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-neutral-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-neutral-600">Full Name</p>
                        <p className="text-sm text-neutral-900">{person.name}</p>
                      </div>
                    </div>

                    {person.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-neutral-600">Email</p>
                          <p className="text-sm text-neutral-900">{person.email}</p>
                        </div>
                      </div>
                    )}

                    {person.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-neutral-600">Phone</p>
                          <p className="text-sm text-neutral-900">{person.phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-neutral-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-neutral-600">Status</p>
                        <p className="text-sm text-neutral-900">{person.status}</p>
                      </div>
                    </div>

                    {person.moveInDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-neutral-600">Move In Date</p>
                          <p className="text-sm text-neutral-900">
                            {new Date(person.moveInDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Building Information - Right side */}
                  {selectedBuilding && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-neutral-900">{selectedBuilding.name}</p>
                      <p className="text-xs text-neutral-600 mt-1">{selectedBuilding.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Flat Information */}
              {flat && (
                <div className="bg-neutral-50 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-success-100 p-2 rounded-lg">
                      <Home className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">Flat Information</h3>
                      <p className="text-xs text-neutral-600">Your residence details</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-neutral-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-neutral-600">Flat Number</p>
                        <p className="text-base font-bold text-neutral-900">{flat.flatNumber}</p>
                      </div>
                    </div>

                    {flat.floor !== undefined && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-neutral-600">Floor</p>
                          <p className="text-sm text-neutral-900">{flat.floor}</p>
                        </div>
                        {flat.buildingBlock && (
                          <div>
                            <p className="text-xs font-medium text-neutral-600">Building Block</p>
                            <p className="text-sm text-neutral-900">{flat.buildingBlock}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(flat.bedrooms || flat.bathrooms || flat.areaSqFt) && (
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100">
                        {flat.bedrooms && (
                          <div>
                            <p className="text-xs font-medium text-neutral-600">Bedrooms</p>
                            <p className="text-sm text-neutral-900">{flat.bedrooms}</p>
                          </div>
                        )}
                        {flat.bathrooms && (
                          <div>
                            <p className="text-xs font-medium text-neutral-600">Bathrooms</p>
                            <p className="text-sm text-neutral-900">{flat.bathrooms}</p>
                          </div>
                        )}
                        {flat.areaSqFt && (
                          <div>
                            <p className="text-xs font-medium text-neutral-600">Area</p>
                            <p className="text-sm text-neutral-900">{flat.areaSqFt} sq ft</p>
                          </div>
                        )}
                      </div>
                    )}

                    {flat.status && (
                      <div className="pt-3 border-t border-neutral-100">
                        <p className="text-xs font-medium text-neutral-600">Status</p>
                        <p className="text-sm text-neutral-900">{flat.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {person.emergencyContact && (
                <div className="bg-neutral-50 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-danger-100 p-2 rounded-lg">
                      <Phone className="h-5 w-5 text-danger-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">Emergency Contact</h3>
                      <p className="text-xs text-neutral-600">In case of emergency</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-neutral-600">Name</p>
                      <p className="text-sm text-neutral-900">{person.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-600">Phone</p>
                      <p className="text-sm text-neutral-900">{person.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {person.notes && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-primary-900">Additional Information</h4>
                      <p className="text-xs text-primary-700 mt-1">{person.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResidentProfileModal
