import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import NotificationDropdown from '../Notifications/NotificationDropdown'
import HeaderBuildingSwitcher from './HeaderBuildingSwitcher'
import { Button } from '../UI'
import { useIsMobile } from '../../hooks/useMediaQuery'

const Header = () => {
  const { currentUser, logout } = useAuth()
  const { notifications, isDropdownOpen, setIsDropdownOpen } = useNotifications()
  const isMobile = useIsMobile()

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center min-w-0 flex-1">
          <h2 className={`font-medium text-neutral-900 truncate ${
            isMobile ? 'text-base' : 'text-lg'
          }`}>
            {isMobile ? 'BMS' : 'Building Management System'}
          </h2>
        </div>
        
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
          
          {/* Building Switcher - Full width on mobile when needed */}
          {!isMobile && <HeaderBuildingSwitcher />}
          {isMobile && (
            <div className="max-w-[140px]">
              <HeaderBuildingSwitcher />
            </div>
          )}
          
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
              className={`flex items-center justify-center ${isMobile ? '' : 'space-x-2'}`}
              data-testid="user-avatar"
            >
              <div className={`rounded-full bg-primary-600 flex items-center justify-center ${
                isMobile ? 'h-6 w-6' : 'h-7 w-7'
              }`}>
                <span className="text-xs font-medium text-white">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              {!isMobile && <span className="text-neutral-700">{currentUser?.name}</span>}
            </Button>
          </div>
          
          {/* Logout */}
          {!isMobile && (
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
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Logout"
              className="p-1.5"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header 