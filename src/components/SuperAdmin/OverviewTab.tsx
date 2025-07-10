// components/SuperAdmin/OverviewTab.tsx
import { useMemo } from 'react';
import { DollarSign, Building2, CheckCircle, TrendingUp } from 'lucide-react';
import { KPICard } from './KPICard';
import { OrganizationSummary, PaginationInfo } from '../../types';

interface OverviewTabProps {
  organizations: OrganizationSummary[];
  pagination: PaginationInfo | null;
}

export function OverviewTab({ organizations, pagination }: OverviewTabProps) {
  const totalMRR = useMemo(() => 
    organizations.reduce((sum, org) => sum + org.mrr, 0), 
    [organizations]
  );
  
  const activeOrganizations = useMemo(() => 
    organizations.filter(org => org.status === 'ACTIVE').length, 
    [organizations]
  );
  
  const trialingOrganizations = useMemo(() => 
    organizations.filter(org => org.status === 'TRIALING').length, 
    [organizations]
  );
  
  const totalOrganizations = pagination?.total || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Ingresos Mensuales"
          value={`$${totalMRR.toLocaleString()}`}
          subtitle="+12% vs mes anterior"
          icon={DollarSign}
          color="emerald"
        />
        <KPICard
          title="Organizaciones"
          value={totalOrganizations}
          subtitle="+3 este mes"
          icon={Building2}
          color="blue"
        />
        <KPICard
          title="Clientes Activos"
          value={activeOrganizations}
          subtitle={`${Math.round((activeOrganizations / totalOrganizations) * 100)}% conversión`}
          icon={CheckCircle}
          color="purple"
        />
        <KPICard
          title="En Prueba"
          value={trialingOrganizations}
          subtitle={`Potencial: $${trialingOrganizations * 79}`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Organizaciones Recientes</h3>
          <div className="space-y-4">
            {organizations.slice(0, 5).map((org) => (
              <div key={org.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{org.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{org.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{org.plan}</p>
                  <p className={`text-xs ${org.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}> {/* color para dark */}
                    {org.status === 'ACTIVE' ? 'Activo' : 'Prueba'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas de Crecimiento</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tasa de Conversión</span>
              <span className="font-semibold text-slate-900">75%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Churn Rate</span>
              <span className="font-semibold text-slate-900">2.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">LTV/CAC</span>
              <span className="font-semibold text-slate-900">4.2x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">ARR</span>
              <span className="font-semibold text-slate-900">${(totalMRR * 12).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}