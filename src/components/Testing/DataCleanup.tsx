import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { 
  Trash2, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  Calendar,
  Receipt,
  Ticket,
  TrendingUp
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { User, Notification } from '../../types';
import { Button, Card, CardContent } from '../UI';

interface DataCleanupProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

interface CollectionStats {
  tickets: number;
  expenses: number;
  events: number;
  income: number;
}

interface CleanupOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
  lastResult?: { success: boolean; count: number; error?: string };
}

const DataCleanup: React.FC<DataCleanupProps> = ({ currentUser, addNotification }) => {
  const [stats, setStats] = useState<CollectionStats>({ tickets: 0, expenses: 0, events: 0, income: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [operations, setOperations] = useState<CleanupOperation[]>([
    {
      id: 'tickets',
      name: 'Delete All Tickets',
      description: 'Remove all tickets and their associated data from Firestore',
      icon: <Ticket className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      isLoading: false
    },
    {
      id: 'expenses',
      name: 'Delete All Expenses',
      description: 'Remove all expense records from Firestore',
      icon: <Receipt className="w-5 h-5" />,
      color: 'text-red-600 bg-red-50 border-red-200',
      isLoading: false
    },
    {
      id: 'events',
      name: 'Delete All Events',
      description: 'Remove all calendar events from Firestore',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50 border-green-200',
      isLoading: false
    },
    {
      id: 'income',
      name: 'Delete All Income',
      description: 'Remove all income records from Firestore',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      isLoading: false
    }
  ]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Load collection statistics on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const collections = ['tickets', 'expenses', 'events', 'income'];
      const counts = { tickets: 0, expenses: 0, events: 0, income: 0 };
      
      for (const collectionName of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          counts[collectionName as keyof CollectionStats] = querySnapshot.size;
        } catch (error) {
          console.warn(`Failed to count ${collectionName}:`, error);
        }
      }
      
      setStats(counts);
    } catch (error) {
      console.error('Failed to load collection stats:', error);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to load database statistics',
        type: 'error'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const updateOperationState = (operationId: string, updates: Partial<CleanupOperation>) => {
    setOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, ...updates } : op
    ));
  };

  const handleSingleCleanup = async (operationId: string) => {
    updateOperationState(operationId, { isLoading: true });

    try {
      const querySnapshot = await getDocs(collection(db, operationId));
      const deletedCount = querySnapshot.size;
      
      // Delete all documents in the collection
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      updateOperationState(operationId, { 
        isLoading: false,
        lastResult: { success: true, count: deletedCount }
      });

      addNotification({
        userId: currentUser?.id || '',
        title: 'Cleanup Completed',
        message: `Successfully deleted ${deletedCount} ${operationId} record${deletedCount !== 1 ? 's' : ''}`,
        type: 'success'
      });

      // Refresh stats after cleanup
      await loadStats();

    } catch (error) {
      console.error(`Failed to delete ${operationId}:`, error);
      updateOperationState(operationId, { 
        isLoading: false,
        lastResult: { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Cleanup Error',
        message: `Error deleting ${operationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  const handleCleanupAll = async () => {
    setIsLoadingAll(true);
    const collections = ['tickets', 'expenses', 'events', 'income'];
    let totalDeleted = 0;
    const results: Record<string, number> = {};

    try {
      for (const collectionName of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const count = querySnapshot.size;
          
          const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          
          results[collectionName] = count;
          totalDeleted += count;
          
          updateOperationState(collectionName, {
            lastResult: { success: true, count }
          });
        } catch (error) {
          console.error(`Failed to delete ${collectionName}:`, error);
          results[collectionName] = 0;
          updateOperationState(collectionName, {
            lastResult: { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
      }
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Complete Cleanup Completed',
        message: `Successfully deleted ${totalDeleted} total records across all collections`,
        type: 'success'
      });

      // Refresh stats
      await loadStats();

    } catch (error) {
      console.error('Failed to cleanup all data:', error);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Cleanup Failed',
        message: `Error during complete cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsLoadingAll(false);
    }
  };

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'tickets': return <Ticket className="w-5 h-5 text-blue-600" />;
      case 'expenses': return <Receipt className="w-5 h-5 text-red-600" />;
      case 'events': return <Calendar className="w-5 h-5 text-green-600" />;
      case 'income': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default: return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const totalRecords = stats.tickets + stats.expenses + stats.events + stats.income;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Data Cleanup Tools</h2>
            <p className="text-sm text-neutral-600">Clean test data from Firestore collections</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadStats}
            disabled={loadingStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
          
          <Button
            onClick={handleCleanupAll}
            disabled={isLoadingAll || totalRecords === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoadingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clean All Data
          </Button>
        </div>
      </div>

      {/* Warning */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Warning: Destructive Operations</h4>
              <p className="text-sm text-amber-700 mt-1">
                These operations permanently delete data from Firestore and cannot be undone. 
                Only use in development/testing environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Database Statistics
            </h3>
            {loadingStats && <RefreshCw className="w-4 h-4 animate-spin text-primary-600" />}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([type, count]) => (
              <div key={type} className="text-center p-3 bg-neutral-50 rounded-lg border">
                <div className="flex justify-center mb-2">
                  {getStatIcon(type)}
                </div>
                <div className="text-2xl font-bold text-neutral-900">{count.toLocaleString()}</div>
                <div className="text-sm text-neutral-600 capitalize">{type}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t text-center">
            <div className="text-sm text-neutral-600">
              Total Records: <span className="font-semibold text-neutral-900">{totalRecords.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Cleanup Operations */}
      <div className="grid md:grid-cols-2 gap-4">
        {operations.map((operation) => {
          const currentCount = stats[operation.id as keyof CollectionStats];
          
          return (
            <Card key={operation.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${operation.color}`}>
                      {operation.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900">{operation.name}</h4>
                      <p className="text-sm text-neutral-600">{operation.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <div className="font-semibold text-neutral-900">{currentCount.toLocaleString()}</div>
                    <div className="text-neutral-500">records</div>
                  </div>
                </div>

                {/* Last Result */}
                {operation.lastResult && (
                  <div className={`flex items-center gap-2 mb-3 p-2 rounded text-sm ${
                    operation.lastResult.success 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {operation.lastResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>
                      {operation.lastResult.success 
                        ? `Deleted ${operation.lastResult.count} record${operation.lastResult.count !== 1 ? 's' : ''}`
                        : `Error: ${operation.lastResult.error}`
                      }
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => handleSingleCleanup(operation.id)}
                  disabled={operation.isLoading || currentCount === 0}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  {operation.isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {operation.isLoading ? 'Deleting...' : 
                   currentCount === 0 ? 'No Records' : `Delete ${currentCount} Record${currentCount !== 1 ? 's' : ''}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DataCleanup;
