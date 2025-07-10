
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SubscriptionBanner } from './SubscriptionBanner';
import { Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { useEffect } from 'react';
import { useToast } from '../../hooks/useToast';

function useSubscriptionBannerVisible() {
  const { state } = useAuth();
  const { subscription } = state;
  return useMemo(() => {
    if (!subscription) return false;
    if (subscription.status === 'DEMO') return true;
    const isTrialExpired = subscription.trialEnd && new Date(subscription.trialEnd) < new Date();
    if (subscription.status === 'TRIALING' && !isTrialExpired) return true;
    if (subscription.status === 'PAST_DUE' || (subscription.status === 'TRIALING' && isTrialExpired)) return true;
    return false;
  }, [subscription]);
}

export function Layout() {
  const { loadUnits, loadProperties, loadPayments, loadContracts, getTenants, loadMaintenanceRequests, initSocket } = useApp();
  const { state } = useAuth();
  const toast = useToast();
  useEffect(() => {
    // Carga global de datos al montar el layout principal
    loadUnits();
    loadProperties();
    loadPayments();
    loadContracts();
    getTenants();
    loadMaintenanceRequests();
    // Inicializar socket.io para la organización
    if (state.organization?.id) {
      initSocket(state.organization.id);
    }
  }, [loadUnits, loadProperties, loadPayments, loadContracts, getTenants, loadMaintenanceRequests, state.organization?.id, initSocket]);

  // Listeners de socket para toasts globales
  useEffect(() => {
    if (!window || !state.organization?.id) return;
    // @ts-expect-error to show in the console
    const socket = window.__rentflow_socket;
    if (!socket) return;
    // Helper para evitar mostrar toast si el cambio lo hizo el propio usuario
    const isOwnChange = (payload: { userId?: string }) => {
      if (!payload || !payload.userId || !state.user) return false;
      return payload.userId === state.user.id;
    };
    // --- PROPIEDADES ---
    const onPropertyCreated = ({ property, userId, userName }: { property: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Nueva propiedad', `${userName || 'Otro usuario'} agregó "${property.name}".`);
    };
    const onPropertyUpdated = ({ property, userId, userName }: { property: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Propiedad actualizada', `${userName || 'Otro usuario'} actualizó "${property.name}".`);
    };
    const onPropertyDeleted = ({  userId, userName }: { propertyId: string; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Propiedad eliminada', `${userName || 'Otro usuario'} eliminó una propiedad.`);
    };
    // --- UNIDADES ---
    const onUnitCreated = ({ unit, userId, userName }: { unit: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Nueva unidad', `${userName || 'Otro usuario'} agregó "${unit.name}".`);
    };
    const onUnitUpdated = ({ unit, userId, userName }: { unit: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Unidad actualizada', `${userName || 'Otro usuario'} actualizó "${unit.name}".`);
    };
    const onUnitDeleted = ({  userId, userName }: { unitId: string; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Unidad eliminada', `${userName || 'Otro usuario'} eliminó una unidad.`);
    };
    // --- INQUILINOS ---
    const onTenantCreated = ({ tenant, userId, userName }: { tenant: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Nuevo inquilino', `${userName || 'Otro usuario'} agregó "${tenant.firstName} ${tenant.lastName}".`);
    };
    const onTenantUpdated = ({ tenant, userId, userName }: { tenant: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Inquilino actualizado', `${userName || 'Otro usuario'} actualizó "${tenant.firstName} ${tenant.lastName}".`);
    };
    const onTenantDeleted = ({  userId, userName }: { tenantId: string; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Inquilino eliminado', `${userName || 'Otro usuario'} eliminó un inquilino.`);
    };
    // --- CONTRATOS ---
    const onContractCreated = ({ contract, userId, userName }: { contract: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Nuevo contrato', `${userName || 'Otro usuario'} creó un contrato para la propiedad "${contract.property?.name || ''}".`);
    };
    const onContractUpdated = ({  userId, userName }: { contract: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Contrato actualizado', `${userName || 'Otro usuario'} actualizó un contrato.`);
    };
    const onContractDeleted = ({  userId, userName }: { contractId: string; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Contrato eliminado', `${userName || 'Otro usuario'} eliminó un contrato.`);
    };
    // --- PAGOS ---
    const onPaymentCreated = ({ payment, userId, userName }: { payment: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Nuevo pago', `${userName || 'Otro usuario'} registró un pago de $${payment.amount?.toLocaleString()}.`);
    };
    const onPaymentUpdated = ({  userId, userName }: { payment: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Pago actualizado', `${userName || 'Otro usuario'} actualizó un pago.`);
    };
    const onPaymentDeleted = ({  userId, userName }: { paymentId: string; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Pago eliminado', `${userName || 'Otro usuario'} eliminó un pago.`);
    };
    // --- MANTENIMIENTO ---
    const onMaintenanceCreated = ({ maintenance, userId, userName }: { maintenance: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Nueva solicitud de mantenimiento', `${userName || 'Otro usuario'} creó una solicitud: "${maintenance.title}".`);
    };
    const onMaintenanceUpdated = ({ maintenance, userId, userName }: { maintenance: any; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Mantenimiento actualizado', `${userName || 'Otro usuario'} actualizó una solicitud: "${maintenance.title}".`);
    };
    const onMaintenanceDeleted = ({  userId, userName }: { maintenanceId: string; userId?: string; userName?: string }) => {
      if (!isOwnChange({ userId })) toast.info('Mantenimiento eliminado', `${userName || 'Otro usuario'} eliminó una solicitud de mantenimiento.`);
    };
    // Registrar listeners
    socket.on('property:created', onPropertyCreated);
    socket.on('property:updated', onPropertyUpdated);
    socket.on('property:deleted', onPropertyDeleted);
    socket.on('unit:created', onUnitCreated);
    socket.on('unit:updated', onUnitUpdated);
    socket.on('unit:deleted', onUnitDeleted);
    socket.on('tenant:created', onTenantCreated);
    socket.on('tenant:updated', onTenantUpdated);
    socket.on('tenant:deleted', onTenantDeleted);
    socket.on('contract:created', onContractCreated);
    socket.on('contract:updated', onContractUpdated);
    socket.on('contract:deleted', onContractDeleted);
    socket.on('payment:created', onPaymentCreated);
    socket.on('payment:updated', onPaymentUpdated);
    socket.on('payment:deleted', onPaymentDeleted);
    socket.on('maintenance:created', onMaintenanceCreated);
    socket.on('maintenance:updated', onMaintenanceUpdated);
    socket.on('maintenance:deleted', onMaintenanceDeleted);
    return () => {
      if (!socket) return;
      socket.off('property:created', onPropertyCreated);
      socket.off('property:updated', onPropertyUpdated);
      socket.off('property:deleted', onPropertyDeleted);
      socket.off('unit:created', onUnitCreated);
      socket.off('unit:updated', onUnitUpdated);
      socket.off('unit:deleted', onUnitDeleted);
      socket.off('tenant:created', onTenantCreated);
      socket.off('tenant:updated', onTenantUpdated);
      socket.off('tenant:deleted', onTenantDeleted);
      socket.off('contract:created', onContractCreated);
      socket.off('contract:updated', onContractUpdated);
      socket.off('contract:deleted', onContractDeleted);
      socket.off('payment:created', onPaymentCreated);
      socket.off('payment:updated', onPaymentUpdated);
      socket.off('payment:deleted', onPaymentDeleted);
      socket.off('maintenance:created', onMaintenanceCreated);
      socket.off('maintenance:updated', onMaintenanceUpdated);
      socket.off('maintenance:deleted', onMaintenanceDeleted);
    };
  }, [state.organization?.id, state.user, toast]);
  const bannerVisible = useSubscriptionBannerVisible();
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col overflow-hidden ${bannerVisible ? 'pt-0 md:pt0' : ''} bg-white dark:bg-slate-900`}
      >
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-200">Cargando...</div>}>
          <SubscriptionBanner />
          <div className="px-8 overflow-auto">
            <Outlet />
          </div>
        </Suspense>
      </div>
    </div>
  );
}