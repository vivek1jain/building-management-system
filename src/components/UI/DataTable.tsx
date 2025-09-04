import React, { useState, useMemo, ReactNode } from 'react'
import { ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import Button from './Button'
import Input from './Input'

export interface Column<TData> {
  key: string
  title: string
  dataIndex: keyof TData
  width?: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: TData, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface TableAction<TData> {
  key: string
  label: string
  icon?: ReactNode
  onClick: (record: TData) => void
  disabled?: (record: TData) => boolean
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost' | 'outline'
}

export interface DataTableProps<TData> {
  data: TData[]
  columns: Column<TData>[]
  loading?: boolean
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: (keyof TData)[]
  filterable?: boolean
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  actions?: TableAction<TData>[]
  actionTitle?: string
  showRowIndex?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (record: TData) => void
  headerActions?: ReactNode
}

type SortOrder = 'asc' | 'desc' | null

export function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  loading = false,
  title,
  description,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys,
  filterable = false,
  sortable = true,
  paginated = true,
  pageSize = 10,
  actions = [],
  actionTitle = 'Actions',
  showRowIndex = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  headerActions,
}: DataTableProps<TData>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<keyof TData | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search filter
    if (searchable && searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter((item) => {
        if (searchKeys?.length) {
          return searchKeys.some(key => 
            String(item[key]).toLowerCase().includes(searchLower)
          )
        } else {
          return Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchLower)
          )
        }
      })
    }

    // Apply sorting
    if (sortable && sortKey && sortOrder) {
      result.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, searchKeys, searchable, sortKey, sortOrder, sortable])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData
    
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, paginated, currentPage, pageSize])

  // Calculate pagination info
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const showingStart = (currentPage - 1) * pageSize + 1
  const showingEnd = Math.min(currentPage * pageSize, filteredData.length)

  const handleSort = (column: Column<TData>) => {
    if (!column.sortable || !sortable) return
    
    const key = column.dataIndex
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder(null)
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const getSortIcon = (column: Column<TData>) => {
    if (!column.sortable || !sortable || sortKey !== column.dataIndex) {
      return <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
    }
    
    if (sortOrder === 'asc') {
      return <ChevronUp className="h-4 w-4 text-primary-600" />
    } else if (sortOrder === 'desc') {
      return <ChevronDown className="h-4 w-4 text-primary-600" />
    }
    
    return <ChevronDown className="h-4 w-4 opacity-50" />
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className={cn('section-spacing flex flex-col', className)}>
      {/* Header */}
      {(title || description || headerActions) && (
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-neutral-600">{description}</p>
            )}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between space-density-xl">
        {searchable && (
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        )}
        
        {filterable && (
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-neutral-200">
            {/* Header */}
            <thead className="bg-neutral-50">
              <tr>
                {showRowIndex && (
                  <th className="table-cell-padding text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    #
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'table-cell-padding text-left text-xs font-medium text-neutral-500 uppercase tracking-wider',
                      column.sortable && sortable && 'cursor-pointer select-none group hover:bg-neutral-100',
                      column.width && `w-[${column.width}]`,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.title}</span>
                      {(column.sortable && sortable) && getSortIcon(column)}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="table-cell-padding text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-32">
                    {actionTitle}
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (showRowIndex ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                    className="table-cell-padding py-density-4xl text-center text-sm text-neutral-500"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showRowIndex ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                    className="table-cell-padding py-density-4xl text-center text-sm text-neutral-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((record, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'hover:bg-neutral-50 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(record)}
                  >
                    {showRowIndex && (
                      <td className="table-cell-padding text-sm text-neutral-500">
                        {showingStart + index}
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'table-cell-padding text-sm text-neutral-900',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(record[column.dataIndex], record, index)
                          : String(record[column.dataIndex] ?? '')
                        }
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="table-cell-padding text-sm">
                        <div className="flex items-center space-density-sm">
                          {actions.map((action) => (
                            <Button
                              key={action.key}
                              size="sm"
                              variant={action.variant || 'outline'}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick(record)
                              }}
                              disabled={action.disabled?.(record)}
                              title={action.label}
                            >
                              {action.icon && <span className="sr-only">{action.label}</span>}
                              {action.icon || action.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginated && filteredData.length > 0 && (
          <div className="bg-white px-density-xl py-density-lg border-t border-neutral-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-neutral-700">
              <span>
                Showing {showingStart} to {showingEnd} of {filteredData.length} results
              </span>
            </div>
            
            <div className="flex items-center space-density-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center space-density-xs">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataTable
