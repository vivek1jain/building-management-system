/**
 * Ticket Workflow Migration Tools
 * 
 * This module exports all the tools needed for migrating from the legacy
 * ticket workflow to the new Complete->Closed workflow with grace period.
 * 
 * @example
 * ```typescript
 * import { runMigrationWithConfirmation } from 'src/migrations/ticket-workflow'
 * 
 * // Run the migration with built-in safety checks
 * await runMigrationWithConfirmation()
 * ```
 */

// Core migration functions
export {
  migrateTicketWorkflow,
  validateMigration,
  runMigrationWithConfirmation
} from './migrateTicketWorkflow';

// Deployment orchestration
export { deployWorkflow } from './deployWorkflow';

// Type definitions for migration results
export interface MigrationSummary {
  totalProcessed: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

/**
 * Quick migration runner for production use
 * 
 * @param dryRun - If true, runs in simulation mode without making changes
 * @returns Promise<MigrationSummary>
 */
export async function quickMigration(dryRun: boolean = true): Promise<MigrationSummary> {
  const { migrateTicketWorkflow } = await import('./migrateTicketWorkflow');
  
  const result = await migrateTicketWorkflow(dryRun);
  
  return {
    totalProcessed: result.processedCount,
    migrated: result.migratedCount,
    skipped: result.processedCount - result.migratedCount,
    errors: result.errors
  };
}

/**
 * Get current ticket status counts for monitoring
 */
export async function getTicketStatusCounts() {
  const { validateMigration } = await import('./migrateTicketWorkflow');
  return await validateMigration();
}
