import { useState, useEffect, useMemo } from 'react'
import { 
  User, 
  Star, 
  Search,
  ChevronDown
} from 'lucide-react'
import { Supplier } from '../../types'
import { supplierService } from '../../services/supplierService'
import { ticketService } from '../../services/ticketService'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'
import DataTable, { Column } from '../UI/DataTable'
import { Dropdown, DropdownOption } from '../UI'

interface SupplierSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  onQuotesRequested: () => void
  excludeSupplierIds?: string[] // IDs of suppliers already contacted
}

const SupplierSelectionModal = ({ 
  isOpen, 
  onClose, 
  ticketId, 
  onQuotesRequested,
  excludeSupplierIds = []
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

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesSpecialty = filterSpecialty === 'All' || supplier.specialties.includes(filterSpecialty)
      
      return matchesSearch && matchesSpecialty && supplier.isActive
    })
  }, [suppliers, searchTerm, filterSpecialty])

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
      await ticketService.requestQuotesFromSuppliers(ticketId, selectedSuppliers, currentUser?.id || '')
      
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

  const getSpecialtyColor = (specialty: string | undefined) => {
    if (!specialty) return 'text-gray-600 bg-neutral-100'
    switch (specialty.toLowerCase()) {
      case 'plumbing': return 'text-primary-600 bg-blue-100'
      case 'electrical': return 'text-yellow-600 bg-yellow-100'
      case 'hvac': return 'text-success-600 bg-success-100'
      case 'cleaning': return 'text-purple-600 bg-purple-100'
      case 'security': return 'text-red-600 bg-red-100'
      case 'landscaping': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-sm"
          />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <Star className="h-4 w-4 text-gray-300 fill-gray-200 absolute" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-gray-300 fill-gray-200"
          />
        )
      }
    }
    
    return (
      <div className="flex items-center gap-0.5">
        <div className="flex items-center">
          {stars}
        </div>
        <span className="ml-1.5 text-xs text-gray-600 font-medium font-inter">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  // Define table columns
  const columns: Column<Supplier>[] = useMemo(() => [
    {
      key: 'select',
      title: '',
      dataIndex: 'id',
      width: '50px',
      render: (value, supplier) => (
        <input
          type="checkbox"
          checked={selectedSuppliers.includes(supplier.id)}
          onChange={() => handleSupplierSelection(supplier.id)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
        />
      )
    },
    {
      key: 'supplierInfo',
      title: 'Supplier',
      dataIndex: 'name',
      sortable: true,
      render: (value, supplier) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-neutral-900 font-inter">{supplier.companyName || 'Unknown Supplier'}</div>
            {excludeSupplierIds.includes(supplier.id) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Already contacted
              </span>
            )}
          </div>
          {supplier.companyName && (
            <div className="text-xs text-neutral-500 font-inter mt-1">{supplier.companyName}</div>
          )}
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Phone',
      dataIndex: 'phone',
      sortable: true,
      render: (value, supplier) => (
        <div className="text-sm text-neutral-900 font-inter">{supplier.phone || 'N/A'}</div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      sortable: true,
      render: (value, supplier) => (
        <div className="text-sm text-neutral-900 font-inter">{supplier.email}</div>
      )
    },
    {
      key: 'specialty',
      title: 'Specialty',
      dataIndex: 'specialties',
      sortable: false,
      render: (value, supplier) => (
        <div className="flex flex-wrap gap-1">
          {supplier.specialties.map((specialty, index) => (
            <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSpecialtyColor(specialty)}`}>
              {specialty}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'rating',
      title: 'Rating',
      dataIndex: 'rating',
      sortable: true,
      render: (value, supplier) => (
        <div className="text-sm text-neutral-900">
          {supplier.rating ? renderStars(supplier.rating) : 'No rating'}
        </div>
      )
    }
  ], [selectedSuppliers, excludeSupplierIds])

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Quotes from Suppliers"
      description="Select suppliers to request quotes for this ticket"
      size="xl"
    >
      <div className="flex flex-col h-full">
        {/* Filters */}
        <div className="mb-6 space-y-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>
            <Dropdown
              value={filterSpecialty}
              onChange={setFilterSpecialty}
              options={specialties.map(specialty => ({
                value: specialty,
                label: specialty === 'All' ? 'All Specialties' : specialty
              }))}
              placeholder="Filter by specialty"
              className="min-w-[200px]"
              size="md"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="mb-6 min-h-0 flex-1">
          <div className="h-full overflow-auto">
            <DataTable
              data={filteredSuppliers}
              columns={columns}
              loading={loading}
              searchable={false}
              paginated={true}
              pageSize={8}
              emptyMessage="No suppliers found. Try adjusting your search or filter criteria."
            />
          </div>
        </div>

        {/* Footer */}
        <ModalFooter className="flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestQuotes}
              disabled={selectedSuppliers.length === 0 || requesting}
            >
              {requesting ? 'Sending...' : 'Request Quote'}
            </Button>
          </div>
        </ModalFooter>
      </div>
    </Modal>
  )
}

export default SupplierSelectionModal 