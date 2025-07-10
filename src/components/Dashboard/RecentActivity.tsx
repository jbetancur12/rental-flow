import { useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { DollarSign, User, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function RecentActivity() {
  // 1. Obtenemos el estado global de la aplicación desde Zustand
  const { payments, tenants, maintenanceRequests, properties, contracts } = useApp();

  // 2. Usamos useMemo para calcular la lista de actividades solo cuando los datos cambien
  const recentActivities = useMemo(() => {
    // 3. Transformamos los pagos en un formato de "actividad"
    const paymentActivities = payments.filter(p => p.status === 'PAID').map(payment => {
      const tenant = tenants.find(t => t.id === payment.tenantId);
      return {
        id: `payment-${payment.id}`,
        type: 'payment',
        description: `Pago de $${payment.amount.toLocaleString()} recibido de ${tenant?.firstName || 'un inquilino'}`,
        date: new Date(payment.paidDate || payment.createdAt as Date), // Usamos la fecha de pago o creación
        icon: DollarSign,
        iconColor: 'text-emerald-600',
      };
    });

    // 4. Transformamos las solicitudes de mantenimiento en "actividades"
    const maintenanceActivities = maintenanceRequests.map(request => {
      const property = properties.find(p => p.id === request.propertyId);
      return {
        id: `maint-${request.id}`,
        type: 'maintenance',
        description: `Nueva solicitud: ${request.title} para ${property?.name || 'una propiedad'}`,
        date: new Date(request.reportedDate),
        icon: Wrench,
        iconColor: 'text-orange-600',
      };
    });

    // Puedes añadir más tipos de actividades aquí (nuevos inquilinos, contratos, etc.)
    const tenantActivities = tenants.map(tenant => ({
        id: `tenant-${tenant.id}`,
        type: 'tenant',
        description: `Nuevo inquilino registrado: ${tenant.firstName} ${tenant.lastName}`,
        date: new Date(tenant.createdAt as Date),
        icon: User,
        iconColor: 'text-blue-600'
    }))

    const contractActivities = contracts.map(contract => ({
        id: `contract-${contract.id}`,
        type: 'contract',
        description: `Nuevo contrato registrado: ${contract.id}`,
        date: new Date(contract.createdAt as Date),
        icon: User,
        iconColor: 'text-blue-600'
    }))


    // 5. Unimos todas las actividades, las ordenamos por fecha (más reciente primero) y tomamos las últimas 5
    const allActivities = [...paymentActivities, ...maintenanceActivities, ...tenantActivities, ...contractActivities];
    
    allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return allActivities.slice(0, 5);

  }, [payments, maintenanceRequests, tenants, properties, contracts]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Actividad Reciente</h3>
      <div className="space-y-4">
        {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 ${activity.iconColor}`}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-slate-100">{activity.description}</p>
                {/* 6. Usamos date-fns para mostrar el tiempo relativo */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatDistanceToNow(activity.date, { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No hay actividad reciente.</p>
        )}
      </div>
    </div>
  );
}