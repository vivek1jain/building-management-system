import React, { createContext, useContext, useState } from 'react'
import { Notification } from '../types'

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      isRead: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Auto-remove after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        setNotifications(current => current.filter(n => n.id !== newNotification.id))
      }, 5000)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    isDropdownOpen,
    setIsDropdownOpen,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
} 