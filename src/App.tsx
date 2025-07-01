import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import CreateTicket from './pages/CreateTicket'
import TicketDetail from './pages/TicketDetail'
import Suppliers from './pages/Suppliers'
import Events from './pages/Events'
import Login from './pages/Login'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import NotificationList from './components/Notifications/NotificationList'
import TestFirebase from './components/TestFirebase'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
          <NotificationList />
          <TestFirebase />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/new" element={<CreateTicket />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="events" element={<Events />} />
            </Route>
          </Routes>
        </div>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App 