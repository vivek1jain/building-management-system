import { ChevronDown, ChevronUp } from 'lucide-react'
import React, { useState } from 'react'
import { Badge } from './Badge'
import Button from './Button'

export interface MobileCardField {
  key: string
  label: string
  value: React.ReactNode
  type?: 'text' | 'badge' | 'currency' | 'date'
  variant?: string
  className?: string
}

export interface MobileCardAction {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  className?: string
}

export interface MobileCardProps {
  /** Primary title displayed prominently */
  title: string
  /** Optional subtitle below title */
  subtitle?: string
  /** Essential fields always visible */
  primaryFields: MobileCardField[]
  /** Secondary fields shown when expanded */
  secondaryFields?: MobileCardField[]
  /** Action buttons */
  actions?: MobileCardAction[]
  /** Status badge/indicator */
  statusBadge?: React.ReactNode
  /** Whether card is expandable */
  expandable?: boolean
  /** Initially expanded state */
  defaultExpanded?: boolean
  /** Custom CSS classes */
  className?: string
  /** Data test ID */
  testId?: string
}

const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  primaryFields,
  secondaryFields = [],
  actions = [],
  statusBadge,
  expandable = true,
  defaultExpanded = false,
  className = '',
  testId
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const hasSecondaryFields = secondaryFields.length > 0
  const canExpand = expandable && hasSecondaryFields

  const toggleExpanded = () => {
    if (canExpand) {
      setIsExpanded(!isExpanded)
    }
  }

  const renderField = (field: MobileCardField) => {
    const { key, label, value, type = 'text', variant = '', className: fieldClassName = '' } = field

    let renderedValue = value
    
    if (type === 'badge' && typeof value === 'string') {
      renderedValue = (
        <Badge variant={variant as any}>
          {value}
        </Badge>
      )
    } else if (type === 'currency' && typeof value === 'number') {
      renderedValue = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(value)
    } else if (type === 'date' && value instanceof Date) {
      renderedValue = value.toLocaleDateString()
    }

    return (
      <div key={key} className={`${fieldClassName}`}>
        <div className="text-xs font-medium text-neutral-500 mb-0.5">{label}</div>
        <div className="text-sm text-neutral-900">{renderedValue}</div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-4 ${className}`}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-neutral-900 truncate">
              {title}
            </h3>
            {statusBadge}
          </div>
          {subtitle && (
            <p className="text-sm text-neutral-600 truncate">{subtitle}</p>
          )}
        </div>
        
        {canExpand && (
          <button
            onClick={toggleExpanded}
            className="ml-2 p-1 rounded-md hover:bg-neutral-100 transition-colors flex-shrink-0"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            )}
          </button>
        )}
      </div>

      {/* Primary Fields */}
      {primaryFields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {primaryFields.map(renderField)}
        </div>
      )}

      {/* Secondary Fields (expandable) */}
      {hasSecondaryFields && isExpanded && (
        <div className="border-t border-neutral-100 pt-3 mb-3">
          <div className="grid grid-cols-1 gap-2">
            {secondaryFields.map(renderField)}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              className={`flex items-center gap-1 ${action.className || ''}`}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MobileCard