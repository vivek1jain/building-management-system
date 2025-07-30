import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export const updateAllSupplierEmails = async () => {
  try {
    console.log('Updating all supplier emails to admin@sidesix.co.uk...')
    
    const suppliersCollection = collection(db, 'suppliers')
    const querySnapshot = await getDocs(suppliersCollection)
    
    let updatedCount = 0
    
    for (const supplierDoc of querySnapshot.docs) {
      const supplierData = supplierDoc.data()
      
      if (supplierData.email !== 'admin@sidesix.co.uk') {
        await updateDoc(doc(suppliersCollection, supplierDoc.id), {
          email: 'admin@sidesix.co.uk',
          updatedAt: new Date()
        })
        
        console.log(`Updated supplier: ${supplierData.name}`)
        updatedCount++
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} supplier emails`)
    return updatedCount
  } catch (error) {
    console.error('Error updating supplier emails:', error)
    throw error
  }
}

// Function to run this from the browser console
export const runEmailUpdate = () => {
  updateAllSupplierEmails()
    .then(count => {
      console.log(`Updated ${count} suppliers`)
      alert(`Successfully updated ${count} supplier emails to admin@sidesix.co.uk`)
    })
    .catch(error => {
      console.error('Failed to update emails:', error)
      alert('Failed to update supplier emails. Check console for details.')
    })
} 