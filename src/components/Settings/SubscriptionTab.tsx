import { Crown } from 'lucide-react';

export function SubscriptionTab({ authState, properties, tenants, isAdmin, handleOpenUpgradeModal }: any) {
  const statusDetails = {
    ACTIVE: { text: 'Activo', color: 'text-emerald-600' },
    TRIALING: { text: 'Prueba', color: 'text-blue-600' },
    DEMO: { text: 'Demostración', color: 'text-purple-600' },
    PAST_DUE: { text: 'Vencido', color: 'text-red-600' },
    CANCELED: { text: 'Cancelado', color: 'text-slate-600' },
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Plan de Suscripción</h3>
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-slate-600">
              {(() => {
                switch (authState.subscription.status) {
                  case 'TRIALING': return 'Prueba Gratuita';
                  case 'DEMO': return 'Cuenta de Demostración';
                  case 'ACTIVE': return 'Plan Activo';
                  default: return 'Inactivo';
                }
              })()}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-500">Plan Actual</label>
              <p className="text-lg font-semibold text-slate-900">
                {authState.subscription.planId === 'plan-basic' ? 'Básico' : authState.subscription.planId === 'plan-professional' ? 'Profesional' : 'Empresarial'}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-500">Estado</label>
              {(() => {
                const currentStatus = authState.subscription.status as keyof typeof statusDetails;
                const details = statusDetails[currentStatus] || { text: 'Desconocido', color: 'text-slate-500' };
                return <p className={`text-lg font-semibold ${details.color}`}>{details.text}</p>;
              })()}
            </div>
            <div>
              <label className="text-sm text-slate-500">Próxima Facturación</label>
              <p className="text-lg font-semibold text-slate-900">
                {authState.subscription.currentPeriodEnd.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-500">Límites del Plan</label>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Propiedades:</span>
                  <span>{properties.length} / {authState.organization?.settings.limits.maxProperties}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Inquilinos:</span>
                  <span>{tenants.length} / {authState.organization?.settings.limits.maxTenants}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Usuarios:</span>
                  <span>1 / {authState.organization?.settings.limits.maxUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {authState.subscription.status !== "DEMO" && (
          <div className="mt-6 flex space-x-4">
            <button
              onClick={isAdmin ? handleOpenUpgradeModal : undefined}
              className={`px-4 py-2 rounded-lg ${isAdmin ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              disabled={!isAdmin}
              title={!isAdmin ? 'Solo un administrador puede actualizar el plan' : ''}
            >
              Actualizar Plan
            </button>
            <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
              Ver Historial de Facturación
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 