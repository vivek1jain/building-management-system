import { Settings, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { User, Notification } from '../../types';
import { Button } from '../UI';

interface TestingUtilitiesCompactProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const TestingUtilitiesCompact: React.FC<TestingUtilitiesCompactProps> = ({ currentUser, addNotification }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
    
    if (!isDebugMode) {
      document.body.classList.add('debug-mode');
      document.head.insertAdjacentHTML('beforeend', `
        <style id="debug-styles">
          .debug-mode * {
            outline: 1px solid rgba(255, 0, 0, 0.3) !important;
          }
        </style>
      `);
    } else {
      document.body.classList.remove('debug-mode');
      document.getElementById('debug-styles')?.remove();
    }

    addNotification({
      userId: currentUser?.id || '',
      title: 'Debug Mode',
      message: `Debug mode ${!isDebugMode ? 'enabled' : 'disabled'}`,
      type: 'info'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Settings className="h-4 w-4 text-indigo-700" />
          </div>
          <h3 className="text-base font-semibold">Dev Tools</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
          <div className="absolute right-0 top-6 w-72 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
            <p className="font-medium mb-2">Development Utilities</p>
            <p className="mb-2">Debug tools for development and testing.</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Debug mode shows element outlines</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Debug Mode */}
        <div className="bg-neutral-50 rounded p-2 border border-neutral-200">
          <div className="flex items-center justify-between group relative">
            <span className="text-xs font-medium text-neutral-700">Debug Mode</span>
            <button 
              onClick={toggleDebugMode}
              className="relative"
              type="button"
            >
              <div className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${isDebugMode ? 'bg-green-500' : 'bg-neutral-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${isDebugMode ? 'ml-4' : 'ml-0.5'}`}></div>
              </div>
            </button>
            <div className="absolute right-0 top-6 w-48 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Shows red outlines on all elements for layout debugging
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingUtilitiesCompact;
