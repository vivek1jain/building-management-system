import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Layout from './components/Layout/Layout'
import NotificationList from './components/Notifications/NotificationList'
import { PageLoading } from './components/UI'
import { AuthProvider } from './contexts/AuthContext'
import { BuildingProvider } from './contexts/BuildingContext'
import { CreateTicketProvider } from './contexts/CreateTicketContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './utils/testPermissions' // Load test functions for development

// Eager load critical pages
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

// Lazy load secondary pages for better initial load performance
const ComprehensiveDashboard = lazy(() => import('./pages/ComprehensiveDashboard'))
const CreateTicket = lazy(() => import('./pages/CreateTicket'))
const TicketDetail = lazy(() => import('./pages/TicketDetail'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Events = lazy(() => import('./pages/Events'))
const BuildingDataManagement = lazy(() => import('./pages/BuildingDataManagement'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Finances = lazy(() => import('./pages/Finances'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const Admin = lazy(() => import('./pages/Admin'))
const MobileMoreMenu = lazy(() => import('./components/Layout/MobileMoreMenu'))
const DensityTest = lazy(() => import('./components/DensityTest'))

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BuildingProvider>
            <CreateTicketProvider>
          <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
            <NotificationList />
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="comprehensive" element={
                <Suspense fallback={<PageLoading message="Loading dashboard..." />}>
                  <ComprehensiveDashboard />
                </Suspense>
              } />
              
              {/* New Comprehensive Features */}
              <Route path="building-data" element={
                <Suspense fallback={<PageLoading message="Loading building data..." />}>
                  <BuildingDataManagement />
                </Suspense>
              } />
              <Route path="finances" element={
                <Suspense fallback={<PageLoading message="Loading finances..." />}>
                  <Finances />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<PageLoading message="Loading reports..." />}>
                  <Reports />
                </Suspense>
              } />
              
              {/* Unified Tickets & Work Orders */}
              <Route path="tickets" element={
                <Suspense fallback={<PageLoading message="Loading tickets..." />}>
                  <Tickets />
                </Suspense>
              } />
              <Route path="work-orders" element={
                <Suspense fallback={<PageLoading message="Loading tickets..." />}>
                  <Tickets />
                </Suspense>
              } />
              <Route path="tickets/new" element={
                <Suspense fallback={<PageLoading message="Creating ticket..." />}>
                  <CreateTicket />
                </Suspense>
              } />
              <Route path="tickets/:id" element={
                <Suspense fallback={<PageLoading message="Loading ticket..." />}>
                  <TicketDetail />
                </Suspense>
              } />
              <Route path="suppliers" element={
                <Suspense fallback={<PageLoading message="Loading suppliers..." />}>
                  <Suppliers />
                </Suspense>
              } />
              <Route path="events" element={
                <Suspense fallback={<PageLoading message="Loading events..." />}>
                  <Events />
                </Suspense>
              } />
              <Route path="more" element={
                <Suspense fallback={<PageLoading message="Loading..." />}>
                  <MobileMoreMenu />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<PageLoading message="Loading settings..." />}>
                  <Settings />
                </Suspense>
              } />
              <Route path="admin" element={
                <Suspense fallback={<PageLoading message="Loading admin..." />}>
                  <Admin />
                </Suspense>
              } />
              <Route path="density-test" element={
                <Suspense fallback={<PageLoading message="Loading..." />}>
                  <DensityTest />
                </Suspense>
              } />
              {/* Legacy routes - redirect to unified finances */}
              <Route path="budget" element={
                <Suspense fallback={<PageLoading message="Loading finances..." />}>
                  <Finances />
                </Suspense>
              } />
              <Route path="invoices" element={
                <Suspense fallback={<PageLoading message="Loading finances..." />}>
                  <Finances />
                </Suspense>
              } />
              <Route path="service-charges" element={
                <Suspense fallback={<PageLoading message="Loading finances..." />}>
                  <Finances />
                </Suspense>
              } />
            </Route>
            </Routes>
          </div>
            </CreateTicketProvider>
          </BuildingProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 