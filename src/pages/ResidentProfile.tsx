import { Home, User, Phone, Mail, Calendar, MapPin, AlertCircle, Info } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useBuilding } from '../contexts/BuildingContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getPeopleByBuilding } from '../services/peopleService'
import { getFlatsByBuilding } from '../services/flatService'
import { Person, Flat } from '../types'

const ResidentProfile: React.FC = () => {
  const { currentUser } = useAuth()
  const { selectedBuilding } = useBuilding()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(true)
  const [person, setPerson] = useState<Person | null>(null)
  const [flat, setFlat] = useState<Flat | null>(null)

  useEffect(() => {
    loadResidentProfile()
  }, [currentUser?.id, selectedBuilding?.id])

  const loadResidentProfile = async () => {
    // Early return without notification if data not ready
    if (!currentUser || !selectedBuilding) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Loading resident profile for user:', currentUser.id, 'building:', selectedBuilding.id)

      // Get resident's person record
      const people = await getPeopleByBuilding(selectedBuilding.id)
      console.log('Found', people.length, 'people in building')
      const personRecord = people.find(p => p.uid === currentUser.id)

      if (!personRecord) {
        console.log('No person record found for current user')
        addNotification({
          title: 'Profile Not Found',
          message: 'Your profile information is not available. Please contact management.',
          type: 'warning',
          userId: currentUser.id
        })
        setLoading(false)
        return
      }

      console.log('Found person record:', personRecord.name)
      setPerson(personRecord)

      // Get flat information if associated
      if (personRecord.flatId) {
        try {
          console.log('Loading flat information for flatId:', personRecord.flatId)
          const flats = await getFlatsByBuilding(selectedBuilding.id)
          console.log('Found', flats.length, 'flats in building')
          const flatRecord = flats.find(f => f.id === personRecord.flatId)
          if (flatRecord) {
            console.log('Found flat record:', flatRecord.flatNumber)
          } else {
            console.log('No flat record found for flatId:', personRecord.flatId)
          }
          setFlat(flatRecord || null)
        } catch (flatError) {
          console.error('Error loading flat information (non-critical):', flatError)
          // Don't show error notification for flat loading failure - it's not critical
          setFlat(null)
        }
      }

    } catch (error) {
      console.error('Error loading resident profile:', error)
      // Only show error if we haven't already set a person (i.e., the main data load failed)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Profile Not Available</h2>
            <p className="text-neutral-600">
              Your profile has not been set up yet. Please contact building management.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>
          <p className="text-neutral-600">{selectedBuilding?.name}</p>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 p-3 rounded-lg">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Personal Information</h2>
              <p className="text-sm text-neutral-600">Your profile details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-neutral-600">Full Name</p>
                <p className="text-base text-neutral-900">{person.name}</p>
              </div>
            </div>

            {person.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-600">Email</p>
                  <p className="text-base text-neutral-900">{person.email}</p>
                </div>
              </div>
            )}

            {person.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-600">Phone</p>
                  <p className="text-base text-neutral-900">{person.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-neutral-600">Status</p>
                <p className="text-base text-neutral-900">{person.status}</p>
              </div>
            </div>

            {person.moveInDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-600">Move In Date</p>
                  <p className="text-base text-neutral-900">
                    {new Date(person.moveInDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flat Information */}
        {flat && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-success-100 p-3 rounded-lg">
                <Home className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Flat Information</h2>
                <p className="text-sm text-neutral-600">Your residence details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-600">Flat Number</p>
                  <p className="text-lg font-bold text-neutral-900">{flat.flatNumber}</p>
                </div>
              </div>

              {flat.floor !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Floor</p>
                    <p className="text-base text-neutral-900">{flat.floor}</p>
                  </div>
                  {flat.buildingBlock && (
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Building Block</p>
                      <p className="text-base text-neutral-900">{flat.buildingBlock}</p>
                    </div>
                  )}
                </div>
              )}

              {(flat.bedrooms || flat.bathrooms || flat.areaSqFt) && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
                  {flat.bedrooms && (
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Bedrooms</p>
                      <p className="text-base text-neutral-900">{flat.bedrooms}</p>
                    </div>
                  )}
                  {flat.bathrooms && (
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Bathrooms</p>
                      <p className="text-base text-neutral-900">{flat.bathrooms}</p>
                    </div>
                  )}
                  {flat.areaSqFt && (
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Area</p>
                      <p className="text-base text-neutral-900">{flat.areaSqFt} sq ft</p>
                    </div>
                  )}
                </div>
              )}

              {flat.status && (
                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-sm font-medium text-neutral-600">Status</p>
                  <p className="text-base text-neutral-900">{flat.status}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {person.emergencyContact && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-danger-100 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-danger-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Emergency Contact</h2>
                <p className="text-sm text-neutral-600">In case of emergency</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-neutral-600">Name</p>
                <p className="text-base text-neutral-900">{person.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">Phone</p>
                <p className="text-base text-neutral-900">{person.emergencyContact.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {person.notes && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary-900">Additional Information</h3>
                <p className="text-sm text-primary-700 mt-1">{person.notes}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ResidentProfile
