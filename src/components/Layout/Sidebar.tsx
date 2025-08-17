import { NavLink } from 'react-router-dom'
import {
  Home,
  Calendar,
  Settings,
  Plus,
  DollarSign,
  Building,
  Wrench
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = () => {
  const { currentUser } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Building Data', href: '/building-data', icon: Building },
    { name: 'Finances', href: '/finances', icon: DollarSign },
    { name: 'Tickets & Work Orders', href: '/tickets', icon: Wrench },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-neutral-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-neutral-900">Building Manager</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
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

          {/* Quick Actions */}
          <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
            <NavLink
              to="/tickets/new"
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              New Ticket
            </NavLink>
          </div>

          {/* User Profile */}
          <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-700">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-700">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs text-neutral-500">
                  {currentUser?.role || 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 