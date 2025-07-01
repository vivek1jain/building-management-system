import { supplierService } from '../services/supplierService'
import { Supplier } from '../types'

export const sampleSuppliers: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    email: 'abc@plumbing.com',
    name: 'John Smith',
    role: 'supplier',
    companyName: 'ABC Plumbing',
    specialties: ['Plumbing', 'HVAC', 'Emergency Repairs'],
    rating: 4.8,
    totalJobs: 156,
    isActive: true
  },
  {
    email: 'electrical@pro.com',
    name: 'Sarah Johnson',
    role: 'supplier',
    companyName: 'Pro Electrical Services',
    specialties: ['Electrical', 'Lighting', 'Security Systems'],
    rating: 4.9,
    totalJobs: 203,
    isActive: true
  },
  {
    email: 'maintenance@build.com',
    name: 'Mike Wilson',
    role: 'supplier',
    companyName: 'Building Maintenance Co.',
    specialties: ['General Maintenance', 'Cleaning', 'Landscaping'],
    rating: 4.6,
    totalJobs: 89,
    isActive: true
  },
  {
    email: 'hvac@cool.com',
    name: 'Lisa Chen',
    role: 'supplier',
    companyName: 'Cool HVAC Solutions',
    specialties: ['HVAC', 'Air Conditioning', 'Heating'],
    rating: 4.7,
    totalJobs: 134,
    isActive: true
  },
  {
    email: 'security@safe.com',
    name: 'David Rodriguez',
    role: 'supplier',
    companyName: 'Safe Security Systems',
    specialties: ['Security Systems', 'CCTV', 'Access Control'],
    rating: 4.5,
    totalJobs: 67,
    isActive: true
  }
]

export const addSampleSuppliers = async () => {
  try {
    for (const supplier of sampleSuppliers) {
      await supplierService.createSupplier(supplier)
    }
    console.log('Sample suppliers added successfully')
  } catch (error) {
    console.error('Error adding sample suppliers:', error)
  }
} 