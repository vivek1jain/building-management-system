import React, { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import Button from './Button'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  className?: string
  overlayClassName?: string
}

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className={cn(
        // Base overlay styles - ensure full screen coverage with high z-index
        'fixed inset-0 z-modal',
        'flex items-center justify-center',
        'p-4',
        // Backdrop - solid overlay without blur, covering full screen
        'bg-black bg-opacity-50',
        // Animation
        'animate-in fade-in duration-200'
      )}
      style={{
        backgroundColor: overlayClassName?.includes('bg-') ? undefined : 'rgba(0, 0, 0, 0.5)',
        zIndex: 1400 // Explicit z-index to ensure it's on top
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        className={cn(
          // Base modal styles
          'relative bg-white rounded-xl shadow-2xl border border-gray-200',
          'w-full',
          modalSizes[size],
          // Animation
          'animate-in zoom-in-95 duration-200',
          // Max height with scroll
          'max-h-[90vh] overflow-hidden flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-neutral-900 truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-neutral-500"
                >
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4 flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  // Portal to document body
  return createPortal(modalContent, document.body)
}

// Modal Header Component
export const ModalHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
)

// Modal Footer Component
export const ModalFooter: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn(
    'flex items-center justify-end space-x-3 pt-6 mt-6',
    'border-t border-neutral-200',
    className
  )}>
    {children}
  </div>
)

export default Modal
