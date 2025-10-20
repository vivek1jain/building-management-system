import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Ticket,
  DollarSign,
  Building,
  MoreHorizontal,
  Bell
} from 'lucide-react'
import { useCreateTicket } from '../../contexts/CreateTicketContext'

const MobileBottomNav = () => {
  const location = useLocation()
  const { openCreateTicketModal } = useCreateTicket()
  
  // Get active tab based on current route
  const getActiveTab = (pathname: string) => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/tickets')) return 'tickets'
    if (pathname.startsWith('/finances')) return 'finances'  
    if (pathname.startsWith('/building-data')) return 'building'
    if (pathname.startsWith('/more') || pathname.startsWith('/events') || pathname.startsWith('/reports') || pathname.startsWith('/settings') || pathname.startsWith('/admin')) return 'more'
    return 'home'
  }
  
  const activeTab = getActiveTab(location.pathname)
  
  const navigation = [
    {
      id: 'home',
      name: 'Home',
      href: '/',
      icon: Home,
      badge: null
    },
    {
      id: 'tickets', 
      name: 'Tickets',
      href: '/tickets',
      icon: Ticket,
      badge: null // TODO: Add open tickets count
    },
    {
      id: 'finances',
      name: 'Finances', 
      href: '/finances',
      icon: DollarSign,
      badge: null // TODO: Add pending approvals count
    },
    {
      id: 'building',
      name: 'Building',
      href: '/building-data', 
      icon: Building,
      badge: null
    },
    {
      id: 'more',
      name: 'More',
      href: '/more',
      icon: MoreHorizontal,
      badge: null // TODO: Add updates count
    }
  ]
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pb-safe lg:hidden z-50">
      <nav className="flex">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <NavLink
              key={item.id}
              to={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[64px] transition-colors duration-200 ${
                isActive
                  ? 'text-primary-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 ${isActive ? 'text-primary-600' : 'text-neutral-500'}`} 
                />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span 
                className={`text-xs font-medium mt-1 ${
                  isActive ? 'text-primary-600' : 'text-neutral-500'
                }`}
              >
                {item.name}
              </span>
            </NavLink>
          )
        })}
      </nav>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-bottom bg-white" />
    </div>
  )
}

export default MobileBottomNav