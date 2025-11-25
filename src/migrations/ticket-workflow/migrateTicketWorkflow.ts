import { collection, getDocs, updateDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Ticket } from '../../types';

/**
 * Migration script to handle the transition from the old workflow to the new workflow.
 * 
 * Old workflow: Complete -> Closed (permanent)
 * New workflow: Complete (7-day grace period) -> Closed (permanent)
 * 
 * This script finds Closed tickets that were closed within the last 7 days
 * and transitions them back to Complete status so they can be reopened if needed.
 */

interface MigrationResult {
  success: boolean;
  processedCount: number;
  migratedCount: number;
  errors: string[];
  details: {
    ticketId: string;
    action: 'migrated' | 'skipped';
    reason: string;
    daysSinceClosed?: number;
  }[];
}

const TICKETS_COLLECTION = 'tickets';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

export async function migrateTicketWorkflow(dryRun = false): Promise<MigrationResult> {
  
  const result: MigrationResult = {
    success: false,
    processedCount: 0,
    migratedCount: 0,
    errors: [],
    details: []
  };

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    console.log(`⏰ Current time: ${now.toISOString()}`);
    
    // Query for tickets with status 'Closed'
    const closedTicketsQuery = query(
      collection(db, TICKETS_COLLECTION),
      where('status', '==', 'Closed')
    );
    
    const snapshot = await getDocs(closedTicketsQuery);
    
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    for (const docSnap of snapshot.docs) {
      const ticketData = docSnap.data();
      result.processedCount++;
      
      // Convert to proper ticket format for analysis
      const ticket: Partial<Ticket> = {
        id: docSnap.id,
        status: ticketData.status,
        activityLog: ticketData.activityLog?.map((log: any) => ({
          ...log,
          timestamp: convertTimestamp(log.timestamp)
        })) || []
      };
      
      
      // Find when the ticket was closed from activity log
      const closedActivity = ticket.activityLog?.find(log => 
        (log.action === 'Status Updated' && log.description?.includes('Closed')) ||
        log.action?.toLowerCase().includes('closed') ||
        log.action === 'Auto Closed'
      );
      
      if (!closedActivity) {
        const reason = 'No closed activity found in activity log';
        result.details.push({
          ticketId: ticket.id!,
          action: 'skipped',
          reason
        });
        continue;
      }
      
      const closedDate = new Date(closedActivity.timestamp);
      const daysSinceClosed = Math.floor(
        (now.getTime() - closedDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      
      if (daysSinceClosed <= 7) {
        // This ticket was closed recently and should be migrated to Complete status
        
        if (!dryRun) {
          // Create activity log entry for the migration
          const migrationActivity = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            action: 'Workflow Migration',
            description: `Ticket migrated from Closed to Complete status for new 7-day grace period workflow (was closed ${daysSinceClosed} days ago)`,
            performedBy: 'system',
            timestamp: new Date(),
            metadata: {
              originalClosedDate: closedDate.toISOString(),
              daysSinceOriginalClosure: daysSinceClosed,
              migrationReason: 'new-workflow-7-day-grace-period',
              daysRemainingForReopening: 7 - daysSinceClosed
            }
          };
          
          // Update ticket status back to Complete and add migration activity
          const ticketRef = doc(db, TICKETS_COLLECTION, docSnap.id);
          batch.update(ticketRef, {
            status: 'Complete',
            activityLog: [...(ticket.activityLog || []), migrationActivity],
            updatedAt: new Date()
          });
          
          batchCount++;
          
          // Commit batch if we reach the limit
          if (batchCount >= BATCH_SIZE) {
            console.log(`💾 Committing batch of ${batchCount} updates`);
            await batch.commit();
            batchCount = 0;
          }
        }
        
        result.migratedCount++;
        result.details.push({
          ticketId: ticket.id!,
          action: 'migrated',
          reason: `Migrated to Complete status (closed ${daysSinceClosed} days ago, ${7 - daysSinceClosed} days remaining for reopening)`,
          daysSinceClosed
        });
        
      } else {
        const reason = `Closed too long ago (${daysSinceClosed} days, beyond 7-day window)`;
        console.log(`⏳ Ticket ${ticket.id}: ${reason}`);
        result.details.push({
          ticketId: ticket.id!,
          action: 'skipped',
          reason,
          daysSinceClosed
        });
      }
    }
    
    // Commit any remaining updates
    if (!dryRun && batchCount > 0) {
      console.log(`💾 Committing final batch of ${batchCount} updates`);
      await batch.commit();
    }
    
    result.success = true;
    
    console.log(`   • Processed: ${result.processedCount} Closed tickets`);
    console.log(`   • Migrated: ${result.migratedCount} tickets to Complete status`);
    console.log(`   • Skipped: ${result.processedCount - result.migratedCount} tickets`);
    
    if (dryRun) {
      console.log(`   Run with dryRun=false to apply changes`);
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  return result;
}

/**
 * Validate the migration by checking the current state of tickets
 */
export async function validateMigration(): Promise<{
  completeTickets: number;
  closedTickets: number;
  completeTicketsInGracePeriod: number;
  completeTicketsExpired: number;
}> {
  
  try {
    const now = new Date();
    
    // Get all Complete tickets
    const completeQuery = query(
      collection(db, TICKETS_COLLECTION),
      where('status', '==', 'Complete')
    );
    const completeSnapshot = await getDocs(completeQuery);
    
    // Get all Closed tickets  
    const closedQuery = query(
      collection(db, TICKETS_COLLECTION),
      where('status', '==', 'Closed')
    );
    const closedSnapshot = await getDocs(closedQuery);
    
    let completeInGracePeriod = 0;
    let completeExpired = 0;
    
    // Analyze Complete tickets
    for (const doc of completeSnapshot.docs) {
      const ticket = doc.data();
      const activityLog = ticket.activityLog || [];
      
      const completedActivity = activityLog.find((log: any) => 
        (log.action === 'Status Updated' && log.description?.includes('Complete')) ||
        log.action?.toLowerCase().includes('completed') ||
        log.action === 'Work Completed'
      );
      
      if (completedActivity) {
        const completedDate = convertTimestamp(completedActivity.timestamp);
        const daysSinceCompleted = Math.floor(
          (now.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        
        if (daysSinceCompleted <= 7) {
          completeInGracePeriod++;
        } else {
          completeExpired++;
        }
      }
    }
    
    const validation = {
      completeTickets: completeSnapshot.size,
      closedTickets: closedSnapshot.size,
      completeTicketsInGracePeriod: completeInGracePeriod,
      completeTicketsExpired: completeExpired
    };
    
    console.log(`   • Complete tickets: ${validation.completeTickets}`);
    console.log(`   • Complete tickets in grace period (≤7 days): ${completeInGracePeriod}`);
    console.log(`   • Complete tickets expired (>7 days): ${completeExpired}`);
    console.log(`   • Closed tickets: ${validation.closedTickets}`);
    
    if (completeExpired > 0) {
      console.log(`   These should be auto-closed by the scheduled function`);
    }
    
    return validation;
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
    throw error;
  }
}

/**
 * Helper function to run the migration with user confirmation
 */
export async function runMigrationWithConfirmation(): Promise<void> {
  console.log('');
  console.log('This migration will:');
  console.log('1. Find all Closed tickets that were closed within the last 7 days');  
  console.log('2. Change their status back to Complete to enable the new 7-day grace period');
  console.log('3. Add activity log entries documenting the migration');
  console.log('');
  
  // First, run a dry run to see what would be migrated
  const dryRunResult = await migrateTicketWorkflow(true);
  
  if (!dryRunResult.success) {
    console.error('❌ Dry run failed:', dryRunResult.errors);
    return;
  }
  
  console.log(`   • Would migrate: ${dryRunResult.migratedCount} tickets`);
  console.log(`   • Would skip: ${dryRunResult.processedCount - dryRunResult.migratedCount} tickets`);
  
  if (dryRunResult.migratedCount === 0) {
    return;
  }
  
  // In a real implementation, you would add user confirmation here
  // For now, we'll auto-proceed with the migration
  
  const actualResult = await migrateTicketWorkflow(false);
  
  if (actualResult.success) {
    
    // Validate the results
    await validateMigration();
    
  } else {
    console.error('❌ Migration failed:', actualResult.errors);
  }
}
