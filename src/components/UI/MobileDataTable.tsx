import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import DataTable, { Column, TableAction } from './DataTable'
import MobileCard, { MobileCardField, MobileCardAction } from './MobileCard'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { Dropdown, DropdownOption } from './Dropdown'
import Button from './Button'

export interface MobileCardConfig<T> {
  /** Function to generate card title from data row */
  getTitle: (item: T) => string
  /** Function to generate card subtitle from data row */
  getSubtitle?: (item: T) => string
  /** Function to generate primary fields from data row */
  getPrimaryFields: (item: T) => MobileCardField[]
  /** Function to generate secondary fields from data row */
  getSecondaryFields?: (item: T) => MobileCardField[]
  /** Function to generate status badge from data row */
  getStatusBadge?: (item: T) => React.ReactNode
  /** Function to generate actions from data row */
  getActions?: (item: T) => MobileCardAction[]
}

export interface FilterConfig {
  /** Filter dropdown options */
  options: DropdownOption[]
  /** Current filter value */
  value: string
  /** Filter change handler */
  onChange: (value: string) => void
  /** Filter placeholder text */
  placeholder?: string
  /** Filter label */
  label?: string
}

export interface MobileDataTableProps<T> {
  /** Data array */
  data: T[]
  /** Table columns for desktop view */
  columns: Column<T>[]
  /** Table actions for desktop view */
  actions?: TableAction<T>[]
  /** Mobile card configuration */
  mobileConfig: MobileCardConfig<T>
  /** Search configuration */
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  /** Filter configurations */
  filters?: FilterConfig[]
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Additional CSS classes */
  className?: string
  /** Test ID */
  testId?: string
}

const MobileDataTable = <T extends { id: string }>({
  data,
  columns,
  actions,
  mobileConfig,
  search,
  filters = [],
  loading = false,
  emptyMessage = "No data found",
  className = '',
  testId
}: MobileDataTableProps<T>) => {
  const isMobile = useIsMobile()
  const [showFilters, setShowFilters] = useState(false)

  const {
    getTitle,
    getSubtitle,
    getPrimaryFields,
    getSecondaryFields,
    getStatusBadge,
    getActions
  } = mobileConfig

  // Get active filters count for badge
  const activeFiltersCount = filters.filter(filter => 
    filter.value !== 'all' && filter.value !== ''
  ).length

  if (loading) {
    return (
      <div className={`${className}`} data-testid={testId}>
        {/* Search bar skeleton */}
        {search && (
          <div className="mb-4">
            <div className="h-10 bg-neutral-200 rounded-lg animate-pulse" />
          </div>
        )}
        
        {/* Content skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={isMobile ? "h-32" : "h-16"}>
              <div className="h-full bg-neutral-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMobileView = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <MobileCard
          key={item.id}
          title={getTitle(item)}
          subtitle={getSubtitle?.(item)}
          primaryFields={getPrimaryFields(item)}
          secondaryFields={getSecondaryFields?.(item)}
          statusBadge={getStatusBadge?.(item)}
          actions={getActions?.(item)}
          testId={`mobile-card-${index}`}
        />
      ))}
    </div>
  )

  const renderDesktopView = () => (
    <DataTable
      data={data}
      columns={columns}
      actions={actions}
      searchable={false} // We handle search externally
      emptyMessage={emptyMessage}
    />
  )

  const renderFilterPanel = () => (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-neutral-900">Filters</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="p-1 hover:bg-neutral-100 rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {filters.map((filter, index) => (
          <div key={index}>
            {filter.label && (
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {filter.label}
              </label>
            )}
            <Dropdown
              options={filter.options}
              value={filter.value}
              onChange={filter.onChange}
              placeholder={filter.placeholder || "Select..."}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`${className}`} data-testid={testId}>
      {/* Search and Filter Bar - Only show on mobile */}
      {isMobile && (search || filters.length > 0) && (
        <div className="mb-4">
          <div className="flex gap-2">
            {/* Search Input */}
            {search && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={search.placeholder || "Search..."}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            )}
            
            {/* Filter Button */}
            {filters.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {isMobile ? "Filter" : "Filters"}
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            )}
          </div>
          
          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.map((filter, index) => {
                const activeOption = filter.options.find(option => option.value === filter.value)
                if (!activeOption || filter.value === 'all' || filter.value === '') return null
                
                return (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                  >
                    <span>{filter.label}: {activeOption.label}</span>
                    <button
                      onClick={() => filter.onChange('all')}
                      className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter Panel (Mobile) */}
      {showFilters && isMobile && renderFilterPanel()}

      {/* Filter Dropdowns (Desktop) */}
      {showFilters && !isMobile && filters.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          {filters.map((filter, index) => (
            <div key={index} className="min-w-48">
              {filter.label && (
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {filter.label}
                </label>
              )}
              <Dropdown
                options={filter.options}
                value={filter.value}
                onChange={filter.onChange}
                placeholder={filter.placeholder || "Select..."}
              />
            </div>
          ))}
        </div>
      )}

      {/* Data Display */}
      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-500 mb-2">
            <Search className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No results found</h3>
          <p className="text-neutral-600">{emptyMessage}</p>
        </div>
      ) : isMobile ? (
        renderMobileView()
      ) : (
        renderDesktopView()
      )}
    </div>
  )
}

export default MobileDataTable