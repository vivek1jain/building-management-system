import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 650, // Firebase SDK is ~631KB, set limit just above
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor'
            }
            // Firebase SDK
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase'
            }
            // Charts and data visualization
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts'
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils'
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('headlessui') || id.includes('lucide-react')) {
              return 'ui-libs'
            }
            // Other node_modules
            return 'vendor-misc'
          }
        },
      },
      onwarn(warning, warn) {
        // Suppress TypeScript warnings during build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    }
  },
  server: {
    port: 3003,
    open: true,
  },
})