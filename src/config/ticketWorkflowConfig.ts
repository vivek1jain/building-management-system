/**
 * Ticket Workflow Configuration
 * 
 * This file contains configurable settings for the new Complete->Closed 
 * ticket workflow with 7-day reopening grace period.
 */

export interface TicketWorkflowConfig {
  // Grace period settings
  REOPENING_GRACE_PERIOD_DAYS: number;
  REOPENING_GRACE_PERIOD_HOURS: number; // For more precise control if needed
  
  // Auto-closure settings
  AUTO_CLOSE_ENABLED: boolean;
  AUTO_CLOSE_SCHEDULE_CRON: string; // Cron expression for scheduled function
  AUTO_CLOSE_TIMEZONE: string;
  AUTO_CLOSE_BATCH_SIZE: number; // Max tickets to process in one batch
  
  // Permissions
  REOPEN_ALLOWED_ROLES: string[];
  MANUAL_CLOSE_ALLOWED_ROLES: string[];
  
  // Notifications
  REOPENING_EXPIRY_NOTIFICATION_ENABLED: boolean;
  REOPENING_EXPIRY_NOTIFICATION_DAYS_BEFORE: number[];
  
  // Activity log settings
  TRACK_GRACE_PERIOD_IN_ACTIVITY_LOG: boolean;
  INCLUDE_AUTO_CLOSE_METADATA: boolean;
}

/**
 * Default configuration for the ticket workflow
 */
export const DEFAULT_TICKET_WORKFLOW_CONFIG: TicketWorkflowConfig = {
  // Grace period: 7 days by default
  REOPENING_GRACE_PERIOD_DAYS: 7,
  REOPENING_GRACE_PERIOD_HOURS: 7 * 24, // 168 hours = 7 days
  
  // Auto-closure runs daily at 2 AM UK time
  AUTO_CLOSE_ENABLED: true,
  AUTO_CLOSE_SCHEDULE_CRON: '0 2 * * *', // Daily at 2 AM
  AUTO_CLOSE_TIMEZONE: 'Europe/London',
  AUTO_CLOSE_BATCH_SIZE: 500, // Firestore batch write limit
  
  // Only managers and admins can reopen tickets
  REOPEN_ALLOWED_ROLES: ['manager', 'admin'],
  MANUAL_CLOSE_ALLOWED_ROLES: ['manager', 'admin'],
  
  // Notification settings (not implemented yet, but configured for future)
  REOPENING_EXPIRY_NOTIFICATION_ENABLED: false,
  REOPENING_EXPIRY_NOTIFICATION_DAYS_BEFORE: [1], // Notify 1 day before expiry
  
  // Activity logging
  TRACK_GRACE_PERIOD_IN_ACTIVITY_LOG: true,
  INCLUDE_AUTO_CLOSE_METADATA: true
};

/**
 * Environment-specific configurations
 */
export const WORKFLOW_CONFIG_BY_ENVIRONMENT = {
  development: {
    ...DEFAULT_TICKET_WORKFLOW_CONFIG,
    // In development, use shorter grace period for testing
    REOPENING_GRACE_PERIOD_DAYS: 1,
    REOPENING_GRACE_PERIOD_HOURS: 24,
    // Run more frequently in development for testing
    AUTO_CLOSE_SCHEDULE_CRON: '0 */6 * * *', // Every 6 hours
  },
  
  testing: {
    ...DEFAULT_TICKET_WORKFLOW_CONFIG,
    // Very short grace period for tests
    REOPENING_GRACE_PERIOD_DAYS: 0,
    REOPENING_GRACE_PERIOD_HOURS: 1, // 1 hour for testing
    AUTO_CLOSE_ENABLED: false, // Disable auto-close in tests
  },
  
  staging: {
    ...DEFAULT_TICKET_WORKFLOW_CONFIG,
    // Same as production but with more frequent auto-close for validation
    AUTO_CLOSE_SCHEDULE_CRON: '0 */12 * * *', // Every 12 hours
  },
  
  production: DEFAULT_TICKET_WORKFLOW_CONFIG
};

