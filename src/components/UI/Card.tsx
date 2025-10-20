import React, { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  hover?: boolean
}

const paddingVariants = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const shadowVariants = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
}) => {
  return (
    <div
      className={cn(
        // Base styles
        'bg-white rounded-lg',
        
        // Border
        border && 'border border-neutral-200',
        
        // Padding
        paddingVariants[padding],
        
        // Shadow
        shadowVariants[shadow],
        
        // Hover effect
        hover && 'transition-shadow duration-200 hover:shadow-md',
        
        className
      )}
    >
      {children}
    </div>
  )
}

// Card Header Component
export const CardHeader: React.FC<{
  children: ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
)

// Card Title Component
export const CardTitle: React.FC<{
  children: ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}> = ({ children, className, as: Component = 'h3' }) => (
  <Component className={cn('text-lg font-semibold text-neutral-900', className)}>
    {children}
  </Component>
)

// Card Description Component
export const CardDescription: React.FC<{
  children: ReactNode
  className?: string
}> = ({ children, className }) => (
  <p className={cn('text-sm text-neutral-600', className)}>
    {children}
  </p>
)

// Card Content Component
export const CardContent: React.FC<{
  children: ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('space-y-4', className)}>
    {children}
  </div>
)

// Card Footer Component
export const CardFooter: React.FC<{
  children: ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between', className)}>
    {children}
  </div>
)

export default Card
