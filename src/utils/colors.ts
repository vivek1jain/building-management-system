/**
 * Semantic Color Utility Functions
 * 
 * Maps semantic meanings to design system colors
 * All colors reference CSS custom properties from the theme system
 */

export type SemanticColorVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

/**
 * Get Tailwind classes for semantic colors
 */
export const getSemanticColors = (variant: SemanticColorVariant, shade: ColorShade = 600) => {
  return {
    bg: `bg-${variant}-${shade}`,
    text: `text-${variant}-${shade}`,
    border: `border-${variant}-${shade}`,
    ring: `ring-${variant}-${shade}`,
  }
}

/**
 * Get badge/status colors with background and text
 */
export const getBadgeColors = (variant: SemanticColorVariant) => {
  const shades = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-200' },
    success: { bg: 'bg-success-100', text: 'text-success-800', border: 'border-success-200' },
    warning: { bg: 'bg-warning-100', text: 'text-warning-800', border: 'border-warning-200' },
    danger: { bg: 'bg-danger-100', text: 'text-danger-800', border: 'border-danger-200' },
    info: { bg: 'bg-info-100', text: 'text-info-800', border: 'border-info-200' },
    neutral: { bg: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-200' },
  }
  
  return shades[variant]
}

/**
 * Get button variant colors
 */
export const getButtonColors = (variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' = 'primary') => {
  const variants = {
    primary: {
      bg: 'bg-primary-600',
      text: 'text-white',
      hover: 'hover:bg-primary-700',
      active: 'active:bg-primary-800',
      focus: 'focus:ring-primary-500',
    },
    secondary: {
      bg: 'bg-neutral-600',
      text: 'text-white',
      hover: 'hover:bg-neutral-700',
      active: 'active:bg-neutral-800',
      focus: 'focus:ring-neutral-500',
    },
    success: {
      bg: 'bg-success-600',
      text: 'text-white',
      hover: 'hover:bg-success-700',
      active: 'active:bg-success-800',
      focus: 'focus:ring-success-500',
    },
    warning: {
      bg: 'bg-warning-600',
      text: 'text-white',
      hover: 'hover:bg-warning-700',
      active: 'active:bg-warning-800',
      focus: 'focus:ring-warning-500',
    },
    danger: {
      bg: 'bg-danger-600',
      text: 'text-white',
      hover: 'hover:bg-danger-700',
      active: 'active:bg-danger-800',
      focus: 'focus:ring-danger-500',
    },
    outline: {
      bg: 'bg-transparent',
      text: 'text-neutral-700',
      hover: 'hover:bg-neutral-50',
      active: 'active:bg-neutral-100',
      focus: 'focus:ring-primary-500',
      border: 'border border-neutral-300',
    },
  }
  
  return variants[variant]
}

/**
 * Status-specific color mappings for common use cases
 */
export const getStatusColors = (status: string): SemanticColorVariant => {
  const statusMap: Record<string, SemanticColorVariant> = {
    // Common success states
    'active': 'success',
    'completed': 'success',
    'approved': 'success',
    'paid': 'success',
    'available': 'success',
    'owner': 'success',
    'occupied': 'success',
    
    // Common warning states
    'pending': 'warning',
    'in-progress': 'warning',
    'pending-approval': 'warning',
    'overdue': 'warning',
    'maintenance': 'warning',
    'tenant': 'warning',
    
    // Common danger/error states
    'inactive': 'danger',
    'cancelled': 'danger',
    'rejected': 'danger',
    'unpaid': 'danger',
    'vacant': 'danger',
    'error': 'danger',
    
    // Common info states
    'draft': 'info',
    'scheduled': 'info',
    'resident': 'info',
    'manager': 'info',
    'new': 'info',
    
    // Neutral states
    'unknown': 'neutral',
    'n/a': 'neutral',
  }
  
  return statusMap[status.toLowerCase()] || 'neutral'
}

/**
 * Priority-specific color mappings
 */
export const getPriorityColors = (priority: string): SemanticColorVariant => {
  const priorityMap: Record<string, SemanticColorVariant> = {
    'urgent': 'danger',
    'high': 'warning', 
    'medium': 'info',
    'low': 'neutral',
    'critical': 'danger',
  }
  
  return priorityMap[priority.toLowerCase()] || 'neutral'
}

/**
 * Get icon colors for different states
 */
export const getIconColors = (variant: SemanticColorVariant, shade: ColorShade = 600) => {
  return `text-${variant}-${shade}`
}

/**
 * Utility to combine multiple color classes
 */
export const combineColorClasses = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get table row hover colors
 */
export const getTableRowColors = () => ({
  hover: 'hover:bg-neutral-50',
  selected: 'bg-primary-50 border-primary-200',
  stripe: 'odd:bg-neutral-25',
})

/**
 * Get input field colors
 */
export const getInputColors = (state: 'default' | 'focus' | 'error' | 'success' = 'default') => {
  const states = {
    default: {
      border: 'border-neutral-300',
      bg: 'bg-white',
      text: 'text-neutral-900',
      placeholder: 'placeholder:text-neutral-500',
    },
    focus: {
      border: 'border-primary-500',
      ring: 'ring-1 ring-primary-500',
      bg: 'bg-white',
    },
    error: {
      border: 'border-danger-500',
      ring: 'ring-1 ring-danger-500',
      bg: 'bg-danger-50',
    },
    success: {
      border: 'border-success-500',
      ring: 'ring-1 ring-success-500', 
      bg: 'bg-success-50',
    },
  }
  
  return states[state]
}
