import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function SubscriptionGuard() {
  const { state } = useAuth();

  // Si la suscripción no está activa, redirige a la página de planes.
  if (!state.isSubscriptionActive) {
    return <Navigate to="/subscribe" replace />;
  }

  // Si está activa, muestra el contenido de la aplicación (el Layout).
  return <Outlet />;
}