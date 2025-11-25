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
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const clearLocalStorage = () => {
    if (!window.confirm('Clear localStorage? This will remove cached preferences.')) {
      return;
    }
    
    const count = localStorage.length;
    localStorage.clear();

    setLastResult(`Cleared ${count} localStorage items`);
    addNotification({
      userId: currentUser?.id || '',
      title: 'LocalStorage Cleared',
      message: `Cleared ${count} items from localStorage`,
      type: 'success'
    });
  };

  const clearSessionStorage = () => {
    if (!window.confirm('Clear sessionStorage? This will remove session data.')) {
      return;
    }
    
    const count = sessionStorage.length;
    sessionStorage.clear();

    setLastResult(`Cleared ${count} sessionStorage items`);
    addNotification({
      userId: currentUser?.id || '',
      title: 'SessionStorage Cleared',
      message: `Cleared ${count} items from sessionStorage`,
      type: 'success'
    });
  };

  const handleCleanup = async (collectionName: string) => {
    if (!window.confirm(`⚠️ Delete all ${collectionName}? This cannot be undone.`)) {
      return;
    }

    setLoading(collectionName);
    setLastResult(null);

    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      const deletedCount = querySnapshot.size;

      setLastResult(`Deleted ${deletedCount} ${collectionName}`);
      addNotification({
        userId: currentUser?.id || '',
        title: 'Cleanup Complete',
        message: `Deleted ${deletedCount} ${collectionName}`,
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
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
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

      <div className="flex-1 flex flex-col">
        {lastResult && (
          <div className={`rounded p-2 border text-xs mb-2 ${
            lastResult.startsWith('Error') 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {lastResult}
          </div>
        )}

        {/* Building Data Section */}
        <div className="flex-1 border-b border-neutral-200 pb-3 mb-3">
          <h4 className="text-xs font-semibold mb-2 text-neutral-700">Building Data</h4>
          <div className="grid grid-cols-2 gap-2">
          {/* Tickets */}
          <div className="group relative">
            <Button
              onClick={() => handleCleanup('tickets')}
              disabled={loading !== null}
              variant="danger"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'tickets' ? 'Deleting...' : 'Tickets'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Delete all ticket records from Firestore
            </div>
          </div>

          {/* Expenses */}
          <div className="group relative">
            <Button
              onClick={() => handleCleanup('expenses')}
              disabled={loading !== null}
              variant="danger"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'expenses' ? 'Deleting...' : 'Expenses'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Delete all expense records from Firestore
            </div>
          </div>

          {/* Events */}
          <div className="group relative">
            <Button
              onClick={() => handleCleanup('events')}
              disabled={loading !== null}
              variant="danger"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'events' ? 'Deleting...' : 'Events'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Delete all event records from Firestore
            </div>
          </div>

          {/* Income */}
          <div className="group relative">
            <Button
              onClick={() => handleCleanup('income')}
              disabled={loading !== null}
              variant="danger"
              className="w-full text-xs px-2 py-1 h-6"
            >
              {loading === 'income' ? 'Deleting...' : 'Income'}
            </Button>
            <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Delete all income records from Firestore
            </div>
          </div>
        </div>
      </div>

        {/* Session Data Section */}
        <div className="flex-1">
          <h4 className="text-xs font-semibold mb-2 text-neutral-700">Session Data</h4>
          <div className="grid grid-cols-2 gap-2">
            {/* LocalStorage */}
            <div className="group relative">
              <Button
                onClick={clearLocalStorage}
                variant="danger"
                className="w-full text-xs px-2 py-1 h-6"
              >
                LocalStorage
              </Button>
              <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Removes all data from browser localStorage
              </div>
            </div>

            {/* SessionStorage */}
            <div className="group relative">
              <Button
                onClick={clearSessionStorage}
                variant="danger"
                className="w-full text-xs px-2 py-1 h-6"
              >
                SessionStorage
              </Button>
              <div className="absolute left-0 bottom-7 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Removes all data from browser sessionStorage
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCleanupCompact;
