import { AlertCircle, Clock, CheckCircle, FileX } from 'lucide-react'
import React, { useState } from 'react'
import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Button, Card, CardHeader, CardTitle, CardContent } from '../UI'

/**
 * Admin utility component for manually triggering the auto-close of completed tickets
 * 
 * Usage:
 * - Navigate to Admin > Data Tools tab
 * - Click "Run Auto-Close Now" to manually close completed tickets older than 7 days
 * - Watch console for detailed logs
 * - Runs directly in the browser without requiring Firebase Cloud Functions
 */
export const TicketAutoCloseUtility: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
    processedCount?: number
    closedCount?: number
  } | null>(null)

  const handleAutoClose = async () => {
    if (!currentUser?.id) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Please ensure you are logged in',
        type: 'error'
      })
      return
    }

    const confirmAutoClose = window.confirm(
      `⏰ AUTO-CLOSE TICKETS CONFIRMATION\n\n` +
      `This will automatically close all tickets that:\n` +
      `- Are in "Complete" status\n` +
      `- Have been completed for 7 or more days\n\n` +
      `What this does:\n` +
      `- Changes status from "Complete" to "Closed"\n` +
      `- Adds activity log entry for each closure\n` +
      `- Prevents reopening after the grace period\n\n` +
      `⚠️ This runs directly in your browser without Cloud Functions.\n\n` +
      `Do you want to proceed?`
    )

    if (!confirmAutoClose) {
      return
    }

    try {
      setLoading(true)
      setResult(null)
      
      console.log('[TicketAutoClose] 🔄 Starting manual auto-close operation')
      
      const startTime = Date.now()
      const now = new Date()
      
      // Query for tickets with status 'Complete'
      const ticketsRef = collection(db, 'tickets')
      const completeTicketsQuery = query(ticketsRef, where('status', '==', 'Complete'))
      const snapshot = await getDocs(completeTicketsQuery)
      
      console.log(`[TicketAutoClose] 📊 Found ${snapshot.size} tickets with Complete status`)
      
      let processedCount = 0
      let closedCount = 0
      
      const batch = writeBatch(db)
      
      for (const doc of snapshot.docs) {
        const ticket = doc.data()
        processedCount++
        
        // Find when the ticket was completed from activity log
        const activityLog = ticket.activityLog || []
        const completedActivity = activityLog.find((log: any) => 
          (log.action === 'Status Updated' && log.description?.includes('Complete')) ||
          log.action?.toLowerCase().includes('completed')
        )
        
        if (!completedActivity) {
          console.log(`[TicketAutoClose] ⚠️  Ticket ${doc.id}: No completion activity found, skipping`)
          continue
        }
        
        const completedDate = completedActivity.timestamp?.toDate 
          ? completedActivity.timestamp.toDate() 
          : new Date(completedActivity.timestamp)
        const daysSinceCompleted = Math.floor((now.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000))
        
        console.log(`[TicketAutoClose] 🔍 Ticket ${doc.id}: Completed ${daysSinceCompleted} days ago`)
        
        if (daysSinceCompleted >= 7) {
          console.log(`[TicketAutoClose] ✅ Auto-closing ticket ${doc.id} (completed ${daysSinceCompleted} days ago)`)
          
          // Create activity log entry for auto-closure
          const autoCloseActivity = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            action: 'Manual Auto Close',
            description: `Ticket manually auto-closed after 7 days (completed ${daysSinceCompleted} days ago)`,
            performedBy: currentUser.id,
            timestamp: Timestamp.fromDate(now),
            metadata: {
              originalCompletedDate: completedDate.toISOString(),
              daysSinceCompleted,
              autoCloseReason: '7-day-rule-manual-trigger',
              triggeredBy: currentUser.id
            }
          }
          
          // Update ticket status to Closed and add activity log entry
          batch.update(doc.ref, {
            status: 'Closed',
            updatedAt: Timestamp.now(),
            activityLog: [...activityLog, autoCloseActivity]
          })
          
          closedCount++
        } else {
          console.log(`[TicketAutoClose] ⏳ Ticket ${doc.id}: Still within 7-day grace period (${7 - daysSinceCompleted} days remaining)`)
        }
      }
      
      // Commit all updates in a batch
      if (closedCount > 0) {
        await batch.commit()
        console.log(`[TicketAutoClose] ✅ Auto-close completed: ${closedCount} tickets closed out of ${processedCount} Complete tickets`)
      } else {
        console.log(`[TicketAutoClose] ℹ️  Auto-close completed: No tickets needed closing out of ${processedCount} Complete tickets`)
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      
      const successMessage = `Auto-close completed in ${duration}s`
      const successDetails = `Processed ${processedCount} Complete ticket(s), closed ${closedCount} ticket(s) that exceeded the 7-day grace period.`
      
      setResult({
        success: true,
        message: successMessage,
        details: successDetails,
        processedCount,
        closedCount
      })
      
      addNotification({
        userId: currentUser.id,
        title: 'Auto-Close Complete',
        message: `Closed ${closedCount} ticket(s)`,
        type: 'success'
      })
      
      console.log('[TicketAutoClose] ✅ Auto-close operation completed successfully')
      
    } catch (error) {
      console.error('[TicketAutoClose] ❌ Auto-close operation failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setResult({
        success: false,
        message: 'Auto-close failed',
        details: errorMessage
      })
      
      addNotification({
        userId: currentUser.id,
        title: 'Auto-Close Failed',
        message: `Error: ${errorMessage}`,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          Ticket Auto-Close Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <p className="font-medium mb-2">What does this do?</p>
              <ul className="list-disc list-inside space-y-1 text-purple-800">
                <li>Finds all tickets in "Complete" status</li>
                <li>Checks when each ticket was completed (from activity log)</li>
                <li>Closes tickets that have been complete for 7+ days</li>
                <li>Adds detailed activity log entries for audit trail</li>
                <li>Shows you exactly what would happen in the overnight job</li>
              </ul>
            </div>
          </div>
        </div>

        {result && (
          <div className={`rounded-lg p-4 border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.message}
                </p>
                {result.details && (
                  <p className={`text-sm mt-1 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.details}
                  </p>
                )}
                {result.success && result.processedCount !== undefined && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-green-700 font-medium">Processed</p>
                        <p className="text-2xl font-bold text-green-900">{result.processedCount}</p>
                        <p className="text-xs text-green-700">Complete tickets</p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">Closed</p>
                        <p className="text-2xl font-bold text-green-900">{result.closedCount}</p>
                        <p className="text-xs text-green-700">Exceeded grace period</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">📋 Grace Period Rules:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 mt-2">
                <li><strong>7 days:</strong> Time window for managers to reopen completed tickets</li>
                <li><strong>Warning shown:</strong> UI displays countdown on completed tickets</li>
                <li><strong>Auto-close:</strong> After 7 days, ticket moves to "Closed" status</li>
                <li><strong>Activity tracked:</strong> All closures logged with timestamps</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileX className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium">🎯 Usage:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 mt-2">
                <li><strong>Manual:</strong> Run anytime by clicking the button below (no billing required)</li>
                <li><strong>Direct:</strong> Runs in your browser, no Cloud Functions needed</li>
                <li><strong>Frequency:</strong> Run weekly or as needed to close old completed tickets</li>
                <li><strong>Monitoring:</strong> Check browser console (F12) for detailed logs</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAutoClose}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Run Auto-Close Now'}
          </Button>
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-600">
            <Clock className="h-4 w-4 animate-spin inline mr-2" />
            Processing tickets... Check browser console for details
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-medium text-gray-700 mb-1">💡 Pro Tip:</p>
          <p>Open the browser console (F12) to see detailed logs of which tickets are being processed and closed.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TicketAutoCloseUtility
