import { Wrench, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useBuilding } from '../../contexts/BuildingContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { backfillDemandsToLedger, clearFlatLedgerForBuilding } from '../../services/flatLedgerSyncService';
import { Button } from '../UI';

const UtilitiesCompact: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedBuildingId, selectedBuilding } = useBuilding();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Auto-Close Tickets
  const handleAutoClose = async () => {
    if (!currentUser?.id) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Please ensure you are logged in',
        type: 'error'
      });
      return;
    }

    if (!window.confirm('⏰ Auto-close tickets that have been Complete for 7+ days?')) {
      return;
    }

    setLoading('autoclose');
    setLastResult(null);

    try {
      const now = new Date();
      const ticketsRef = collection(db, 'tickets');
      const completeTicketsQuery = query(ticketsRef, where('status', '==', 'Complete'));
      const snapshot = await getDocs(completeTicketsQuery);
      
      let closedCount = 0;
      const batch = writeBatch(db);
      
      for (const doc of snapshot.docs) {
        const ticket = doc.data();
        const activityLog = ticket.activityLog || [];
        const completedActivity = activityLog.find((log: any) => 
          (log.action === 'Status Updated' && log.description?.includes('Complete')) ||
          log.action?.toLowerCase().includes('completed')
        );
        
        if (!completedActivity) continue;
        
        const completedDate = completedActivity.timestamp?.toDate 
          ? completedActivity.timestamp.toDate() 
          : new Date(completedActivity.timestamp);
        const daysSinceCompleted = Math.floor((now.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysSinceCompleted >= 7) {
          const autoCloseActivity = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            action: 'Manual Auto Close',
            description: `Auto-closed after 7 days (${daysSinceCompleted} days)`,
            performedBy: currentUser.id,
            timestamp: Timestamp.fromDate(now),
            metadata: {
              originalCompletedDate: completedDate.toISOString(),
              daysSinceCompleted,
              autoCloseReason: '7-day-rule-manual-trigger',
              triggeredBy: currentUser.id
            }
          };
          
          batch.update(doc.ref, {
            status: 'Closed',
            updatedAt: Timestamp.now(),
            activityLog: [...activityLog, autoCloseActivity]
          });
          
          closedCount++;
        }
      }
      
      if (closedCount > 0) {
        await batch.commit();
      }

      setLastResult(`Closed ${closedCount} ticket(s)`);
      addNotification({
        userId: currentUser.id,
        title: 'Auto-Close Complete',
        message: `Closed ${closedCount} ticket(s)`,
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`Error: ${errorMsg}`);
      addNotification({
        userId: currentUser.id,
        title: 'Auto-Close Failed',
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setLoading(null);
    }
  };

  // Clear Ledger
  const handleClearLedger = async () => {
    if (!selectedBuildingId || !currentUser?.id) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Select a building first',
        type: 'error'
      });
      return;
    }

    if (!window.confirm(`🗑️ Delete ALL ledger transactions for ${selectedBuilding?.name}?`)) {
      return;
    }

    setLoading('clear');
    setLastResult(null);

    try {
      await clearFlatLedgerForBuilding(selectedBuildingId);
      setLastResult('Ledger cleared');
      addNotification({
        userId: currentUser.id,
        title: 'Ledger Cleared',
        message: 'All transactions deleted',
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`Error: ${errorMsg}`);
      addNotification({
        userId: currentUser.id,
        title: 'Clear Failed',
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setLoading(null);
    }
  };

  // Backfill Ledger
  const handleBackfill = async () => {
    if (!selectedBuildingId || !currentUser?.id) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Select a building first',
        type: 'error'
      });
      return;
    }

    if (!window.confirm(`⚠️ Backfill ALL demands/payments for ${selectedBuilding?.name}? This may take a while.`)) {
      return;
    }

    setLoading('backfill');
    setLastResult(null);

    try {
      await backfillDemandsToLedger(selectedBuildingId, currentUser.id);
      setLastResult('Backfill complete');
      addNotification({
        userId: currentUser.id,
        title: 'Backfill Complete',
        message: 'All demands synced to ledger',
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`Error: ${errorMsg}`);
      addNotification({
        userId: currentUser.id,
        title: 'Backfill Failed',
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Wrench className="h-4 w-4 text-teal-700" />
          </div>
          <h3 className="text-base font-semibold">Utilities</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Admin Utilities</p>
            <p className="mb-2">Maintenance and data management tools.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Auto-Close:</strong> Closes Complete tickets after 7 days</li>
              <li><strong>Clear:</strong> Deletes all ledger transactions</li>
              <li><strong>Backfill:</strong> Syncs demands to ledger</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {lastResult && (
          <div className={`rounded p-2 border text-xs mb-2 ${
            lastResult.startsWith('Error') 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {lastResult}
          </div>
        )}

        {selectedBuilding && (
          <div className="text-xs text-neutral-600 mb-2">
            <span className="font-medium">{selectedBuilding.name}</span>
          </div>
        )}

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Auto-Close Tickets */}
          <div className="group relative">
            <Button
              onClick={handleAutoClose}
              disabled={loading !== null}
              variant="primary"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'autoclose' ? 'Processing...' : 'Run Auto-Close'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Closes tickets that have been Complete for 7+ days
            </div>
          </div>

          {/* Empty spacer for alignment */}
          <div></div>

          {/* Clear Ledger */}
          <div className="group relative">
            <Button
              onClick={handleClearLedger}
              disabled={loading !== null || !selectedBuildingId}
              variant="danger"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'clear' ? 'Clearing...' : 'Clear Ledger'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Deletes all ledger transactions for selected building
            </div>
          </div>

          {/* Backfill Ledger */}
          <div className="group relative">
            <Button
              onClick={handleBackfill}
              disabled={loading !== null || !selectedBuildingId}
              variant="primary"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'backfill' ? 'Backfilling...' : 'Backfill Ledger'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Syncs all demands and payments to flat ledgers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilitiesCompact;
