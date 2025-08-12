import React, { useState, useEffect, useRef } from 'react'
import { 
  Upload, Download, FileText, Image, Video, Music, Archive,
  Search, Filter, Grid, List, Eye, Trash2, Share2, 
  Calendar, User, Building, Folder, Plus, X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getAllBuildings } from '../../services/buildingService'
import { Building as BuildingType } from '../../types'

interface Document {
  id: string
  name: string
  type: 'pdf' | 'image' | 'video' | 'audio' | 'other'
  size: number
  uploadedBy: string
  uploadedAt: Date
  buildingId: string
  category: 'maintenance' | 'legal' | 'financial' | 'resident' | 'supplier' | 'other'
  tags: string[]
  url: string
  description?: string
  isPublic: boolean
}

interface DocumentCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  count: number
}

const DocumentManager: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [buildings, setBuildings] = useState<BuildingType[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    category: 'other' as Document['category'],
    description: '',
    tags: '',
    isPublic: false
  })

  const categories: DocumentCategory[] = [
    { id: 'all', name: 'All Documents', icon: FileText, color: 'text-gray-600', count: 0 },
    { id: 'maintenance', name: 'Maintenance', icon: FileText, color: 'text-blue-600', count: 0 },
    { id: 'legal', name: 'Legal', icon: FileText, color: 'text-red-600', count: 0 },
    { id: 'financial', name: 'Financial', icon: FileText, color: 'text-green-600', count: 0 },
    { id: 'resident', name: 'Resident', icon: User, color: 'text-purple-600', count: 0 },
    { id: 'supplier', name: 'Supplier', icon: Building, color: 'text-orange-600', count: 0 },
    { id: 'other', name: 'Other', icon: Folder, color: 'text-gray-600', count: 0 }
  ]

  // Mock documents data
  const mockDocuments: Document[] = [
    {
      id: '1',
      name: 'Building Safety Certificate.pdf',
      type: 'pdf',
      size: 2048000,
      uploadedBy: 'John Manager',
      uploadedAt: new Date('2024-01-15'),
      buildingId: 'building-1',
      category: 'legal',
      tags: ['safety', 'certificate', 'compliance'],
      url: '/documents/safety-cert.pdf',
      description: 'Annual building safety certificate from fire department',
      isPublic: false
    },
    {
      id: '2',
      name: 'Elevator Maintenance Report.pdf',
      type: 'pdf',
      size: 1536000,
      uploadedBy: 'Tech Support',
      uploadedAt: new Date('2024-01-10'),
      buildingId: 'building-1',
      category: 'maintenance',
      tags: ['elevator', 'maintenance', 'report'],
      url: '/documents/elevator-report.pdf',
      description: 'Monthly elevator maintenance and inspection report',
      isPublic: true
    },
    {
      id: '3',
      name: 'Budget 2024.xlsx',
      type: 'other',
      size: 512000,
      uploadedBy: 'Finance Team',
      uploadedAt: new Date('2024-01-05'),
      buildingId: 'building-1',
      category: 'financial',
      tags: ['budget', '2024', 'planning'],
      url: '/documents/budget-2024.xlsx',
      description: 'Annual budget planning for 2024',
      isPublic: false
    }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const buildingsData = await getAllBuildings()
        setBuildings(buildingsData)
        if (buildingsData.length > 0) {
          setSelectedBuilding(buildingsData[0].id)
        }
        
        // Filter documents for selected building
        const buildingDocuments = mockDocuments.filter(doc => 
          doc.buildingId === (buildingsData[0]?.id || '')
        )
        setDocuments(buildingDocuments)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Filter documents when building changes
    const buildingDocuments = mockDocuments.filter(doc => 
      doc.buildingId === selectedBuilding
    )
    setDocuments(buildingDocuments)
  }, [selectedBuilding])

  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />
      case 'image': return <Image className="h-8 w-8 text-green-500" />
      case 'video': return <Video className="h-8 w-8 text-blue-500" />
      case 'audio': return <Music className="h-8 w-8 text-purple-500" />
      default: return <Archive className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        // Simulate upload process
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newDocument: Document = {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type === 'application/pdf' ? 'pdf' :
                file.type.startsWith('video/') ? 'video' :
                file.type.startsWith('audio/') ? 'audio' : 'other',
          size: file.size,
          uploadedBy: currentUser?.name || 'Unknown',
          uploadedAt: new Date(),
          buildingId: selectedBuilding,
          category: uploadForm.category,
          tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          url: URL.createObjectURL(file),
          description: uploadForm.description,
          isPublic: uploadForm.isPublic
        }
        
        setDocuments(prev => [newDocument, ...prev])
      }
      
      addNotification({
        title: 'Success',
        message: `${files.length} document(s) uploaded successfully`,
        type: 'success',
        userId: currentUser?.id || ''
      })
      
      setShowUploadModal(false)
      setUploadForm({
        category: 'other',
        description: '',
        tags: '',
        isPublic: false
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to upload documents',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    addNotification({
      title: 'Success',
      message: 'Document deleted successfully',
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  const handleDownload = (document: Document) => {
    // Simulate download
    const link = document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.click()
    
    addNotification({
      title: 'Success',
      message: `${document.name} downloaded`,
      type: 'success',
      userId: currentUser?.id || ''
    })
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-inter">Document Manager</h1>
            <p className="text-sm text-gray-600 font-inter">Organize and manage building documents</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Building Selector */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter text-sm"
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-inter text-sm"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-green-600' : category.color}`} />
              {category.name}
            </button>
          )
        })}
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Documents Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                {getFileIcon(document.type)}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedDocument(document)
                      setShowPreview(true)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(document)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(document.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-900 text-sm mb-2 font-inter line-clamp-2">
                {document.name}
              </h3>
              
              <div className="space-y-1 text-xs text-gray-500 font-inter">
                <p>{formatFileSize(document.size)}</p>
                <p>By {document.uploadedBy}</p>
                <p>{formatDate(document.uploadedAt)}</p>
              </div>
              
              {document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-inter">
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-inter">
                      +{document.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getFileIcon(document.type)}
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-inter">{document.name}</div>
                        {document.description && (
                          <div className="text-sm text-gray-500 font-inter">{document.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 font-inter">
                      {document.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-inter">
                    {formatFileSize(document.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-inter">
                    <div>{formatDate(document.uploadedAt)}</div>
                    <div>by {document.uploadedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocument(document)
                          setShowPreview(true)
                        }}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(document)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-inter">No documents found</h3>
          <p className="text-gray-600 font-inter">Upload your first document to get started</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-inter">Upload Documents</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value as Document['category']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="legal">Legal</option>
                  <option value="financial">Financial</option>
                  <option value="resident">Resident</option>
                  <option value="supplier">Supplier</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  placeholder="Brief description of the document..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">Tags</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                  placeholder="comma, separated, tags"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm({...uploadForm, isPublic: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900 font-inter">
                  Make public (visible to residents)
                </label>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors font-inter disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentManager
