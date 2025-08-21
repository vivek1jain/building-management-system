import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { BuildingProvider } from './contexts/BuildingContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CreateTicketProvider } from './contexts/CreateTicketContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import ComprehensiveDashboard from './pages/ComprehensiveDashboard'
import CreateTicket from './pages/CreateTicket'
import TicketDetail from './pages/TicketDetail'
import Suppliers from './pages/Suppliers'
import Events from './pages/Events'
import Login from './pages/Login'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import NotificationList from './components/Notifications/NotificationList'
// Import new comprehensive feature pages
import BuildingDataManagement from './pages/BuildingDataManagement'
import ServiceChargesPage from './pages/ServiceCharges'
import TicketsWorkOrders from './pages/TicketsWorkOrders'
import Finances from './pages/Finances' // Unified Financial Management
import Settings from './pages/Settings'
import DensityTest from './components/DensityTest'
import './utils/testPermissions' // Load test functions for development

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
              <Route path="comprehensive" element={<ComprehensiveDashboard />} />
              
              {/* New Comprehensive Features */}
              <Route path="building-data" element={<BuildingDataManagement />} />
              <Route path="finances" element={<Finances />} />
              
              {/* Unified Tickets & Work Orders */}
              <Route path="tickets" element={<TicketsWorkOrders />} />
              <Route path="work-orders" element={<TicketsWorkOrders />} />
              <Route path="tickets/new" element={<CreateTicket />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="events" element={<Events />} />
              <Route path="settings" element={<Settings />} />
              <Route path="density-test" element={<DensityTest />} />
              {/* Legacy routes - redirect to unified finances */}
              <Route path="budget" element={<Finances />} />
              <Route path="invoices" element={<Finances />} />
              <Route path="service-charges" element={<Finances />} />
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