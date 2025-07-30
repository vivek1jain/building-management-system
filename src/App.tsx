import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import ComprehensiveDashboard from './pages/ComprehensiveDashboard'
import Tickets from './pages/Tickets'
import CreateTicket from './pages/CreateTicket'
import TicketDetail from './pages/TicketDetail'
import Suppliers from './pages/Suppliers'
import Events from './pages/Events'
import BudgetPage from './pages/Budget'
import Invoices from './pages/Invoices'
import Login from './pages/Login'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import NotificationList from './components/Notifications/NotificationList'
// Import new comprehensive feature pages
import FlatsPage from './pages/Flats'
import PeoplePage from './pages/People'
import ServiceChargesPage from './pages/ServiceCharges'
import WorkOrdersPage from './pages/WorkOrders'
import FinancialManagementPage from './pages/ServiceCharges' // Consolidated Financial Management

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
              <Route path="flats" element={<FlatsPage />} />
              <Route path="people" element={<PeoplePage />} />
              <Route path="service-charges" element={<FinancialManagementPage />} />
              <Route path="financial-management" element={<FinancialManagementPage />} />
              <Route path="work-orders" element={<WorkOrdersPage />} />
              
              {/* Existing Features */}
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/new" element={<CreateTicket />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="events" element={<Events />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="invoices" element={<Invoices />} />
            </Route>
          </Routes>
        </div>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App 