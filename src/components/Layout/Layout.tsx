import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CreateTicketModal from '../Tickets/CreateTicketModal'
import { useCreateTicket } from '../../contexts/CreateTicketContext'

const Layout = () => {
  const { isCreateTicketModalOpen, closeCreateTicketModal } = useCreateTicket()

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Global Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={closeCreateTicketModal}
      />
    </div>
  )
}

export default Layout 