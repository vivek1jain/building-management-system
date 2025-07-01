import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Building, 
  Star, 
  Mail, 
  Clock, 
  CheckCircle,
  Search,
  Filter,
  Send
} from 'lucide-react'
import { Supplier } from '../../types'
import { supplierService } from '../../services/supplierService'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'

interface SupplierSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  onQuotesRequested: () => void
}

const SupplierSelectionModal = ({ 
  isOpen, 
  onClose, 
  ticketId, 
  onQuotesRequested 
}: SupplierSelectionModalProps) => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('All')
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
    }
  }, [isOpen])

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const suppliersData = await supplierService.getSuppliers()
      setSuppliers(suppliersData)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load suppliers',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const specialties = ['All', 'Plumbing', 'HVAC', 'Electrical', 'General Maintenance', 'Cleaning', 'Landscaping', 'Emergency Repairs', 'Lighting', 'Security Systems']

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSpecialty = filterSpecialty === 'All' || supplier.specialties.includes(filterSpecialty)
    
    return matchesSearch && matchesSpecialty && supplier.isActive
  })

  const handleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleRequestQuotes = async () => {
    if (selectedSuppliers.length === 0) {
      addNotification({
        title: 'No Suppliers Selected',
        message: 'Please select at least one supplier to request quotes from.',
        type: 'warning',
        userId: currentUser?.id || ''
      })
      return
    }

    setRequesting(true)
    try {
      await supplierService.requestQuotes(ticketId, selectedSuppliers, currentUser?.id || '')
      
      addNotification({
        title: 'Quote Requests Sent',
        message: `Quote requests sent to ${selectedSuppliers.length} supplier(s).`,
        type: 'success',
        userId: currentUser?.id || ''
      })

      onQuotesRequested()
      onClose()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to send quote requests. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setRequesting(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Quotes from Suppliers</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select suppliers to request quotes for this ticket
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="select"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterSpecialty('All')
              }}
              className="btn-secondary flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`card cursor-pointer transition-all duration-200 ${
                    selectedSuppliers.includes(supplier.id)
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : 'hover:shadow-apple-lg'
                  }`}
                  onClick={() => handleSupplierSelection(supplier.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-600">{supplier.companyName}</p>
                      </div>
                    </div>
                    {selectedSuppliers.includes(supplier.id) && (
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{supplier.companyName}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {renderStars(supplier.rating ?? 0)}
                      <span className="text-sm text-gray-600 ml-1">
                        {supplier.rating ? `(${supplier.rating}) • ${supplier.totalJobs} jobs` : `${supplier.totalJobs} jobs`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {supplier.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{supplier.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestQuotes}
              disabled={selectedSuppliers.length === 0 || requesting}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {requesting ? 'Sending...' : `Request Quotes (${selectedSuppliers.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierSelectionModal 