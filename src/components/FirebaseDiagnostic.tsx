import { useState, useEffect } from 'react'
import { auth, db } from '../firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'

const FirebaseDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const results: string[] = []
    
    try {
      // Check Firebase config
      results.push('🔍 Firebase Configuration:')
      results.push(`  Project ID: proper-213b7`)
      results.push(`  Auth Domain: proper-213b7.firebaseapp.com`)
      results.push(`  API Key: ${auth.app.options.apiKey ? '✅ Present' : '❌ Missing'}`)
      
      // Check if we're in development mode
      results.push(`  Environment: ${import.meta.env.DEV ? 'Development' : 'Production'}`)
      
      // Test basic Firebase initialization
      results.push('')
      results.push('🔍 Firebase Services:')
      results.push(`  Auth: ${auth ? '✅ Initialized' : '❌ Failed'}`)
      results.push(`  Firestore: ${db ? '✅ Initialized' : '❌ Failed'}`)
      
      // Test authentication
      results.push('')
      results.push('🔍 Authentication Test:')
      try {
        const userCredential = await signInAnonymously(auth)
        results.push(`  Anonymous Auth: ✅ Success (UID: ${userCredential.user.uid})`)
      } catch (error: any) {
        results.push(`  Anonymous Auth: ❌ ${error.message}`)
        if (error.code) {
          results.push(`    Error Code: ${error.code}`)
        }
      }
      
      // Test Firestore with simple operation
      results.push('')
      results.push('🔍 Firestore Test:')
      try {
        const testDoc = doc(db, 'diagnostic', 'test')
        await setDoc(testDoc, { 
          timestamp: new Date().toISOString(),
          test: true 
        })
        results.push('  Write: ✅ Success')
        
        const docSnap = await getDoc(testDoc)
        if (docSnap.exists()) {
          results.push('  Read: ✅ Success')
        } else {
          results.push('  Read: ⚠️ Document not found')
        }
      } catch (error: any) {
        results.push(`  Firestore: ❌ ${error.message}`)
        if (error.code) {
          results.push(`    Error Code: ${error.code}`)
        }
      }
      
      // Network connectivity check
      results.push('')
      results.push('🔍 Network Connectivity:')
      try {
        await fetch('https://firestore.googleapis.com', { 
          method: 'HEAD',
          mode: 'no-cors'
        })
        results.push('  Firestore API: ✅ Reachable')
      } catch (error: any) {
        results.push('  Firestore API: ❌ Not reachable')
      }
      
    } catch (error: any) {
      results.push(`❌ Diagnostic Error: ${error.message}`)
    }
    
    setDiagnostics(results)
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-lg shadow-lg z-50 text-xs"
      >
        🔧 Firebase Diagnostic
      </button>
      
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 max-w-md max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Firebase Diagnostic</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="text-xs space-y-1 font-mono">
            {diagnostics.map((line, index) => (
              <div key={index} className={line.startsWith('❌') ? 'text-red-600' : 
                                         line.startsWith('✅') ? 'text-green-600' : 
                                         line.startsWith('⚠️') ? 'text-yellow-600' : 
                                         line.startsWith('🔍') ? 'text-blue-600 font-semibold' : 
                                         'text-gray-700'}>
                {line}
              </div>
            ))}
          </div>
          
          <button
            onClick={runDiagnostics}
            className="text-xs text-blue-600 hover:text-blue-800 mt-2"
          >
            Run Diagnostics Again
          </button>
        </div>
      )}
    </>
  )
}

export default FirebaseDiagnostic 