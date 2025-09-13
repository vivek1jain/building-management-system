import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileBottomNav from './MobileBottomNav'
import CreateTicketModal from '../Tickets/CreateTicketModal'
import { useCreateTicket } from '../../contexts/CreateTicketContext'
import { useIsMobile } from '../../hooks/useMediaQuery'

const Layout = () => {
  const { isCreateTicketModalOpen, closeCreateTicketModal } = useCreateTicket()
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 p-6 ${isMobile ? 'pb-20' : ''}`}>
          <Outlet />
        </main>
      </div>
      
      {/* Mobile bottom navigation - hidden on desktop */}
      {isMobile && <MobileBottomNav />}
      
      {/* Global Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={closeCreateTicketModal}
      />
    </div>
  )
}

export default Layout 