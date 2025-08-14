/**
 * Deployment Helper Functions
 * Ensures functionality is preserved during production deployment
 */

// Environment validation
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }
  
  console.log('✅ All environment variables present');
  return true;
};

// Firebase connection test
export const testFirebaseConnection = async () => {
  try {
    const { db } = await import('../firebase/config');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');
    
    // Test read access
    const testQuery = query(collection(db, 'buildings'), limit(1));
    await getDocs(testQuery);
    
    console.log('✅ Firebase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

// Service availability check
export const checkServiceAvailability = async () => {
  const services = [
    'buildingService',
    'flatService', 
    'personService',
    'supplierService',
    'assetService',
    'ticketService',
    'eventService'
  ];

  const results = await Promise.allSettled(
    services.map(async (serviceName) => {
      try {
        const service = await import(`../services/${serviceName}`);
        return { service: serviceName, available: true };
      } catch (error) {
        console.error(`❌ Service ${serviceName} not available:`, error);
        return { service: serviceName, available: false, error };
      }
    })
  );

  const unavailable = results
    .filter(result => result.status === 'fulfilled' && !result.value.available)
    .map(result => result.status === 'fulfilled' ? result.value.service : 'unknown');

  if (unavailable.length > 0) {
    console.error('❌ Unavailable services:', unavailable);
    return false;
  }

  console.log('✅ All services available');
  return true;
};

// Production readiness check
export const checkProductionReadiness = async () => {
  console.log('🔍 Checking production readiness...');
  
  const checks = [
    { name: 'Environment Variables', test: validateEnvironment },
    { name: 'Firebase Connection', test: testFirebaseConnection },
    { name: 'Service Availability', test: checkServiceAvailability }
  ];

  const results = await Promise.allSettled(
    checks.map(async (check) => ({
      name: check.name,
      passed: await check.test()
    }))
  );

  const failed = results
    .filter(result => result.status === 'fulfilled' && !result.value.passed)
    .map(result => result.status === 'fulfilled' ? result.value.name : 'Unknown');

  if (failed.length > 0) {
    console.error('❌ Production readiness failed:', failed);
    return false;
  }

  console.log('✅ Production readiness check passed');
  return true;
};

// Error boundary helper
export const createErrorBoundary = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    console.error(`❌ Error in ${componentName}:`, error);
    console.error('Error Info:', errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  };
};

// Graceful degradation helper
export const withFallback = async <T>(
  primaryFunction: () => Promise<T>,
  fallbackFunction: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await primaryFunction();
  } catch (error) {
    console.warn(`⚠️ ${errorMessage}, using fallback:`, error);
    return await fallbackFunction();
  }
};

// Network status check
export const checkNetworkStatus = () => {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true; // Assume online if can't detect
};

// Local storage availability check
export const checkLocalStorageAvailability = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Performance monitoring
export const measurePerformance = (label: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

// Deployment info
export const getDeploymentInfo = () => {
  return {
    environment: import.meta.env.MODE,
    buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    commit: import.meta.env.VITE_GIT_COMMIT || 'unknown'
  };
};

// Initialize deployment checks
export const initializeDeploymentChecks = async () => {
  if (import.meta.env.PROD) {
    console.log('🚀 Production deployment detected');
    console.log('📊 Deployment info:', getDeploymentInfo());
    
    const isReady = await checkProductionReadiness();
    
    if (!isReady) {
      console.error('❌ Production deployment has issues - some functionality may be limited');
    } else {
      console.log('✅ Production deployment is healthy');
    }
  }
};
