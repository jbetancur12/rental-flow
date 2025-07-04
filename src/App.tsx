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
import { Subscribe } from './pages/Subscribe';
import { SubscriptionGuard } from './components/Auth/SubscriptionGuard';

// 1. Lógica de rutas unificada y más limpia
function AppRoutes() {
  const { state } = useAuth();

  return (
    <Routes>
      <Route element={<SubscriptionGuard />}>
      {/* Rutas principales envueltas en el Layout */}
      <Route path="/" element={<Layout />}>
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

      {/* Ruta específica para el Super Admin, protegida individualmente */}
      <Route
        path="/super-admin"
        element={
          state.user?.role === 'SUPER_ADMIN' 
            ? <SuperAdmin /> 
            : <Navigate to="/" replace />
        }
      />

      {/* Redirección para cualquier otra ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
       <Route path="/subscribe" element={<Subscribe />} />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        {/* 2. AppProvider se mueve aquí para que su estado sea global y persistente */}
        <AppProvider>
          <Router>
            <AuthGuard fallback={<Auth />}>
              <AppRoutes />
            </AuthGuard>
            <ToastContainer />
          </Router>
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;