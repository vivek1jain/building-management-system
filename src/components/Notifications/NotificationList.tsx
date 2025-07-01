import React from 'react'
import { useNotifications } from '../../contexts/NotificationContext'

const NotificationList: React.FC = () => {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" data-testid="notification-list">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`shadow-lg rounded px-4 py-3 flex items-center space-x-3 bg-white border-l-4 ${
            n.type === 'success' ? 'border-green-500' : n.type === 'error' ? 'border-red-500' : 'border-blue-500'
          }`}
          data-testid="notification-item"
        >
          <div className="flex-1">
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm text-gray-700">{n.message}</div>
          </div>
          <button
            className="ml-2 text-gray-400 hover:text-gray-700"
            onClick={() => removeNotification(n.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default NotificationList 