import { AlertCircle, RefreshCw, CheckCircle, Trash2 } from 'lucide-react'
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
      
      console.log('[LedgerBackfill] ✅ Backfill operation completed successfully')
      
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Flat Ledger Backfill Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">What does this do?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Syncs all historical service charge demands AND payments to flat ledgers</li>
                <li>Creates ledger transactions with proper linking (serviceChargeDemandId)</li>
                <li>Recalculates running balances for all flats</li>
                <li>Enables accurate statements with correct balances</li>
              </ul>
            </div>
          </div>
        </div>

        {selectedBuilding && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">Selected Building:</p>
            <p className="font-medium text-gray-900">{selectedBuilding.name}</p>
            <p className="text-xs text-gray-500 mt-1">ID: {selectedBuildingId}</p>
          </div>
        )}

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
              <div>
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
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium">⚠️ Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 mt-2">
                <li>If re-running backfill, CLEAR LEDGER first to avoid duplicates</li>
                <li>May take several minutes for buildings with many demands</li>
                <li>Watch the browser console for detailed progress logs</li>
                <li>Backfill now includes both demands AND their payment history</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleClearLedger}
            disabled={loading || !selectedBuildingId}
            variant="danger"
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Ledger
          </Button>
          
          <Button
            onClick={handleBackfill}
            disabled={loading || !selectedBuildingId}
            loading={loading}
            className="flex-1"
          >
            {loading ? 'Backfilling...' : 'Backfill Ledger Data'}
          </Button>
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
            Processing... Open browser console to see progress
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LedgerBackfillUtility
