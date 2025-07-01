import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { Layout } from './components/Layout/Layout';
import { Auth } from './pages/Auth';
import { SuperAdmin } from './pages/SuperAdmin';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Units } from './pages/Units';
import { Tenants } from './pages/Tenants';
import { Contracts } from './pages/Contracts';
import { Payments } from './pages/Payments';
import { Maintenance } from './pages/Maintenance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ToastContainer } from './components/UI/ToastContainer';
import { ToastProvider } from './hooks/useToast';

// Component to handle routing based on user role
function AppRoutes() {
  const { state } = useAuth();

  // If user is super admin, redirect to super admin panel
  if (state.isAuthenticated && state.user?.role === 'super_admin') {
    return (
      <Routes>
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Routes>
    );
  }

  // Regular user routes
  return (
    <Routes>
      {/* Super Admin Route - only accessible by super admins */}
      <Route 
        path="/super-admin" 
        element={
          state.user?.role === 'super_admin' ? 
            <SuperAdmin /> : 
            <Navigate to="/" replace />
        } 
      />
      
      {/* Regular App Routes */}
      <Route path="/" element={
        <AppProvider>
          <Layout />
        </AppProvider>
      }>
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="units" element={<Units />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="payments" element={<Payments />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <AuthGuard fallback={<Auth />}>
          <AppRoutes />
          <ToastContainer />
        </AuthGuard>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;