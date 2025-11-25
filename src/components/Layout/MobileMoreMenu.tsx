import {
  Calendar,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
  User,
  CreditCard
} from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types'

interface MoreMenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  allowedRoles?: UserRole[] // If undefined, accessible to all roles
}

const MobileMoreMenu: React.FC = () => {
  const { currentUser } = useAuth()

  const moreItems: MoreMenuItem[] = [
    { name: 'Events', href: '/events', icon: Calendar, description: 'Schedule and manage building events' },
    { name: 'Payments', href: '/my-payments', icon: CreditCard, description: 'View your service charges and payments', allowedRoles: ['resident'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, description: 'View analytics and reports', allowedRoles: ['admin', 'manager'] },
    { name: 'Settings', href: '/settings', icon: Settings, description: 'System configuration and preferences', allowedRoles: ['admin', 'manager'] },
    { name: 'Admin', href: '/admin', icon: Shield, description: 'Administrative functions and controls', allowedRoles: ['admin'] },
  ]

  // Filter menu items based on user role
  const filteredItems = moreItems.filter(item => {
    if (!item.allowedRoles) return true // No role restriction
    if (!currentUser) return false
    return item.allowedRoles.includes(currentUser.role)
  })

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">More</h1>
            <p className="text-neutral-600">
              Additional features and system controls
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className="block bg-white rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-50 rounded-lg">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-neutral-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileMoreMenu