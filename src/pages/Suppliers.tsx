import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { supplierService } from '../services/supplierService'
import { 
  User, 
  Building, 
  Star, 
  Mail, 
  Plus,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Send,
  Filter,
  Search
} from 'lucide-react'
import { Supplier, QuoteForm } from '../types'
import { addSampleSuppliers } from '../utils/sampleData'

const Suppliers = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('All')
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteForm, setQuoteForm] = useState<QuoteForm>({
    amount: 0,
    currency: 'USD',
    description: '',
    terms: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    attachments: []
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
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
    }
  }

  const specialties = ['All', 'Plumbing', 'HVAC', 'Electrical', 'General Maintenance', 'Cleaning', 'Landscaping', 'Emergency Repairs', 'Lighting', 'Security Systems']

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSpecialty = filterSpecialty === 'All' || supplier.specialties.includes(filterSpecialty)
    
    return matchesSearch && matchesSpecialty
  })

  const handleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleRequestQuotes = () => {
    if (selectedSuppliers.length === 0) {
      addNotification({
        title: 'No Suppliers Selected',
        message: 'Please select at least one supplier to request quotes from.',
        type: 'warning',
        userId: currentUser?.id || ''
      })
      return
    }

    // In a real app, this would send email notifications to suppliers
    addNotification({
      title: 'Quote Requests Sent',
      message: `Quote requests sent to ${selectedSuppliers.length} supplier(s).`,
      type: 'success',
      userId: currentUser?.id || ''
    })

    setSelectedSuppliers([])
  }

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Submit quote to Firebase
      await supplierService.submitQuote(
        '',
        currentUser?.id || '',
        quoteForm,
        quoteForm.attachments || []
      )

      addNotification({
        title: 'Quote Submitted',
        message: 'Your quote has been submitted successfully.',
        type: 'success',
        userId: currentUser?.id || ''
      })

      setShowQuoteForm(false)
      setQuoteForm({
        amount: 0,
        currency: 'USD',
        description: '',
        terms: '',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        attachments: []
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to submit quote. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    }
  }

  const handleAddSampleData = async () => {
    console.log('Add Sample Data button clicked')
    try {
      console.log('Adding sample suppliers...')
      await addSampleSuppliers()
      console.log('Sample suppliers added, now loading suppliers...')
      await loadSuppliers()
      console.log('Suppliers loaded successfully')
      addNotification({
        title: 'Sample Data Added',
        message: 'Sample suppliers have been added successfully.',
        type: 'success',
        userId: currentUser?.id || ''
      })
    } catch (error) {
      console.error('Error in handleAddSampleData:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to add sample data.',
        type: 'error',
        userId: currentUser?.id || ''
      })
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

  if (currentUser?.role === 'supplier') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Management</h1>
            <p className="text-gray-600 mt-1">
              Submit quotes for tickets and manage your responses
            </p>
          </div>
          <button
            onClick={() => setShowQuoteForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Quote</span>
          </button>
        </div>

        {/* Quote Submission Form */}
        {showQuoteForm && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Quote</h3>
            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={quoteForm.amount}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="input pl-10"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={quoteForm.currency}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="select"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={quoteForm.description}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, description: e.target.value }))}
                  className="textarea"
                  rows={3}
                  placeholder="Describe the work to be performed..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={quoteForm.terms}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, terms: e.target.value }))}
                  className="textarea"
                  rows={3}
                  placeholder="Payment terms, warranty, etc..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={quoteForm.validUntil.toISOString().split('T')[0]}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
                  className="input"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Quote
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Quotes */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Quotes</h3>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No quotes submitted yet</p>
            <p className="text-sm">Submit your first quote to get started</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">
            Manage suppliers and request quotes for tickets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddSampleData}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sample Data</span>
          </button>
          <button
            onClick={handleRequestQuotes}
            disabled={selectedSuppliers.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>Request Quotes ({selectedSuppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
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

      {/* Suppliers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}

export default Suppliers 