/**
 * Get the workflow configuration for the current environment
 */
export function getTicketWorkflowConfig(): TicketWorkflowConfig {
  const environment = process.env.NODE_ENV || 'development';
  const config = WORKFLOW_CONFIG_BY_ENVIRONMENT[environment as keyof typeof WORKFLOW_CONFIG_BY_ENVIRONMENT];
  
  if (!config) {
    console.warn(`No workflow config found for environment: ${environment}, using default`);
    return DEFAULT_TICKET_WORKFLOW_CONFIG;
  }
  
  return config;
}

/**
 * Calculate the grace period expiry date from a completion date
 */
export function calculateGracePeriodExpiry(completionDate: Date, config?: TicketWorkflowConfig): Date {
  const workflowConfig = config || getTicketWorkflowConfig();
  const expiryDate = new Date(completionDate);
  expiryDate.setDate(expiryDate.getDate() + workflowConfig.REOPENING_GRACE_PERIOD_DAYS);
  return expiryDate;
}

/**
 * Check if a user role is allowed to reopen tickets
 */
export function canUserRoleReopenTickets(userRole: string, config?: TicketWorkflowConfig): boolean {
  const workflowConfig = config || getTicketWorkflowConfig();
  return workflowConfig.REOPEN_ALLOWED_ROLES.includes(userRole);
}

/**
 * Check if a user role is allowed to manually close Complete tickets
 */
export function canUserRoleManuallyClose(userRole: string, config?: TicketWorkflowConfig): boolean {
  const workflowConfig = config || getTicketWorkflowConfig();
  return workflowConfig.MANUAL_CLOSE_ALLOWED_ROLES.includes(userRole);
}

/**
 * Calculate days remaining in grace period
 */
export function calculateDaysRemainingInGracePeriod(
  completionDate: Date, 
  currentDate: Date = new Date(),
  config?: TicketWorkflowConfig
): number {
  const workflowConfig = config || getTicketWorkflowConfig();
  const daysSinceCompletion = Math.floor(
    (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(0, workflowConfig.REOPENING_GRACE_PERIOD_DAYS - daysSinceCompletion);
}

/**
 * Check if a ticket is still within the grace period
 */
export function isWithinGracePeriod(
  completionDate: Date,
  currentDate: Date = new Date(),
  config?: TicketWorkflowConfig
): boolean {
  return calculateDaysRemainingInGracePeriod(completionDate, currentDate, config) > 0;
}

/**
 * Workflow status descriptions for UI display
 */
export const WORKFLOW_STATUS_DESCRIPTIONS = {
  Complete: {
    title: 'Work Completed',
    description: 'Work has been completed. This ticket will auto-close after 7 days unless reopened.',
    canReopen: true,
    gracePeriodApplies: true
  },
  Closed: {
    title: 'Closed Ticket', 
    description: 'This ticket has been completed and permanently closed.',
    canReopen: false,
    gracePeriodApplies: false
  }
} as const;

/**
 * Activity log templates for consistent messaging
 */
export const ACTIVITY_LOG_TEMPLATES = {
  TICKET_COMPLETED: (notes?: string) => 
    `Work marked as completed${notes ? `: ${notes}` : ''}`,
  
  TICKET_REOPENED: (reason?: string) => 
    `Ticket reopened from Complete status${reason ? `: ${reason}` : ''}`,
  
  AUTO_CLOSED: (daysSinceCompletion: number) => 
    `Ticket automatically closed after 7 days (completed ${daysSinceCompletion} days ago)`,
  
  MANUAL_CLOSED_FROM_COMPLETE: (reason?: string) => 
    `Ticket manually closed from Complete status${reason ? `: ${reason}` : ''}`,
  
  WORKFLOW_MIGRATED: (daysSinceOriginalClosure: number) => 
    `Ticket migrated from Closed to Complete status for new 7-day grace period workflow (was closed ${daysSinceOriginalClosure} days ago)`
} as const;

export type WorkflowStatusKey = keyof typeof WORKFLOW_STATUS_DESCRIPTIONS;
