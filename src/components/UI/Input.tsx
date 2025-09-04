import React, { forwardRef, ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type InputVariant = 'default' | 'error' | 'success'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant
  size?: InputSize
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const inputVariants = {
  default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
  error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 bg-danger-50',
  success: 'border-success-300 focus:border-success-500 focus:ring-success-500 bg-success-50',
}

const inputSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const inputPaddingStyles = {
  sm: { padding: 'calc(0.375rem * var(--app-density, 1)) calc(0.75rem * var(--app-density, 1))' }, // py-1.5 px-3
  md: { padding: 'var(--input-padding-y) var(--input-padding-x)' }, // py-2 px-3
  lg: { padding: 'calc(0.75rem * var(--app-density, 1)) calc(1rem * var(--app-density, 1))' }, // py-3 px-4
}

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    variant = 'default',
    size = 'md',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = true,
    disabled,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const finalVariant = hasError ? 'error' : variant
    
    const baseClasses = [
      // Base styles
      'w-full rounded-md border',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'placeholder:text-neutral-400',
      
      // Disabled state
      'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
      
      // Size and variant
      inputSizes[size],
      inputVariants[finalVariant],
    ]

    const iconClass = iconSizes[size]

    return (
      <div className={cn('space-y-1', !fullWidth && 'w-auto')}>
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className={cn('text-neutral-400', iconClass)}>
                {leftIcon}
              </span>
            </div>
          )}
          
          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              ...baseClasses,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            style={inputPaddingStyles[size]}
            {...props}
          />
          
          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className={cn('text-neutral-400', iconClass)}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {/* Helper Text or Error Message */}
        {(error || helperText) && (
          <p className={cn(
            'text-xs',
            error ? 'text-danger-600' : 'text-neutral-500'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
