import { AlertCircle, Clock, CheckCircle, HelpCircle } from 'lucide-react'
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
      
      
      const startTime = Date.now()
      const now = new Date()
      
      // Query for tickets with status 'Complete'
      const ticketsRef = collection(db, 'tickets')
      const completeTicketsQuery = query(ticketsRef, where('status', '==', 'Complete'))
      const snapshot = await getDocs(completeTicketsQuery)
      
      
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
          continue
        }
        
        const completedDate = completedActivity.timestamp?.toDate 
          ? completedActivity.timestamp.toDate() 
          : new Date(completedActivity.timestamp)
        const daysSinceCompleted = Math.floor((now.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000))
        
        
        if (daysSinceCompleted >= 7) {
          
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
      } else {
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="h-4 w-4 text-purple-700" />
          </div>
          <h3 className="text-base font-semibold">Auto-Close Tickets</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Ticket Auto-Close Utility</p>
            <p className="mb-2">Closes tickets that have been "Complete" for 7+ days.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Finds all "Complete" tickets</li>
              <li>Checks completion date from activity log</li>
              <li>Closes tickets older than 7 days</li>
              <li>Adds audit trail entries</li>
              <li>Runs in browser (no Cloud Functions)</li>
            </ul>
            <p className="mt-2 text-yellow-300">💡 Check console (F12) for detailed logs</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {result && (
          <div className={`rounded-lg p-3 border text-sm mb-3 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium text-xs ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.message}
                </p>
                {result.details && (
                  <p className={`text-xs mt-1 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.details}
                  </p>
                )}
                {result.success && result.processedCount !== undefined && (
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div>
                      <span className="text-green-700">Processed: </span>
                      <span className="font-bold text-green-900">{result.processedCount}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Closed: </span>
                      <span className="font-bold text-green-900">{result.closedCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleAutoClose}
          disabled={loading}
          loading={loading}
          className="text-xs px-3 py-1.5 h-7 flex items-center justify-center"
        >
          {loading ? 'Processing...' : 'Run Auto-Close'}
        </Button>
      </div>

      {loading && (
        <div className="text-right text-xs text-gray-600 mt-2">
          <Clock className="h-3 w-3 animate-spin inline mr-1" />
          Processing...
        </div>
      )}
    </div>
  )
}

export default TicketAutoCloseUtility
