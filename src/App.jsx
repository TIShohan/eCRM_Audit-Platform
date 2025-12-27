import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import DataManagement from './pages/admin/DataManagement'
import DataList from './pages/admin/DataList'
import QuestionManagement from './pages/admin/QuestionManagement'
import Reports from './pages/admin/Reports'
import AuditorLayout from './pages/auditor/AuditorLayout'
import AuditorDashboard from './pages/auditor/AuditorDashboard'
import AuditInterface from './pages/auditor/AuditInterface'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="data" element={<DataList />} />
            <Route path="data/upload" element={<DataManagement />} />
            <Route path="questions" element={<QuestionManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Auditor routes */}
          <Route
            path="/auditor"
            element={
              <ProtectedRoute>
                <AuditorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AuditorDashboard />} />
            <Route path="audit" element={<AuditInterface />} />
          </Route>

          {/* Root redirect based on role */}
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}



function RootRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/auditor" replace />
}

export default App
