
import { Clock, DollarSign, Home, Wrench } from 'lucide-react';

const recentActivities = [
  {
    id: '1',
    type: 'payment',
    description: 'Pago de alquiler recibido de Alice Johnson',
    time: 'hace 2 horas',
    icon: DollarSign,
    iconColor: 'text-emerald-600'
  },
  {
    id: '2',
    type: 'maintenance',
    description: 'Nueva solicitud de mantenimiento para Apartamento 2A',
    time: 'hace 4 horas',
    icon: Wrench,
    iconColor: 'text-orange-600'
  },
  {
    id: '3',
    type: 'property',
    description: 'Apartamento 3B marcado como disponible',
    time: 'hace 1 día',
    icon: Home,
    iconColor: 'text-blue-600'
  },
  {
    id: '4',
    type: 'contract',
    description: 'Recordatorio de renovación de contrato enviado',
    time: 'hace 2 días',
    icon: Clock,
    iconColor: 'text-purple-600'
  }
];

export function RecentActivity() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Actividad Reciente</h3>
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-slate-50 ${activity.iconColor}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900">{activity.description}</p>
              <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}