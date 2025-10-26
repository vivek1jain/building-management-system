import {
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign,
  CheckCircle,
  Edit,
  FileText,
  TrendingUp,
  Star
} from 'lucide-react'
import { useState } from 'react'
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, User as UserType } from '../../types'
import Button from '../UI/Button'
import Modal from '../UI/Modal'

interface WorkOrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder
  currentUser?: UserType
  onEdit?: () => void
  onSchedule?: () => void
  onMarkComplete?: (finalPrice: number) => void
  onStatusChange?: (newStatus: WorkOrderStatus) => void
}

const WorkOrderDetailModal = ({
  isOpen,
  onClose,
  workOrder,
  currentUser,
  onEdit,
  onSchedule,
  onMarkComplete,
  onStatusChange
}: WorkOrderDetailModalProps) => {
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [finalPrice, setFinalPrice] = useState(
    workOrder.finalPrice || workOrder.estimatedPrice || workOrder.quotePrice || 0
  )

  if (!isOpen) return null

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not scheduled'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.TRIAGE: return 'bg-neutral-100 text-gray-800'
      case WorkOrderStatus.QUOTING: return 'bg-blue-100 text-blue-800'
      case WorkOrderStatus.AWAITING_USER_FEEDBACK: return 'bg-yellow-100 text-yellow-800'
      case WorkOrderStatus.SCHEDULED: return 'bg-purple-100 text-purple-800'
      case WorkOrderStatus.IN_PROGRESS: return 'bg-orange-100 text-orange-800'
      case WorkOrderStatus.RESOLVED: return 'bg-green-100 text-green-800'
      case WorkOrderStatus.CLOSED: return 'bg-neutral-100 text-gray-800'
      case WorkOrderStatus.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: WorkOrderPriority) => {
    switch (priority) {
      case WorkOrderPriority.LOW: return 'bg-green-100 text-green-800'
      case WorkOrderPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800'
      case WorkOrderPriority.HIGH: return 'bg-orange-100 text-orange-800'
      case WorkOrderPriority.URGENT: return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriceSource = () => {
    switch (workOrder.priceSource) {
      case 'quote': return 'From accepted quote'
      case 'direct': return 'Direct scheduling estimate'
      case 'manual': return 'Manually entered'
      default: return 'Not specified'
    }
  }

  const canMarkComplete = () => {
    return workOrder.status === WorkOrderStatus.IN_PROGRESS && 
           currentUser?.role === 'manager'
  }

  const canSchedule = () => {
    return (workOrder.status === WorkOrderStatus.TRIAGE || 
            workOrder.status === WorkOrderStatus.QUOTING) && 
           currentUser?.role === 'manager'
  }

  const handleMarkComplete = () => {
    if (onMarkComplete && finalPrice) {
      onMarkComplete(finalPrice)
      setShowCompletionForm(false)
    }
  }

  const getPriceVariance = () => {
    const original = workOrder.quotePrice || workOrder.estimatedPrice
    const final = workOrder.finalPrice
    
    if (!original || !final) return null
    
    const variance = final - original
    const percentageVariance = (variance / original) * 100
    
    return {
      amount: variance,
      percentage: percentageVariance,
      isOver: variance > 0
    }
  }

  const priceVariance = getPriceVariance()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Work Order Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="border-b border-neutral-200 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {workOrder.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-neutral-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {workOrder.flatNumber || workOrder.flatId}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {formatDate(workOrder.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(workOrder.status)}`}>
                {workOrder.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(workOrder.priority)}`}>
                <Star className="h-3 w-3 mr-1" />
                {workOrder.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Description
          </h4>
          <p className="text-neutral-900 bg-neutral-50 p-3 rounded-lg">
            {workOrder.description}
          </p>
        </div>

        {/* Pricing Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Original Estimate/Quote */}
            <div>
              <p className="text-xs text-green-600 mb-1">
                {workOrder.quotePrice ? 'Quote Price' : 'Estimated Price'}
              </p>
              <p className="text-lg font-semibold text-green-900">
                {formatCurrency(workOrder.quotePrice || workOrder.estimatedPrice)}
              </p>
              <p className="text-xs text-green-600">
                {getPriceSource()}
              </p>
            </div>

            {/* Final Price */}
            <div>
              <p className="text-xs text-green-600 mb-1">Final Price</p>
              <p className="text-lg font-semibold text-green-900">
                {workOrder.finalPrice ? formatCurrency(workOrder.finalPrice) : 'Pending'}
              </p>
              {workOrder.completedDate && (
                <p className="text-xs text-green-600">
                  Completed {formatDate(workOrder.completedDate)}
                </p>
              )}
            </div>

            {/* Price Variance */}
            <div>
              <p className="text-xs text-green-600 mb-1">Variance</p>
              {priceVariance ? (
                <>
                  <p className={`text-lg font-semibold ${priceVariance.isOver ? 'text-red-600' : 'text-green-600'}`}>
                    {priceVariance.isOver ? '+' : ''}{formatCurrency(priceVariance.amount)}
                  </p>
                  <p className={`text-xs ${priceVariance.isOver ? 'text-red-600' : 'text-green-600'}`}>
                    {priceVariance.isOver ? '+' : ''}{priceVariance.percentage.toFixed(1)}%
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold text-green-900">-</p>
              )}
            </div>
          </div>
        </div>

        {/* Assignment & Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Assignment
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-neutral-500">Requested by:</span> {workOrder.createdByUserEmail}</p>
              <p><span className="text-neutral-500">Assigned to:</span> {workOrder.assignedToUserEmail || 'Unassigned'}</p>
              {workOrder.supplierName && (
                <p><span className="text-neutral-500">Supplier:</span> {workOrder.supplierName}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Scheduling
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-neutral-500">Scheduled:</span> {formatDate(workOrder.scheduledDate)}</p>
              {workOrder.completedDate && (
                <p><span className="text-neutral-500">Completed:</span> {formatDate(workOrder.completedDate)}</p>
              )}
              {workOrder.resolvedAt && (
                <p><span className="text-neutral-500">Resolved:</span> {formatDate(workOrder.resolvedAt)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Completion Form (when marking as complete) */}
        {showCompletionForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Final Cost
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter final cost"
                  />
                </div>
                {priceVariance && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Original: {formatCurrency(workOrder.quotePrice || workOrder.estimatedPrice)}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCompletionForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkComplete}
                  className="flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-neutral-200 pt-4">
          <div className="flex flex-wrap gap-3">
            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            )}

            {canSchedule() && onSchedule && (
              <Button
                onClick={onSchedule}
                className="flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Work
              </Button>
            )}

            {canMarkComplete() && !showCompletionForm && (
              <Button
                onClick={() => setShowCompletionForm(true)}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}

            {workOrder.status === WorkOrderStatus.TRIAGE && currentUser?.role === 'manager' && (
              <Button
                variant="outline"
                onClick={() => onStatusChange?.(WorkOrderStatus.QUOTING)}
                className="flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Get Quotes
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default WorkOrderDetailModal
