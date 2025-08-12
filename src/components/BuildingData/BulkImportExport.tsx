import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'
import { Building } from '../../types'
import { readFileAsText, ImportValidationResult } from '../../utils/csvImport'

interface BulkImportExportProps {
  dataType: 'suppliers' | 'people' | 'flats' | 'assets'
  buildings: Building[]
  selectedBuildingId: string
  onExport: (buildingId: string, buildingName?: string) => void
  onImport: (csvText: string, buildingId: string) => ImportValidationResult<any>
  onImportConfirm: (validData: any[]) => void
  className?: string
}

const BulkImportExport: React.FC<BulkImportExportProps> = ({
  dataType,
  buildings,
  selectedBuildingId,
  onExport,
  onImport,
  onImportConfirm,
  className = ""
}) => {
  const { addNotification } = useNotifications()
  const { currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<ImportValidationResult<any> | null>(null)
  const [importing, setImporting] = useState(false)

  const dataTypeLabels = {
    suppliers: 'Suppliers',
    people: 'People',
    flats: 'Flats',
    assets: 'Assets'
  }

  const handleExport = () => {
    if (!selectedBuildingId) {
      addNotification({
        title: 'Error',
        message: 'Please select a building to export data',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    const building = buildings.find(b => b.id === selectedBuildingId)
    onExport(selectedBuildingId, building?.name)
    
    addNotification({
      title: 'Success',
      message: `${dataTypeLabels[dataType]} exported successfully`,
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  const handleImportClick = () => {
    if (!selectedBuildingId) {
      addNotification({
        title: 'Error',
        message: 'Please select a building to import data',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      addNotification({
        title: 'Error',
        message: 'Please select a CSV file',
        type: 'error',
        userId: currentUser?.id || ''
      })
      return
    }

    try {
      setImporting(true)
      const csvText = await readFileAsText(file)
      const result = onImport(csvText, selectedBuildingId)
      setImportResult(result)
      setShowImportModal(true)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to read file',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportConfirm = () => {
    if (!importResult || !currentUser) return

    onImportConfirm(importResult.valid)
    setShowImportModal(false)
    setImportResult(null)

    addNotification({
      title: 'Success',
      message: `${importResult.valid.length} ${dataTypeLabels[dataType].toLowerCase()} imported successfully`,
      type: 'success',
      userId: currentUser.id
    })
  }

  const downloadTemplate = () => {
    const templates = {
      suppliers: 'Name,Company Name,Email,Phone,Specialties,Rating\nJohn Doe Plumbing,John Doe Plumbing Inc,john@example.com,+1-555-0100,Plumbing,4.5\nElite Electric,Elite Electrical Solutions,info@elite.com,+1-555-0101,Electrical,4.8',
      people: 'Name,Email,Phone,Flat Number,Status,Move In Date,Move Out Date\nJohn Smith,john@example.com,+1-555-0123,A101,RESIDENT,2023-01-15,\nJane Doe,jane@example.com,+1-555-0124,A102,TENANT,2023-02-01,',
      flats: 'Flat Number,Floor,Area (sq ft),Bedrooms,Bathrooms,Current Rent,Ground Rent,Status\nA101,1,1200,2,2,2500,5000,occupied\nA102,1,1000,1,1,2000,4000,vacant',
      assets: 'Asset Name,Type,Status,Location,Manufacturer,Model Number,Serial Number,Installation Date,Warranty Expiry\nMain Elevator,elevator,Operational,Central Lobby,Otis,Gen2 Premier,OT-2020-001,2020-01-15,2025-01-15'
    }

    const csvContent = templates[dataType]
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${dataType}_template.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors font-inter"
          title={`Export ${dataTypeLabels[dataType]}`}
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors font-inter disabled:opacity-50"
          title={`Import ${dataTypeLabels[dataType]}`}
        >
          <Upload className="h-4 w-4" />
          {importing ? 'Importing...' : 'Import'}
        </button>
        
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
          title="Download CSV Template"
        >
          <FileText className="h-4 w-4" />
          Template
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Import Preview Modal */}
      {showImportModal && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">
                Import Preview - {dataTypeLabels[dataType]}
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 font-inter">Valid Records</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 font-inter">{importResult.valid.length}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900 font-inter">Errors</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 font-inter">{importResult.errors.length}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900 font-inter">Warnings</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 font-inter">{importResult.warnings.length}</p>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2 font-inter">Errors (must be fixed)</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700 font-inter">
                        Row {error.row}: {error.field} - {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2 font-inter">Warnings (can proceed)</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-700 font-inter">
                        Row {warning.row}: {warning.field} - {warning.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Records Preview */}
              {importResult.valid.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2 font-inter">
                    Valid Records Preview ({importResult.valid.length} records)
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(importResult.valid[0] || {}).slice(0, 4).map(key => (
                            <th key={key} className="text-left p-2 font-inter">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.valid.slice(0, 5).map((record, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(record).slice(0, 4).map((value, i) => (
                              <td key={i} className="p-2 font-inter">
                                {String(value).substring(0, 30)}
                                {String(value).length > 30 ? '...' : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importResult.valid.length > 5 && (
                      <p className="text-sm text-gray-600 mt-2 font-inter">
                        ... and {importResult.valid.length - 5} more records
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={importResult.errors.length > 0 || importResult.valid.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {importResult.valid.length} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BulkImportExport
