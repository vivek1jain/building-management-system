import React, { useState, useMemo } from 'react'
import { User, DollarSign, Calendar, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react'
import { WorkOrder, TicketStatus, UrgencyLevel } from '../types'

type SortField = 'title' | 'status' | 'priority' | 'assignedTo' | 'cost' | 'scheduledDate'
type SortDirection = 'asc' | 'desc'

interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  className?: string
}

const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  workOrders,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Triage': return 'bg-yellow-100 text-yellow-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: UrgencyLevel) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedWorkOrders = useMemo(() => {
    if (!sortField) return workOrders

    const sorted = [...workOrders].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'priority':
          // Sort priority by urgency: Critical > High > Medium > Low
          const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        case 'assignedTo':
          aValue = (a.assignedToUid || 'Unassigned').toLowerCase()
          bValue = (b.assignedToUid || 'Unassigned').toLowerCase()
          break
        case 'cost':
          aValue = a.cost || 0
          bValue = b.cost || 0
          break
        case 'scheduledDate':
          aValue = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
          bValue = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [workOrders, sortField, sortDirection])

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => {
    const isActive = sortField === field
    const isAsc = isActive && sortDirection === 'asc'
    const isDesc = isActive && sortDirection === 'desc'

    return (
      <th 
        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-200 transition-colors duration-200 select-none"
        scope="col"
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSort(field)
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Sort by ${field} ${isActive ? (isAsc ? 'descending' : 'ascending') : 'ascending'}`}
      >
        <div className="flex items-center justify-between">
          <span>{children}</span>
          <div className="flex flex-col ml-2">
            <ArrowUp 
              className={`h-3 w-3 ${isAsc ? 'text-primary-600' : 'text-neutral-300'}`} 
            />
            <ArrowDown 
              className={`h-3 w-3 -mt-1 ${isDesc ? 'text-primary-600' : 'text-neutral-300'}`} 
            />
          </div>
        </div>
      </th>
    )
  }

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
          <MessageSquare className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2 font-inter">No work orders found</h3>
        <p className="text-gray-600 font-inter">
          No work orders match your current search criteria
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200" role="table" aria-label="Work orders list">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <SortableHeader field="title">
                Title & Description
              </SortableHeader>
              <SortableHeader field="status">
                Status
              </SortableHeader>
              <SortableHeader field="priority">
                Priority
              </SortableHeader>
              <SortableHeader field="assignedTo">
                Assigned To
              </SortableHeader>
              <SortableHeader field="cost">
                Cost
              </SortableHeader>
              <SortableHeader field="scheduledDate">
                Scheduled
              </SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedWorkOrders.map((workOrder) => (
              <tr
                key={workOrder.id}
                className="hover:bg-neutral-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 font-inter mb-1 line-clamp-1">
                        {workOrder.title}
                      </p>
                      <p className="text-xs text-gray-600 font-inter line-clamp-1">
                        {truncateText(workOrder.description, 80)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(workOrder.status)}`}>
                    {workOrder.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(workOrder.priority)}`}>
                    {workOrder.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <User className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[120px]" title={workOrder.assignedToUid || 'Unassigned'}>
                      {workOrder.assignedToUid || 'Unassigned'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <DollarSign className="h-4 w-4 mr-1" />
                    £{workOrder.cost || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-neutral-500 font-inter">
                    <Calendar className="h-4 w-4 mr-1" />
                    {workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorkOrderTable
