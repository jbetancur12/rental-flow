import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/useApp';
import { useToast } from '../hooks/useToast';
import { OrganizationSummary, PaginationInfo, Plan } from '../types';
import apiClient from '../config/api';

// Components
import { SuperAdminHeader } from '../components/SuperAdmin/SuperAdminHeader';
import { SuperAdminTabs } from '../components/SuperAdmin/SuperAdminTabs';
import { OverviewTab } from '../components/SuperAdmin/OverviewTab';
import { OrganizationsTab } from '../components/SuperAdmin/OrganizationsTab';
import { BillingTab } from '../components/SuperAdmin/BillingTab';

import { AccessDenied } from '../components/SuperAdmin/AccessDenied';
import { SettingsTab } from '../components/SuperAdmin/SettingsTab';

export function SuperAdmin() {
  const { state, logout } = useAuth();
  const { getPlans, updatePlans, createPlan, deletePlan, enablePlan } = useApp();
  const toast = useToast();

  // State
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organizations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [plansLoaded, setPlansLoaded] = useState(false);

  // Fetch functions
  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      };
      const response = await apiClient.getSuperAdminOrganizations(params);
      setOrganizations(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudieron cargar las organizaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, toast]);

  const fetchPlans = useCallback(async (force = false) => {
    if (plansLoaded && !force) return;
    setIsLoading(true);
    try {
      const loadedPlans = await getPlans();
      setPlans(loadedPlans);
      setPlansLoaded(true);
    } catch {
      toast.error('Error', 'No se pudieron cargar los planes.');
    } finally {
      setIsLoading(false);
    }
  }, [getPlans, toast, plansLoaded]);

  // Effects
  useEffect(() => {
    if (state.user?.role === 'SUPER_ADMIN') {
      if (activeTab === 'organizations') {
        fetchOrganizations();
      } else if (activeTab === 'settings') {
        fetchPlans();
      }
    }
  }, [state.user, activeTab, fetchOrganizations, fetchPlans]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePlanSave = async (planData: Plan) => {
    try {
      if (planData.createdAt) {
        await updatePlans([planData]);
      } else {
        await createPlan(planData);
      }
      await fetchPlans(true); // Forzar recarga después de guardar
    } catch (error) {
      console.error("Failed to save plan", error);
    }
  };

  const handlePlanDelete = async (planId: string) => {
    try {
      await deletePlan(planId);
      await fetchPlans(true);
      toast.success('Plan deshabilitado');
    } catch (error) {
      toast.error('Error', 'No se pudo deshabilitar el plan.');
    }
  };

  const handlePlanEnable = async (planId: string) => {
    try {
      await enablePlan(planId);
      await fetchPlans(true);
      toast.success('Plan habilitado');
    } catch (error) {
      toast.error('Error', 'No se pudo habilitar el plan.');
    }
  };

  // Check if user is super admin
  if (state.user?.role !== 'SUPER_ADMIN') {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SuperAdminHeader user={state.user} onLogout={logout} />
      
      <SuperAdminTabs activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab === 'settings' && !plansLoaded) {
          setPlansLoaded(false); // Permitir recarga si nunca se cargó
        }
      }} />

      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            organizations={organizations} 
            pagination={pagination} 
          />
        )}

        {activeTab === 'organizations' && (
          <OrganizationsTab
            organizations={organizations}
            isLoading={isLoading}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab 
            organizations={organizations}
            pagination={pagination}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            plans={plans}
            isLoading={isLoading}
            onPlanSave={handlePlanSave}
            onRefreshPlans={fetchPlans}
            onPlanDelete={handlePlanDelete}
            onPlanEnable={handlePlanEnable}
          />
        )}
      </div>
    </div>
  );
}