import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
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

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
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
              {/* Legacy routes - redirect to unified finances */}
              <Route path="budget" element={<Finances />} />
              <Route path="invoices" element={<Finances />} />
              <Route path="service-charges" element={<Finances />} />
            </Route>
          </Routes>
        </div>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App 