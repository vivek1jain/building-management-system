import { UserRole } from '../types'

/**
 * Page-level access control
 * Defines which user roles can access specific pages/routes
 */
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard: ['admin', 'manager', 'resident', 'supplier'],
  tickets: ['admin', 'manager', 'resident', 'supplier'],
  events: ['admin', 'manager', 'resident', 'supplier'],
  finances: ['admin', 'manager'],
  myPayments: ['resident'],
  buildingData: ['admin', 'manager'],
  myProfile: ['resident'],
  reports: ['admin', 'manager'],
  suppliers: ['admin', 'manager'],
  settings: ['admin', 'manager'],
  admin: ['admin'],
} as const

/**
 * Feature-level permissions
 * Defines which user roles can perform specific actions
 */
export const FEATURE_PERMISSIONS: Record<string, UserRole[]> = {
  // User Management
  canViewUsers: ['admin', 'manager'],
  canInviteUsers: ['admin', 'manager'],
  canEditUsers: ['admin', 'manager'],
  canDeleteUsers: ['admin'],
  canChangeUserRoles: ['admin'],
  canDeactivateUsers: ['admin'],
  
  // Building Management
  canViewBuildings: ['admin', 'manager', 'resident'],
  canAddBuildings: ['admin', 'manager'],
  canEditBuildings: ['admin', 'manager'],
  canDeleteBuildings: ['admin'],
  canManageBuildingAccess: ['admin', 'manager'],
  
  // People & Flats Management
  canViewPeople: ['admin', 'manager'],
  canAddPeople: ['admin', 'manager'],
  canEditPeople: ['admin', 'manager'],
  canDeletePeople: ['admin', 'manager'],
  canViewFlats: ['admin', 'manager', 'resident'],
  canEditFlats: ['admin', 'manager'],
  
  // Ticketing & Work Orders
  canCreateTickets: ['admin', 'manager', 'resident', 'supplier'],
  canViewAllTickets: ['admin', 'manager'],
  canViewOwnTickets: ['admin', 'manager', 'resident', 'supplier'],
  canViewTicketPricing: ['admin', 'manager'],
  canViewTicketQuotes: ['admin', 'manager'],
  canViewTicketSupplierDetails: ['admin', 'manager'],
  canViewTicketSchedule: ['admin', 'manager', 'resident', 'supplier'],
  canAssignTickets: ['admin', 'manager'],
  canCloseTickets: ['admin', 'manager'],
  canDeleteTickets: ['admin'],
  
  // Supplier Management
  canViewSuppliers: ['admin', 'manager'],
  canAddSuppliers: ['admin', 'manager'],
  canEditSuppliers: ['admin', 'manager'],
  canDeleteSuppliers: ['admin'],
  canManageQuotes: ['admin', 'manager'],
  
  // Financial Management
  canViewBuildingFinances: ['admin', 'manager'],
  canViewOwnFinances: ['admin', 'manager', 'resident'],
  canManageBudgets: ['admin', 'manager'],
  canApproveInvoices: ['admin', 'manager'],
  canCreateInvoices: ['admin', 'manager'],
  canEditPaymentSettings: ['admin', 'manager'],
  canViewOwnServiceCharges: ['admin', 'manager', 'resident'],
  canViewOwnPaymentHistory: ['admin', 'manager', 'resident'],
  
  // Events & Calendar
  canViewEvents: ['admin', 'manager', 'resident', 'supplier'],
  canCreateEvents: ['admin', 'manager'],
  canEditEvents: ['admin', 'manager'],
  canDeleteEvents: ['admin', 'manager'],
  
  // Reports & Analytics
  canViewReports: ['admin', 'manager'],
  canExportData: ['admin', 'manager'],
  canViewAnalytics: ['admin', 'manager'],
  canViewBuildingDashboard: ['admin', 'manager'],
  canViewOwnDashboard: ['admin', 'manager', 'resident', 'supplier'],
  
  // System Administration
  canAccessSecuritySettings: ['admin'],
  canManageWhitelist: ['admin'],
  canAccessTestingTools: ['admin'],
  canConfigureAppearance: ['admin'],
  canViewSystemLogs: ['admin'],
  canManageIntegrations: ['admin'],
} as const

/**
 * Helper function to check if a user role has permission for a specific feature
 */
export const hasPermission = (userRole: UserRole, permission: keyof typeof FEATURE_PERMISSIONS): boolean => {
  return FEATURE_PERMISSIONS[permission].includes(userRole)
}

/**
 * Helper function to check if a user role can access a specific page
 */
export const canAccessPage = (userRole: UserRole, page: keyof typeof PAGE_PERMISSIONS): boolean => {
  return PAGE_PERMISSIONS[page].includes(userRole)
}
