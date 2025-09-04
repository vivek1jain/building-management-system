import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CreateTicketContextType {
  isCreateTicketModalOpen: boolean
  openCreateTicketModal: () => void
  closeCreateTicketModal: () => void
}

const CreateTicketContext = createContext<CreateTicketContextType | undefined>(undefined)

interface CreateTicketProviderProps {
  children: ReactNode
}

export const CreateTicketProvider: React.FC<CreateTicketProviderProps> = ({ children }) => {
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false)

  const openCreateTicketModal = () => {
    setIsCreateTicketModalOpen(true)
  }

  const closeCreateTicketModal = () => {
    setIsCreateTicketModalOpen(false)
  }

  const value: CreateTicketContextType = {
    isCreateTicketModalOpen,
    openCreateTicketModal,
    closeCreateTicketModal
  }

  return (
    <CreateTicketContext.Provider value={value}>
      {children}
    </CreateTicketContext.Provider>
  )
}

export const useCreateTicket = (): CreateTicketContextType => {
  const context = useContext(CreateTicketContext)
  if (context === undefined) {
    throw new Error('useCreateTicket must be used within a CreateTicketProvider')
  }
  return context
}

export default CreateTicketContext
