import { AlertCircle, RefreshCw, CheckCircle, Trash2, HelpCircle } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useBuilding } from '../../contexts/BuildingContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { backfillDemandsToLedger, clearFlatLedgerForBuilding } from '../../services/flatLedgerSyncService'
import { Button, Card, CardHeader, CardTitle, CardContent } from '../UI'

/**
 * Admin utility component for backfilling historical service charge demands to flat ledger
 * 
 * Usage:
 * - Import this component in your admin panel or settings page
 * - Click "Backfill Ledger Data" to sync all historical demands
 * - Watch console for [LedgerSync] logs
 * - This is a ONE-TIME operation per building
 */
export const LedgerBackfillUtility: React.FC = () => {
  const { currentUser } = useAuth()
  const { selectedBuildingId, selectedBuilding } = useBuilding()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const handleClearLedger = async () => {
    if (!selectedBuildingId || !currentUser?.id) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Please select a building and ensure you are logged in',
        type: 'error'
      })
      return
    }

    const confirmClear = window.confirm(
      `🗑️ CLEAR LEDGER CONFIRMATION\n\n` +
      `This will DELETE ALL flat ledger transactions for this building.\n\n` +
      `Building: ${selectedBuilding?.name || selectedBuildingId}\n\n` +
      `⚠️ WARNING: This action cannot be undone!\n\n` +
      `Use this if you need to re-run the backfill from scratch.\n\n` +
      `Do you want to proceed?`
    )

    if (!confirmClear) {
      return
    }

    try {
      setLoading(true)
      setResult(null)
      
      console.log('[LedgerBackfill] Clearing ledger for building:', selectedBuildingId)
      
      await clearFlatLedgerForBuilding(selectedBuildingId)
      
      setResult({
        success: true,
        message: 'Ledger cleared successfully',
        details: 'All flat ledger transactions have been deleted. You can now run the backfill.'
      })
      
      addNotification({
        userId: currentUser.id,
        title: 'Ledger Cleared',
        message: 'All flat ledger transactions deleted',
        type: 'success'
      })
      
    } catch (error) {
      console.error('[LedgerBackfill] ❌ Clear operation failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setResult({
        success: false,
        message: 'Clear failed',
        details: errorMessage
      })
      
      addNotification({
        userId: currentUser.id,
        title: 'Clear Failed',
        message: `Error: ${errorMessage}`,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBackfill = async () => {
    if (!selectedBuildingId || !currentUser?.id) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Please select a building and ensure you are logged in',
        type: 'error'
      })
      return
    }

    const confirmBackfill = window.confirm(
      `⚠️ BACKFILL CONFIRMATION\n\n` +
      `This will sync ALL existing service charge demands AND their payments to the flat ledger.\n\n` +
      `Building: ${selectedBuilding?.name || selectedBuildingId}\n\n` +
      `This operation:\n` +
      `- Creates ledger transactions for all historical demands\n` +
      `- Creates ledger transactions for all historical payments\n` +
      `- Recalculates running balances for all flats\n` +
      `- May take several minutes for large datasets\n\n` +
      `💡 TIP: If re-running, clear the ledger first to avoid duplicates.\n\n` +
      `Do you want to proceed?`
    )

    if (!confirmBackfill) {
      return
    }

    try {
      setLoading(true)
      setResult(null)
      
      console.log('[LedgerBackfill] Starting backfill operation for building:', selectedBuildingId)
      
      const startTime = Date.now()
      
      await backfillDemandsToLedger(selectedBuildingId, currentUser.id)
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      
      const successMessage = `Backfill completed successfully in ${duration}s`
      const successDetails = `Check console for detailed [LedgerSync] logs. All historical demands have been synced to flat ledgers.`
      
      setResult({
        success: true,
        message: successMessage,
        details: successDetails
      })
      
      addNotification({
        userId: currentUser.id,
        title: 'Backfill Complete',
        message: successMessage,
        type: 'success'
      })
      
      
    } catch (error) {
      console.error('[LedgerBackfill] ❌ Backfill operation failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setResult({
        success: false,
        message: 'Backfill failed',
        details: errorMessage
      })
      
      addNotification({
        userId: currentUser.id,
        title: 'Backfill Failed',
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
          <div className="p-2 bg-blue-100 rounded-lg">
            <RefreshCw className="h-4 w-4 text-blue-700" />
          </div>
          <h3 className="text-base font-semibold">Ledger Backfill</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Flat Ledger Backfill</p>
            <p className="mb-2">Syncs all historical service charge demands and payments to flat ledgers.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Creates ledger transactions for demands & payments</li>
              <li>Recalculates running balances</li>
              <li>Enables accurate statements</li>
            </ul>
            <p className="mt-2 text-yellow-300">⚠️ Clear ledger first if re-running to avoid duplicates</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {selectedBuilding && (
          <div className="text-xs text-neutral-600 mb-3">
            <span className="font-medium">{selectedBuilding.name}</span>
          </div>
        )}

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
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleClearLedger}
          disabled={loading || !selectedBuildingId}
          variant="danger"
          className="flex-1 text-xs px-3 py-1.5 h-7 flex items-center justify-center"
        >
          Clear
        </Button>
        
        <Button
          onClick={handleBackfill}
          disabled={loading || !selectedBuildingId}
          loading={loading}
          className="flex-1 text-xs px-3 py-1.5 h-7 flex items-center justify-center"
        >
          {loading ? 'Backfilling...' : 'Backfill'}
        </Button>
      </div>

      {loading && (
        <div className="text-center text-xs text-gray-600 mt-2">
          <RefreshCw className="h-3 w-3 animate-spin inline mr-1" />
          Processing...
        </div>
      )}
    </div>
  )
}

export default LedgerBackfillUtility
