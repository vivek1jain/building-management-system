import { Mail, Copy, Check, Building2 } from 'lucide-react'
import React, { useState } from 'react'
import { createInvitation, generateInvitationLink } from '../../services/invitationService'
import { UserRole, PersonStatus } from '../../types'
import { useBuilding } from '../../contexts/BuildingContext'
import { Modal, Input, Button, Dropdown } from '../UI'
import type { DropdownOption } from '../UI'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: any
  addNotification: (notification: any) => void
  onInvitationCreated: () => void
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  addNotification,
  onInvitationCreated
}) => {
  const { buildings } = useBuilding()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('resident')
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([])
  const [expiryDays, setExpiryDays] = useState(7)
  const [sending, setSending] = useState(false)
  const [invitationLink, setInvitationLink] = useState('')
  const [copied, setCopied] = useState(false)
  // Additional fields
  const [phone, setPhone] = useState('')
  const [personStatus, setPersonStatus] = useState<PersonStatus>(PersonStatus.TENANT)
  // Role-specific fields
  const [flatNumber, setFlatNumber] = useState('')
  const [companyName, setCompanyName] = useState('')

  const handleToggleBuilding = (buildingId: string) => {
    setSelectedBuildingIds(prev => 
      prev.includes(buildingId)
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    )
  }

  // Auto-set status based on role
  const handleRoleChange = (newRole: string) => {
    setRole(newRole as UserRole)
    // Set default status based on role (not applicable for suppliers)
    if (newRole === 'admin' || newRole === 'manager') {
      setPersonStatus(PersonStatus.MANAGER)
    } else if (newRole === 'resident') {
      setPersonStatus(PersonStatus.TENANT)
    }
    // Suppliers don't get PersonStatus - they go in suppliers collection
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !email || selectedBuildingIds.length === 0) return

    try {
      setSending(true)
      console.log('📧 Creating invitation...')

      const invitation = await createInvitation(
        email,
        role,
        currentUser.id,
        currentUser.name,
        expiryDays,
        selectedBuildingIds,
        phone,
        role !== 'supplier' ? personStatus : undefined, // Only pass status for non-suppliers
        role === 'resident' ? flatNumber : undefined,
        role === 'supplier' ? companyName : undefined
      )

      const link = generateInvitationLink(invitation.token)
      setInvitationLink(link)

      addNotification({
        title: 'Success',
        message: `Invitation sent to ${email}`,
        type: 'success',
        userId: currentUser.id
      })

      onInvitationCreated()
    } catch (error: any) {
      console.error('🚨 Error creating invitation:', error)
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to create invitation',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setSending(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    addNotification({
      title: 'Copied',
      message: 'Invitation link copied to clipboard',
      type: 'success',
      userId: currentUser?.id
    })
  }

  const handleClose = () => {
    setEmail('')
    setRole('resident')
    setSelectedBuildingIds([])
    setExpiryDays(7)
    setPhone('')
    setPersonStatus(PersonStatus.TENANT)
    setFlatNumber('')
    setCompanyName('')
    setInvitationLink('')
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary-600" />
          <span>Invite New User</span>
        </div>
      }
      size="lg"
      closeOnBackdropClick={!sending}
      showCloseButton={!sending}
    >
      {!invitationLink ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            disabled={sending}
          />

          {/* Role and Expiry - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Role Select */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Role *
              </label>
              <Dropdown
                options={[
                  { value: 'resident', label: 'Owner/Tenant' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'supplier', label: 'Supplier' },
                  ...(currentUser?.role === 'admin' ? [{ value: 'admin', label: 'Admin' }] : [])
                ]}
                value={role}
                onChange={handleRoleChange}
                disabled={sending}
                size="md"
                variant="default"
              />
            </div>

            {/* Expiry Select */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Expires In
              </label>
              <Dropdown
                options={[
                  { value: '1', label: '1 day' },
                  { value: '3', label: '3 days' },
                  { value: '7', label: '7 days' },
                  { value: '14', label: '14 days' },
                  { value: '30', label: '30 days' }
                ]}
                value={expiryDays.toString()}
                onChange={(value) => setExpiryDays(Number(value))}
                disabled={sending}
                size="md"
                variant="default"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Phone Number
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +44 20 1234 5678"
              disabled={sending}
            />
          </div>

          {/* Person Status - Not shown for suppliers */}
          {role !== 'supplier' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Status *
              </label>
              <Dropdown
                options={[
                  { value: PersonStatus.TENANT, label: 'Tenant' },
                  { value: PersonStatus.OWNER, label: 'Owner' },
                  { value: PersonStatus.MANAGER, label: 'Manager' },
                ]}
                value={personStatus}
                onChange={(value) => setPersonStatus(value as PersonStatus)}
                disabled={sending}
                size="md"
                variant="default"
              />
            </div>
          )}

          {/* Role-specific fields */}
          {role === 'resident' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Flat Number
              </label>
              <Input
                type="text"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g., 101, A-5, etc."
                disabled={sending}
              />
            </div>
          )}

          {role === 'supplier' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Company Name *
              </label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                required
                disabled={sending}
              />
            </div>
          )}

          {/* Building Access */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Building Access * {selectedBuildingIds.length > 0 && (
                <span className="text-primary-600">({selectedBuildingIds.length} selected)</span>
              )}
            </label>
            <div className="border border-neutral-300 rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-neutral-50">
              {buildings.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-2">No buildings available</p>
              ) : (
                buildings.map(building => (
                  <label key={building.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2.5 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedBuildingIds.includes(building.id)}
                      onChange={() => handleToggleBuilding(building.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                      disabled={sending}
                    />
                    <Building2 className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <span className="text-sm text-neutral-900 flex-1">{building.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedBuildingIds.length === 0 && (
              <p className="text-xs text-danger-600 mt-1.5">Please select at least one building</p>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <p className="text-sm text-info-900">
              Share the invitation link with the user to complete registration.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-neutral-200 mt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={sending}
              className="w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={sending || !email || selectedBuildingIds.length === 0}
              loading={sending}
              className="w-auto"
            >
              Invite
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          {/* Success Banner */}
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0 bg-success-100 rounded-full p-1.5">
                <Check className="h-4 w-4 text-success-600" />
              </div>
              <h4 className="font-medium text-success-900">Invitation Created Successfully!</h4>
            </div>
            <p className="text-sm text-success-700">
              Share this link with <strong>{email}</strong> to complete registration.
            </p>
          </div>

          {/* Invitation Link */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Invitation Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-md bg-neutral-50 font-mono text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopyLink}
                variant={copied ? 'success' : 'primary'}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <p className="text-sm text-warning-900">
              <strong>Important:</strong> This link will expire in {expiryDays} day{expiryDays !== 1 ? 's' : ''}.
              The user must complete registration before then.
            </p>
          </div>

          {/* Done Button */}
          <div className="flex justify-end pt-5 border-t border-neutral-200">
            <Button
              onClick={handleClose}
              variant="primary"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
