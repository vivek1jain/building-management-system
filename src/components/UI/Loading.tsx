import { Loader2 } from 'lucide-react'
import React from 'react'
import { cn } from '../../utils/cn'

// Base spinner sizes
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  color?: string
}

// Basic animated spinner component
export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'text-primary-600' 
}) => {
  return (
    <Loader2 
      data-testid="loading-spinner"
      className={cn(
        'animate-spin',
        sizeClasses[size],
        color,
        className
      )} 
    />
  )
}

export interface PageLoadingProps {
  message?: string
  className?: string
}

// Full page loading overlay
export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div 
      className={cn(
        'min-h-screen bg-neutral-50 flex items-center justify-center',
        className
      )} 
      data-testid="loading-spinner"
    >
      <div className="text-center">
        <Spinner size="xl" className="mb-4 mx-auto" />
        <p className="text-lg font-medium text-neutral-900 mb-2">{message}</p>
        <p className="text-sm text-neutral-500">Please wait while we load your data</p>
      </div>
    </div>
  )
}

export interface SectionLoadingProps {
  message?: string
  className?: string
  size?: SpinnerSize
}

// Section loading component for cards/containers
export const SectionLoading: React.FC<SectionLoadingProps> = ({ 
  message = 'Loading...', 
  className,
  size = 'lg' 
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4',
      className
    )}>
      <Spinner size={size} className="mb-3" />
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  )
}

export interface InlineLoadingProps {
  message?: string
  className?: string
  size?: SpinnerSize
}

// Inline loading component for buttons/small sections
export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  message, 
  className,
  size = 'sm' 
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size={size} />
      {message && <span className="text-sm text-neutral-600">{message}</span>}
    </div>
  )
}

// Skeleton loading components for different UI elements
export interface SkeletonProps {
  className?: string
  animate?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  animate = true 
}) => {
  return (
    <div 
      className={cn(
        'bg-neutral-200 rounded',
        animate && 'animate-pulse',
        className
      )}
    />
  )
}

// Card skeleton for loading card layouts
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200 p-6 space-y-4', className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

// Table row skeleton for loading tables
export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({ 
  columns = 4, 
  className 
}) => {
  return (
    <tr className={cn('border-b border-neutral-200', className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Dashboard widget skeleton
export const WidgetSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// List item skeleton
export const ListItemSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-4 py-4 border-b border-neutral-200', className)}>
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

// Tab loading skeleton
export const TabLoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default {
  Spinner,
  PageLoading,
  SectionLoading,
  InlineLoading,
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  WidgetSkeleton,
  ListItemSkeleton,
  TabLoadingSkeleton
}
