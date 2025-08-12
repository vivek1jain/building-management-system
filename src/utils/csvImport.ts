import { Supplier, Person, Flat, Asset, PersonStatus, AssetStatus } from '../types'

// Generic CSV parser
export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n').filter(line => line.trim())
  const result: string[][] = []
  
  for (const line of lines) {
    const row: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    row.push(current.trim())
    result.push(row)
  }
  
  return result
}

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Import validation results
export interface ImportValidationResult<T> {
  valid: T[]
  errors: Array<{ row: number; field: string; message: string; data: any }>
  warnings: Array<{ row: number; field: string; message: string; data: any }>
}

// Supplier import
export const importSuppliersFromCSV = (
  csvText: string,
  buildingId: string
): ImportValidationResult<Supplier & { buildingId: string }> => {
  const rows = parseCSV(csvText)
  const headers = rows[0]
  const dataRows = rows.slice(1)
  
  const result: ImportValidationResult<Supplier & { buildingId: string }> = {
    valid: [],
    errors: [],
    warnings: []
  }
  
  // Expected headers mapping
  const headerMap: Record<string, string> = {
    'name': 'name',
    'company name': 'companyName',
    'email': 'email',
    'phone': 'phone',
    'specialties': 'specialties',
    'rating': 'rating'
  }
  
  // Find header indices
  const indices: Record<string, number> = {}
  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim()
    const mappedField = headerMap[normalizedHeader]
    if (mappedField) {
      indices[mappedField] = index
    }
  })
  
  // Validate required fields exist
  const requiredFields = ['name', 'email', 'companyName']
  for (const field of requiredFields) {
    if (indices[field] === undefined) {
      result.errors.push({
        row: 0,
        field,
        message: `Required column '${field}' not found in CSV headers`,
        data: headers
      })
    }
  }
  
  if (result.errors.length > 0) {
    return result
  }
  
  // Process each data row
  dataRows.forEach((row, rowIndex) => {
    const actualRowNumber = rowIndex + 2 // +2 because we skip header and arrays are 0-indexed
    
    try {
      const name = row[indices.name]?.trim()
      const email = row[indices.email]?.trim()
      const companyName = row[indices.companyName]?.trim()
      const phone = row[indices.phone]?.trim() || ''
      const specialtiesStr = row[indices.specialties]?.trim() || ''
      const ratingStr = row[indices.rating]?.trim() || '0'
      
      // Validation
      if (!name) {
        result.errors.push({
          row: actualRowNumber,
          field: 'name',
          message: 'Name is required',
          data: row
        })
        return
      }
      
      if (!email) {
        result.errors.push({
          row: actualRowNumber,
          field: 'email',
          message: 'Email is required',
          data: row
        })
        return
      }
      
      if (!validateEmail(email)) {
        result.errors.push({
          row: actualRowNumber,
          field: 'email',
          message: 'Invalid email format',
          data: row
        })
        return
      }
      
      if (!companyName) {
        result.errors.push({
          row: actualRowNumber,
          field: 'companyName',
          message: 'Company name is required',
          data: row
        })
        return
      }
      
      if (phone && !validatePhone(phone)) {
        result.warnings.push({
          row: actualRowNumber,
          field: 'phone',
          message: 'Phone number format may be invalid',
          data: row
        })
      }
      
      // Parse specialties
      const specialties = specialtiesStr
        ? specialtiesStr.split(';').map(s => s.trim()).filter(s => s)
        : ['General']
      
      // Parse rating
      const rating = parseFloat(ratingStr) || 0
      if (rating < 0 || rating > 5) {
        result.warnings.push({
          row: actualRowNumber,
          field: 'rating',
          message: 'Rating should be between 0 and 5',
          data: row
        })
      }
      
      // Create supplier object
      const supplier: Supplier & { buildingId: string } = {
        id: `supplier-import-${Date.now()}-${rowIndex}`,
        name,
        email,
        phone,
        role: 'supplier' as const,
        companyName,
        specialties,
        rating: Math.max(0, Math.min(5, rating)),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        buildingId
      }
      
      result.valid.push(supplier)
      
    } catch (error) {
      result.errors.push({
        row: actualRowNumber,
        field: 'general',
        message: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: row
      })
    }
  })
  
  return result
}

// People import
export const importPeopleFromCSV = (
  csvText: string,
  buildingId: string
): ImportValidationResult<Person & { isActive: boolean }> => {
  const rows = parseCSV(csvText)
  const headers = rows[0]
  const dataRows = rows.slice(1)
  
  const result: ImportValidationResult<Person & { isActive: boolean }> = {
    valid: [],
    errors: [],
    warnings: []
  }
  
  // Expected headers mapping
  const headerMap: Record<string, string> = {
    'name': 'name',
    'email': 'email',
    'phone': 'phone',
    'flat number': 'flatNumber',
    'status': 'status',
    'move in date': 'moveInDate',
    'move out date': 'moveOutDate'
  }
  
  // Find header indices
  const indices: Record<string, number> = {}
  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim()
    const mappedField = headerMap[normalizedHeader]
    if (mappedField) {
      indices[mappedField] = index
    }
  })
  
  // Validate required fields exist
  const requiredFields = ['name', 'email', 'flatNumber']
  for (const field of requiredFields) {
    if (indices[field] === undefined) {
      result.errors.push({
        row: 0,
        field,
        message: `Required column '${field}' not found in CSV headers`,
        data: headers
      })
    }
  }
  
  if (result.errors.length > 0) {
    return result
  }
  
  // Process each data row
  dataRows.forEach((row, rowIndex) => {
    const actualRowNumber = rowIndex + 2
    
    try {
      const name = row[indices.name]?.trim()
      const email = row[indices.email]?.trim()
      const phone = row[indices.phone]?.trim() || ''
      const flatNumber = row[indices.flatNumber]?.trim()
      const statusStr = row[indices.status]?.trim() || 'RESIDENT'
      const moveInDateStr = row[indices.moveInDate]?.trim()
      const moveOutDateStr = row[indices.moveOutDate]?.trim()
      
      // Validation
      if (!name) {
        result.errors.push({
          row: actualRowNumber,
          field: 'name',
          message: 'Name is required',
          data: row
        })
        return
      }
      
      if (!email || !validateEmail(email)) {
        result.errors.push({
          row: actualRowNumber,
          field: 'email',
          message: 'Valid email is required',
          data: row
        })
        return
      }
      
      if (!flatNumber) {
        result.errors.push({
          row: actualRowNumber,
          field: 'flatNumber',
          message: 'Flat number is required',
          data: row
        })
        return
      }
      
      // Parse status
      const validStatuses = Object.values(PersonStatus)
      const status = validStatuses.find(s => s.toLowerCase() === statusStr.toLowerCase()) || PersonStatus.RESIDENT
      
      // Parse dates
      const moveInDate = moveInDateStr ? new Date(moveInDateStr) : null
      const moveOutDate = moveOutDateStr ? new Date(moveOutDateStr) : null
      
      // Create person object
      const person: Person & { isActive: boolean } = {
        id: `person-import-${Date.now()}-${rowIndex}`,
        name,
        email,
        phone,
        buildingId,
        flatId: flatNumber,
        flatNumber,
        status,
        isPrimaryContact: true,
        moveInDate,
        moveOutDate,
        createdAt: new Date(),
        createdByUid: 'import',
        isActive: true
      }
      
      result.valid.push(person)
      
    } catch (error) {
      result.errors.push({
        row: actualRowNumber,
        field: 'general',
        message: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: row
      })
    }
  })
  
  return result
}

// File upload helper
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}
