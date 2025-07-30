import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { addSampleSuppliers } from '../utils/sampleData'
import { supplierService } from '../services/supplierService'
import { Supplier } from '../types'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const TestFirebase = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [isConnected, setIsConnected] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingEmails, setUpdatingEmails] = useState(false)

  useEffect(() => {
    // Test Firebase connection
    const testConnection = async () => {
      try {
        // Try to read from Firestore
        const suppliersData = await supplierService.getSuppliers()
        setIsConnected(true)
        setSuppliers(suppliersData)
        console.log('Firebase connection successful')
      } catch (error) {
        setIsConnected(false)
        console.error('Firebase connection failed:', error)
      }
    }

    testConnection()
  }, [])

  const handleAddSampleSuppliers = async () => {
    setLoading(true)
    try {
      await addSampleSuppliers()
      const updatedSuppliers = await supplierService.getSuppliers()
      setSuppliers(updatedSuppliers)
      addNotification({
        title: 'Success',
        message: 'Sample suppliers added successfully!',
        type: 'success',
        userId: currentUser?.id || ''
      })
    } catch (error) {
      console.error('Error adding sample suppliers:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add sample suppliers',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSupplierEmails = async () => {
    setUpdatingEmails(true)
    try {
      console.log('Updating all supplier emails to admin@sidesix.co.uk...')
      
      const suppliersCollection = collection(db, 'suppliers')
      const querySnapshot = await getDocs(suppliersCollection)
      
      let updatedCount = 0
      
      for (const supplierDoc of querySnapshot.docs) {
        const supplierData = supplierDoc.data()
        
        // Only update if email is different
        if (supplierData.email !== 'admin@sidesix.co.uk') {
          await updateDoc(doc(suppliersCollection, supplierDoc.id), {
            email: 'admin@sidesix.co.uk',
            updatedAt: new Date()
          })
          
          console.log(`Updated supplier: ${supplierData.name} (${supplierData.companyName})`)
          updatedCount++
        }
      }
      
      // Refresh suppliers list
      const updatedSuppliers = await supplierService.getSuppliers()
      setSuppliers(updatedSuppliers)
      
      addNotification({
        title: 'Success',
        message: `Updated ${updatedCount} supplier emails to admin@sidesix.co.uk`,
        type: 'success',
        userId: currentUser?.id || ''
      })
      
      console.log(`✅ Successfully updated ${updatedCount} supplier emails`)
    } catch (error) {
      console.error('Error updating supplier emails:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update supplier emails',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setUpdatingEmails(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Firebase Connection Test</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to Firebase' : 'Not connected to Firebase'}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          <p>Suppliers in database: {suppliers.length}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleAddSampleSuppliers}
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? 'Adding...' : 'Add Sample Suppliers'}
          </button>

          <button
            onClick={handleUpdateSupplierEmails}
            disabled={updatingEmails}
            className="btn-secondary flex items-center"
          >
            {updatingEmails ? 'Updating...' : 'Update All Emails to admin@sidesix.co.uk'}
          </button>
        </div>

        {suppliers.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Suppliers:</h4>
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="text-sm text-gray-600">
                  {supplier.name} - {supplier.companyName} - {supplier.email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestFirebase 