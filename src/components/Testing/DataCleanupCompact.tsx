import { Trash2, HelpCircle, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User, Notification } from '../../types';
import { Button } from '../UI';

interface DataCleanupCompactProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const DataCleanupCompact: React.FC<DataCleanupCompactProps> = ({ currentUser, addNotification }) => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleCleanup = async () => {
    if (!window.confirm('⚠️ This will DELETE ALL test data from Firestore. Continue?')) {
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const collections = ['tickets', 'expenses', 'events', 'income'];
      let totalDeleted = 0;

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        totalDeleted += querySnapshot.size;
      }

      setLastResult(`Deleted ${totalDeleted} records`);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Cleanup Complete',
        message: `Deleted ${totalDeleted} records`,
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`Error: ${errorMsg}`);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Cleanup Failed',
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="h-4 w-4 text-red-700" />
          </div>
          <h3 className="text-base font-semibold">Data Cleanup</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Data Cleanup Tool</p>
            <p className="mb-2">Remove all test data from Firestore collections.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Deletes tickets, expenses, events, income</li>
              <li>Cannot be undone</li>
              <li>Use only in dev/test environments</li>
            </ul>
            <p className="mt-2 text-red-300">⚠️ Destructive operation!</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center space-y-3 text-center">
        <div className="bg-yellow-50 rounded p-3 border border-yellow-200 w-full">
          <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
          <p className="text-xs text-yellow-800 font-medium">Destructive Operation</p>
          <p className="text-xs text-yellow-700 mt-1">Permanently deletes test data</p>
        </div>

        {lastResult && (
          <div className={`rounded p-2 border text-xs w-full ${
            lastResult.startsWith('Error') 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {lastResult}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-auto pt-2">
        <Button
          onClick={handleCleanup}
          disabled={loading}
          variant="danger"
          className="text-xs px-3 py-1.5 h-7 flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          {loading ? 'Cleaning...' : 'Clean All'}
        </Button>
      </div>
    </div>
  );
};

export default DataCleanupCompact;
