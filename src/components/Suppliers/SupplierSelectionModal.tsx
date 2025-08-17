import { useState, useEffect } from 'react'
import { 
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
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Quotes from Suppliers"
      description="Select suppliers to request quotes for this ticket"
      size="xl"
    >
      {/* Filters */}
      <div className="mb-6 pb-6 border-b border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setFilterSpecialty('All')
            }}
            className="flex items-center justify-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSuppliers.includes(supplier.id)
                    ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                    : 'hover:shadow-md border-neutral-200'
                }`}
                onClick={() => handleSupplierSelection(supplier.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-success-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-600">{supplier.companyName}</p>
                    </div>
                  </div>
                  {selectedSuppliers.includes(supplier.id) && (
                    <CheckCircle className="h-5 w-5 text-success-600" />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-neutral-400" />
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
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-gray-800"
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
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Footer with selection count and actions */}
      <div className="pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestQuotes}
            disabled={selectedSuppliers.length === 0 || requesting}
            className="flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            {requesting ? 'Sending...' : `Request Quotes (${selectedSuppliers.length})`}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

export default SupplierSelectionModal 