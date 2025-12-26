import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'

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
            <Route path="data" element={<div>Data Management - Coming soon</div>} />
            <Route path="questions" element={<div>Questions - Coming soon</div>} />
            <Route path="reports" element={<div>Reports - Coming soon</div>} />
          </Route>

          {/* Auditor routes - placeholder for now */}
          <Route
            path="/auditor"
            element={
              <ProtectedRoute>
                <AuditorPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* Root redirect based on role */}
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AuditorPlaceholder() {
  const { signOut } = useAuth()
  return (
    <div style={{ padding: '20px' }}>
      <h1>Auditor Dashboard</h1>
      <p>Coming soon...</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
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
