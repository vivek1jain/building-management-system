import React from 'react'
import { getBadgeColors, SemanticColorVariant } from '../../utils/colors'

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode
  /** Color variant */
  variant?: SemanticColorVariant
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Data test ID */
  testId?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  testId
}) => {
  const colors = getBadgeColors(variant)
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}
      data-testid={testId}
    >
      {children}
    </span>
  )
}

export default Badge