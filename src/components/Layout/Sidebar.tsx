import {
  Home,
  Calendar,
  Settings,
  PoundSterling,
  Building,
  Wrench,
  BarChart3,
  Shield,
  User,
  CreditCard
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  testId: string
  allowedRoles?: UserRole[] // If undefined, accessible to all roles
}

const Sidebar = () => {
  const { currentUser } = useAuth()

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home, testId: 'nav-dashboard' },
    { name: 'Ticketing', href: '/tickets', icon: Wrench, testId: 'nav-tickets' },
    { name: 'Events', href: '/events', icon: Calendar, testId: 'nav-events' },
    { name: 'Finances', href: '/finances', icon: PoundSterling, testId: 'nav-finances', allowedRoles: ['admin', 'manager'] },
    { name: 'Payments', href: '/my-payments', icon: CreditCard, testId: 'nav-my-payments', allowedRoles: ['resident'] },
    { name: 'Building', href: '/building-data', icon: Building, testId: 'nav-building', allowedRoles: ['admin', 'manager'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, testId: 'nav-reports', allowedRoles: ['admin', 'manager'] },
    { name: 'Settings', href: '/settings', icon: Settings, testId: 'nav-settings', allowedRoles: ['admin', 'manager'] },
    { name: 'Admin', href: '/admin', icon: Shield, testId: 'nav-admin', allowedRoles: ['admin'] },
  ]

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!item.allowedRoles) return true // No role restriction
    if (!currentUser) return false
    return item.allowedRoles.includes(currentUser.role)
  })

  return (
    <div className="hidden md:flex md:flex-shrink-0" data-testid="sidebar">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-neutral-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-neutral-900">Building Manager</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    data-testid={item.testId}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 