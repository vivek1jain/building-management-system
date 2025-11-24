import { LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { Button } from '../UI'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'
import ProfileSettingsModal from './ProfileSettingsModal'

const UserMenu = () => {
  const { currentUser, logout } = useAuth()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const getInitials = () => {
    if (!currentUser?.name) return 'U'
    const parts = currentUser.name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
  }

  const handleProfileSettings = () => {
    setIsOpen(false)
    setIsSettingsOpen(true)
  }

  return (
    <>
      <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center"
        data-testid="user-menu"
      >
        <div
          className={`rounded-full bg-primary-600 flex items-center justify-center ${
            isMobile ? 'h-6 w-6' : 'h-7 w-7'
          }`}
        >
          <span className="text-xs font-medium text-white">
            {getInitials()}
          </span>
        </div>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-neutral-200 z-50 overflow-hidden">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {currentUser?.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">{currentUser?.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Profile Settings */}
            <button
              onClick={handleProfileSettings}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150',
                'focus:outline-none focus:bg-neutral-50'
              )}
              title="Profile Settings"
            >
              <Settings className="h-4 w-4 text-neutral-500" />
              <span>Profile Settings</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-150',
                'focus:outline-none focus:bg-danger-50'
              )}
              title="Logout"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
      </div>
      <ProfileSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  )
}

export default UserMenu
