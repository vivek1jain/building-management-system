import { Supplier, Person, Flat, Asset } from '../types'

// Generic CSV export utility
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Partial<Record<keyof T, string>>
) => {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from first object or use provided headers
  const keys = Object.keys(data[0]) as (keyof T)[]
  const csvHeaders = headers 
    ? keys.map(key => headers[key] || String(key))
    : keys.map(String)

  // Create CSV content
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      keys.map(key => {
        const value = row[key]
        // Handle different data types
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') {
          if (value && typeof value.toISOString === 'function') return value.toISOString().split('T')[0]
          if (Array.isArray(value)) return `"${value.join('; ')}"`
          return `"${JSON.stringify(value)}"`
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Specific export functions for each data type
export const exportSuppliersToCSV = (suppliers: (Supplier & { buildingId: string })[], buildingName?: string) => {
  const headers = {
    name: 'Name',
    companyName: 'Company Name',
    email: 'Email',
    phone: 'Phone',
    specialties: 'Specialties',
    rating: 'Rating',
    totalJobs: 'Total Jobs',
    buildingId: 'Building ID',
    isActive: 'Active',
    createdAt: 'Created Date'
  }
  
  const filename = buildingName ? `suppliers_${buildingName}_${new Date().toISOString().split('T')[0]}` : `suppliers_${new Date().toISOString().split('T')[0]}`
  exportToCSV(suppliers, filename, headers)
}

export const exportPeopleToCSV = (people: (Person & { isActive: boolean })[], buildingName?: string) => {
  const headers = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    flatNumber: 'Flat Number',
    status: 'Status',
    isPrimaryContact: 'Primary Contact',
    moveInDate: 'Move In Date',
    moveOutDate: 'Move Out Date',
    buildingId: 'Building ID',
    isActive: 'Active',
    createdAt: 'Created Date'
  }
  
  const filename = buildingName ? `people_${buildingName}_${new Date().toISOString().split('T')[0]}` : `people_${new Date().toISOString().split('T')[0]}`
  exportToCSV(people, filename, headers)
}

export const exportFlatsToCSV = (flats: (Flat & { isActive: boolean })[], buildingName?: string) => {
  const headers = {
    flatNumber: 'Flat Number',
    floor: 'Floor',
    areaSqFt: 'Area (sq ft)',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    currentRent: 'Current Rent',
    groundRent: 'Ground Rent',
    status: 'Status',
    buildingId: 'Building ID',
    isActive: 'Active',
    createdAt: 'Created Date'
  }
  
  const filename = buildingName ? `flats_${buildingName}_${new Date().toISOString().split('T')[0]}` : `flats_${new Date().toISOString().split('T')[0]}`
  exportToCSV(flats, filename, headers)
}

export const exportAssetsToCSV = (assets: (Asset & { isActive: boolean })[], buildingName?: string) => {
  const headers = {
    name: 'Asset Name',
    type: 'Type',
    status: 'Status',
    locationDescription: 'Location',
    manufacturer: 'Manufacturer',
    modelNumber: 'Model Number',
    serialNumber: 'Serial Number',
    installationDate: 'Installation Date',
    warrantyExpiryDate: 'Warranty Expiry',
    buildingId: 'Building ID',
    isActive: 'Active',
    createdAt: 'Created Date'
  }
  
  const filename = buildingName ? `assets_${buildingName}_${new Date().toISOString().split('T')[0]}` : `assets_${new Date().toISOString().split('T')[0]}`
  exportToCSV(assets, filename, headers)
}
