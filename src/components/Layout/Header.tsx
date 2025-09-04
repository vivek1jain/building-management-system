import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import NotificationDropdown from '../Notifications/NotificationDropdown'
import HeaderBuildingSwitcher from './HeaderBuildingSwitcher'
import { Button } from '../UI'

const Header = () => {
  const { currentUser, logout } = useAuth()
  const { notifications, isDropdownOpen, setIsDropdownOpen } = useNotifications()

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-neutral-900">Building Management System</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          
          {/* Building Switcher */}
          <HeaderBuildingSwitcher />
          
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBellClick}
              className="relative"
              title={isDropdownOpen ? "Hide notifications" : "Show notifications"}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            {isDropdownOpen && <NotificationDropdown />}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center space-x-2"
              data-testid="user-avatar"
            >
              <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-neutral-700">{currentUser?.name}</span>
            </Button>
          </div>
          
          {/* Logout */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Logout"
              className="mb-1"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-neutral-500">Logout</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 