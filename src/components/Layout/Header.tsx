
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import NotificationDropdown from '../Notifications/NotificationDropdown'

const Header = () => {
  const { currentUser, logout } = useAuth()
  const { notifications, isDropdownOpen, setIsDropdownOpen } = useNotifications()

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-900">Building Management System</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={handleBellClick}
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors duration-200"
              title={isDropdownOpen ? "Hide notifications" : "Show notifications"}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isDropdownOpen && <NotificationDropdown />}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
              data-testid="user-avatar"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden md:block">{currentUser?.name}</span>
            </button>
          </div>
          
          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header 