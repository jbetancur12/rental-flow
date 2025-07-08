import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { Layout } from './components/Layout/Layout';
import { ToastContainer } from './components/UI/ToastContainer';
import { ToastProvider } from './hooks/useToast';
import { SubscriptionGuard } from './components/Auth/SubscriptionGuard';
import { Suspense, lazy } from 'react';

// Importar los skeletons
import { PropertiesSkeleton } from './pages/Properties';
import { TenantsSkeleton } from './pages/Tenants';
import { SettingsSkeleton } from './pages/Settings';

// Code splitting para páginas principales
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Properties = lazy(() => import('./pages/Properties').then(m => ({ default: m.Properties })));
const Units = lazy(() => import('./pages/Units').then(m => ({ default: m.Units })));
const Tenants = lazy(() => import('./pages/Tenants').then(m => ({ default: m.Tenants })));
const Contracts = lazy(() => import('./pages/Contracts').then(m => ({ default: m.Contracts })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const Maintenance = lazy(() => import('./pages/Maintenance').then(m => ({ default: m.Maintenance })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Subscribe = lazy(() => import('./pages/Subscribe').then(m => ({ default: m.Subscribe })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const Help = lazy(() => import('./pages/Help'));


function AppRoutes() {
  const { state } = useAuth();
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-500">Cargando...</div>}>
      <Routes>
        <Route element={<SubscriptionGuard />}>
          {/* Rutas principales envueltas en el Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<Suspense fallback={<PropertiesSkeleton />}><Properties /></Suspense>} />
            <Route path="units" element={<Units />} />
            <Route path="tenants" element={<Suspense fallback={<TenantsSkeleton />}><Tenants /></Suspense>} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="payments" element={<Payments />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Suspense fallback={<SettingsSkeleton />}><Settings /></Suspense>} />
            <Route path="help" element={<Help />} />
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
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/subscribe" element={<Subscribe />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        {/* 2. AppProvider se mueve aquí para que su estado sea global y persistente */}
        <AppProvider>
          <Router>
            <AuthGuard fallback={<Suspense fallback={<div>Cargando...</div>}><Auth /></Suspense>}>
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