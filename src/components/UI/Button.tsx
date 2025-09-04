import React, { forwardRef, ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { tokens } from '../../styles/tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  children: ReactNode
}

const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border-transparent',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 border-neutral-200',
  success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 border-transparent',
  warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 border-transparent',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 border-transparent',
  info: 'bg-info-600 text-white hover:bg-info-700 focus:ring-info-500 border-transparent',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500 border-transparent',
  outline: 'bg-transparent text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500 border-neutral-300',
}

const buttonSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const buttonPaddingStyles = {
  sm: { padding: 'calc(0.375rem * var(--app-density, 1)) calc(0.75rem * var(--app-density, 1))' }, // py-1.5 px-3
  md: { padding: 'var(--button-padding-y) var(--button-padding-x)' }, // py-2 px-4
  lg: { padding: 'calc(0.75rem * var(--app-density, 1)) calc(1.5rem * var(--app-density, 1))' }, // py-3 px-6
}

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props 
  }, ref) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center',
      'font-medium rounded-md',
      'border',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      
      // Disabled state
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      
      // Loading state
      loading && 'cursor-wait',
      
      // Width
      fullWidth && 'w-full',
      
      // Size and variant
      buttonSizes[size],
      buttonVariants[variant],
    ]

    const iconClass = iconSizes[size]
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(...baseClasses, className)}
        style={buttonPaddingStyles[size]}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && !loading && (
          <span className={cn('mr-2', iconClass)}>
            {leftIcon}
          </span>
        )}
        
        {/* Loading Spinner */}
        {loading && (
          <div className={cn('mr-2', iconClass)}>
            <div className="animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        {/* Button Text */}
        <span>{children}</span>
        
        {/* Right Icon */}
        {rightIcon && !loading && (
          <span className={cn('ml-2', iconClass)}>
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
