import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getInvoicesByBuilding, createInvoice, approveInvoice, markInvoiceAsPaid } from '../services/invoiceService'
import { getAllBuildings } from '../services/buildingService'
import { supplierService } from '../services/supplierService'
import { Invoice, Building, Supplier, InvoiceStatus, PaymentStatus } from '../types'

const Invoices: React.FC = () => {
  const { currentUser } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all')

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    ticketId: '',
    vendorId: '',
    invoiceNumber: '',
    amount: 0,
    currency: 'GBP',
    category: 'repairs',
    dueDate: '',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadInvoices()
    }
  }, [selectedBuilding, filterStatus, filterPaymentStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      const [buildingsData, suppliersData] = await Promise.all([
        getAllBuildings(),
        supplierService.getSuppliers()
      ])
      
      setBuildings(buildingsData)
      setSuppliers(suppliersData)
      
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      let invoicesData = await getInvoicesByBuilding(selectedBuilding)
      
      // Apply filters
      if (filterStatus !== 'all') {
        invoicesData = invoicesData.filter(invoice => invoice.status === filterStatus)
      }
      
      if (filterPaymentStatus !== 'all') {
        invoicesData = invoicesData.filter(invoice => invoice.paymentStatus === filterPaymentStatus)
      }
      
      setInvoices(invoicesData)
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedBuilding || !currentUser) return
    
    try {
      setLoading(true)
      const newInvoice = await createInvoice({
        ticketId: invoiceForm.ticketId,
        vendorId: invoiceForm.vendorId,
        buildingId: selectedBuilding,
        invoiceNumber: invoiceForm.invoiceNumber,
        amount: invoiceForm.amount,
        currency: invoiceForm.currency,
        category: invoiceForm.category,
        status: 'pending',
        paymentStatus: 'pending',
        dueDate: new Date(invoiceForm.dueDate),
        description: invoiceForm.description,
        attachments: [],
        createdBy: currentUser.id
      })
      
      setInvoices([newInvoice, ...invoices])
      setShowCreateInvoice(false)
      setInvoiceForm({
        ticketId: '',
        vendorId: '',
        invoiceNumber: '',
        amount: 0,
        currency: 'GBP',
        category: 'repairs',
        dueDate: '',
        description: ''
      })
    } catch (error) {
      console.error('Error creating invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveInvoice = async (invoiceId: string) => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      await approveInvoice(invoiceId, currentUser.id)
      await loadInvoices() // Reload to get updated data
    } catch (error) {
      console.error('Error approving invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectInvoice = async (invoiceId: string) => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      // Since rejectInvoice doesn't exist, we'll update the invoice status to 'rejected'
      // This would typically be handled by updating the invoice status
      console.log('Invoice rejection not implemented yet')
      await loadInvoices() // Reload to get updated data
    } catch (error) {
      console.error('Error rejecting invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      setLoading(true)
      await markInvoiceAsPaid(invoiceId)
      await loadInvoices() // Reload to get updated data
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'queried': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSupplierName = (vendorId: string) => {
    const supplier = suppliers.find(s => s.id === vendorId)
    return supplier ? supplier.name : 'Unknown'
  }

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId)
    return building ? building.name : 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
        <p className="text-gray-600">Manage invoices, payments, and approvals</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Building</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="queried">Queried</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowCreateInvoice(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Invoices</h3>
          <p className="text-3xl font-bold text-blue-600">{invoices.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Amount</h3>
          <p className="text-3xl font-bold text-green-600">
            £{invoices.reduce((sum, invoice) => sum + invoice.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {invoices.filter(invoice => invoice.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Overdue</h3>
          <p className="text-3xl font-bold text-red-600">
            {invoices.filter(invoice => invoice.paymentStatus === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getSupplierName(invoice.vendorId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      {invoice.status === 'pending' && currentUser?.role === 'finance' && (
                        <>
                          <button
                            onClick={() => handleApproveInvoice(invoice.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {invoice.status === 'approved' && invoice.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select
                  value={invoiceForm.vendorId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={invoiceForm.category}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="repairs">Repairs</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="sinking">Sinking Fund</option>
                  <option value="capital">Capital</option>
                  <option value="insurance">Insurance</option>
                  <option value="energy">Energy</option>
                  <option value="external">External</option>
                  <option value="utilities">Utilities</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="security">Security</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateInvoice}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Invoice
              </button>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoices 