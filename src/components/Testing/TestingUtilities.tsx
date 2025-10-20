import React, { useState } from 'react';
import { 
  Settings, 
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Palette,
  Zap,
  Bug,
  Clock,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { Button, Card, CardContent } from '../UI';
import { User, Notification } from '../../types';

interface TestingUtilitiesProps {
  currentUser: User | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

interface DeviceTest {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
}

const TestingUtilities: React.FC<TestingUtilitiesProps> = ({ currentUser, addNotification }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const deviceTests: DeviceTest[] = [
    { id: 'desktop', name: 'Desktop', width: 1920, height: 1080, icon: <Monitor className="w-4 h-4" /> },
    { id: 'laptop', name: 'Laptop', width: 1366, height: 768, icon: <Monitor className="w-4 h-4" /> },
    { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: <Tablet className="w-4 h-4" /> },
    { id: 'mobile', name: 'Mobile', width: 375, height: 667, icon: <Smartphone className="w-4 h-4" /> }
  ];

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
    
    // Add debug CSS class to body
    if (!isDebugMode) {
      document.body.classList.add('debug-mode');
      document.head.insertAdjacentHTML('beforeend', `
        <style id="debug-styles">
          .debug-mode * {
            outline: 1px solid rgba(255, 0, 0, 0.3) !important;
          }
          .debug-mode *:hover {
            outline: 2px solid rgba(255, 0, 0, 0.8) !important;
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

  const testViewport = (device: DeviceTest) => {
    // This would typically open a new window or iframe with the specified dimensions
    const newWindow = window.open(window.location.href, '_blank', 
      `width=${device.width},height=${device.height},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    
    if (newWindow) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Viewport Test',
        message: `Opened ${device.name} viewport (${device.width}x${device.height})`,
        type: 'success'
      });
    } else {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Popup Blocked',
        message: 'Please allow popups to test different viewports',
        type: 'warning'
      });
    }
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    setCurrentTheme(nextTheme);
    
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (nextTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(nextTheme);
    }

    addNotification({
      userId: currentUser?.id || '',
      title: 'Theme Changed',
      message: `Switched to ${nextTheme} theme`,
      type: 'info'
    });
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
    
    // Simulate offline mode by intercepting network requests
    if (!isOfflineMode) {
      // This is a simplified simulation - in a real app you'd use Service Workers
      console.warn('Offline mode simulation enabled');
    } else {
      console.log('Offline mode simulation disabled');
    }

    addNotification({
      userId: currentUser?.id || '',
      title: 'Network Mode',
      message: `${!isOfflineMode ? 'Offline' : 'Online'} mode simulation ${!isOfflineMode ? 'enabled' : 'disabled'}`,
      type: 'info'
    });
  };

  const clearLocalStorage = () => {
    const itemCount = localStorage.length;
    localStorage.clear();
    
    addNotification({
      userId: currentUser?.id || '',
      title: 'Storage Cleared',
      message: `Cleared ${itemCount} items from localStorage`,
      type: 'success'
    });
  };

  const clearSessionStorage = () => {
    const itemCount = sessionStorage.length;
    sessionStorage.clear();
    
    addNotification({
      userId: currentUser?.id || '',
      title: 'Storage Cleared',
      message: `Cleared ${itemCount} items from sessionStorage`,
      type: 'success'
    });
  };

  const measurePerformance = () => {
    if ('performance' in window) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      const metrics = {
        'Page Load': `${loadTime}ms`,
        'DOM Ready': `${domReady}ms`,
        'DNS Lookup': `${timing.domainLookupEnd - timing.domainLookupStart}ms`,
        'TCP Connection': `${timing.connectEnd - timing.connectStart}ms`
      };

      let message = 'Performance Metrics:\n';
      Object.entries(metrics).forEach(([key, value]) => {
        message += `${key}: ${value}\n`;
      });

      console.table(metrics);
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Performance Measured',
        message: 'Check console for detailed metrics',
        type: 'info'
      });
    } else {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Performance API Unavailable',
        message: 'Performance timing not supported in this browser',
        type: 'warning'
      });
    }
  };

  const testConsoleOutput = () => {
    const testData = {
      user: currentUser?.name || 'Test User',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      theme: currentTheme,
      debugMode: isDebugMode
    };

    console.group('🧪 Test Environment Info');
    console.log('Current User:', testData.user);
    console.log('Timestamp:', testData.timestamp);
    console.log('Viewport:', testData.viewport);
    console.log('Theme:', testData.theme);
    console.log('Debug Mode:', testData.debugMode);
    console.log('User Agent:', testData.userAgent);
    console.groupEnd();

    addNotification({
      userId: currentUser?.id || '',
      title: 'Console Output',
      message: 'Test environment info logged to console',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-600" />
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Testing Utilities</h2>
          <p className="text-sm text-neutral-600">Development and testing tools</p>
        </div>
      </div>

      {/* Debug & Theme Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Debug Controls
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Debug Mode</span>
                <Button
                  onClick={toggleDebugMode}
                  variant={isDebugMode ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  {isDebugMode ? 'Disable' : 'Enable'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Console Test</span>
                <Button
                  onClick={testConsoleOutput}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Log Info
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Theme Controls
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Current Theme</span>
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 capitalize"
                >
                  <Palette className="w-4 h-4" />
                  {currentTheme}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Network Mode</span>
                <Button
                  onClick={toggleOfflineMode}
                  variant={isOfflineMode ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  {isOfflineMode ? 'Offline' : 'Online'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Viewport Testing */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Viewport Testing
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deviceTests.map((device) => (
              <Button
                key={device.id}
                onClick={() => testViewport(device)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto p-3"
              >
                {device.icon}
                <span className="text-xs font-medium">{device.name}</span>
                <span className="text-xs text-neutral-500">{device.width}×{device.height}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance & Storage */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Performance Testing
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Page Metrics</span>
                <Button
                  onClick={measurePerformance}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Measure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Reload Page</span>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Storage Management
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Local Storage</span>
                <Button
                  onClick={clearLocalStorage}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Session Storage</span>
                <Button
                  onClick={clearSessionStorage}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Display */}
      {(isDebugMode || isOfflineMode) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Active Testing Modes</h3>
            <div className="flex flex-wrap gap-2">
              {isDebugMode && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                  <Bug className="w-3 h-3" />
                  Debug Mode Active
                </span>
              )}
              {isOfflineMode && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline Simulation
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestingUtilities;
