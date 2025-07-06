import { useMemo } from 'react';
import { OrganizationSummary, PaginationInfo } from '../../types';

interface BillingTabProps {
  organizations: OrganizationSummary[];
  pagination: PaginationInfo | null;
}

export function BillingTab({ organizations, pagination }: BillingTabProps) {
  const totalMRR = useMemo(() => 
    organizations.reduce((sum, org) => sum + org.mrr, 0), 
    [organizations]
  );
  
  const activeOrganizations = useMemo(() => 
    organizations.filter(org => org.status === 'ACTIVE').length, 
    [organizations]
  );
  
  const totalOrganizations = pagination?.total || 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Resumen de Facturación</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">${totalMRR.toLocaleString()}</p>
            <p className="text-slate-600">MRR Total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">${(totalMRR * 12).toLocaleString()}</p>
            <p className="text-slate-600">ARR Proyectado</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">${Math.round(totalMRR / activeOrganizations)}</p>
            <p className="text-slate-600">ARPU</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Plan</h3>
        <div className="space-y-4">
          {['Básico', 'Profesional', 'Empresarial'].map((plan) => {
            const count = organizations.filter(org => org.plan === plan).length;
            const percentage = Math.round((count / totalOrganizations) * 100);
            return (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-slate-700">{plan}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600 w-12">{count} ({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}