import React from 'react'
import Modal from '../UI/Modal'
import CreateTicketForm from './CreateTicketForm'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose }) => {
  const handleSuccess = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Ticket"
      description="Create a new maintenance ticket with all the details needed for quick resolution."
      size="lg"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <CreateTicketForm 
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  )
}

export default CreateTicketModal
