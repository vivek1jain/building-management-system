import { Supplier } from '../types'

export const sampleSuppliers: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'John Smith',
    companyName: 'ABC Plumbing Services',
    email: 'admin@sidesix.co.uk',
    phone: '+1-555-0123',
    role: 'supplier',
    specialties: ['Plumbing', 'Emergency Repairs'],
    rating: 4.5,
    totalJobs: 127,
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    companyName: 'XYZ Electrical Solutions',
    email: 'admin@sidesix.co.uk',
    phone: '+1-555-0456',
    role: 'supplier',
    specialties: ['Electrical', 'Lighting', 'Security Systems'],
    rating: 4.8,
    totalJobs: 89,
    isActive: true
  },
  {
    name: 'Mike Wilson',
    companyName: 'Maintenance Masters',
    email: 'admin@sidesix.co.uk',
    phone: '+1-555-0789',
    role: 'supplier',
    specialties: ['General Maintenance', 'Cleaning', 'Landscaping'],
    rating: 4.2,
    totalJobs: 156,
    isActive: true
  },
  {
    name: 'Lisa Brown',
    companyName: 'Cool Air HVAC',
    email: 'admin@sidesix.co.uk',
    phone: '+1-555-0321',
    role: 'supplier',
    specialties: ['HVAC', 'General Maintenance'],
    rating: 4.7,
    totalJobs: 203,
    isActive: true
  },
  {
    name: 'David Lee',
    companyName: 'Secure Systems Pro',
    email: 'admin@sidesix.co.uk',
    phone: '+1-555-0654',
    role: 'supplier',
    specialties: ['Security Systems', 'Electrical'],
    rating: 4.9,
    totalJobs: 67,
    isActive: true
  }
]

export const addSampleSuppliers = async () => {
  const { supplierService } = await import('../services/supplierService')
  
  for (const supplier of sampleSuppliers) {
    try {
      await supplierService.createSupplier(supplier)
      console.log(`Added supplier: ${supplier.name}`)
    } catch (error) {
      console.error(`Error adding supplier ${supplier.name}:`, error)
    }
  }
} 