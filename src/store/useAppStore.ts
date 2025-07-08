import { create } from 'zustand';
import { Property, Tenant, Contract, Payment, MaintenanceRequest, Building, Unit, Plan } from '../types';
import { Organization } from '../types/auth';
import { apiClient } from '../config/api';
import { formatDateInUTC } from '../utils/formatDate';

interface AppState {
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  buildings: Building[];
  units: Unit[];
  isLoading: boolean;
  organization?: Organization;
}

type AppStore = AppState & {
  // Métodos
  setLoading: (loading: boolean) => void;
  loadProperties: () => Promise<void>;
  loadUnits: () => Promise<void>;
  createProperty: (data: any) => Promise<void>;
  updateProperty: (id: string, data: any) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  createUnit: (data: any) => Promise<void>;
  updateUnit: (id: string, data: any) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  getTenants: () => Promise<void>;
  createTenant: (data: any) => Promise<void>;
  updateTenant: (id: string, data: any) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  loadContracts: () => Promise<void>;
  createContract: (data: any) => Promise<void>;
  updateContract: (id: string, data: any) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  createPayment: (data: any) => Promise<void>;
  loadPayments: () => Promise<void>;
  updatePayment: (id: string, data: any) => Promise<void>;
  updatePaymentStatus: (id: string, status: 'CANCELLED' | 'REFUNDED') => Promise<void>;
  loadMaintenanceRequests: () => Promise<void>;
  createMaintenanceRequest: (data: any) => Promise<void>;
  updateMaintenanceRequest: (id: string, data: any) => Promise<void>;
  asignMaintenanceTechinician: (id: string, asignTo: any) => Promise<void>;
  markMaintenanceAsComplete: (id: string, data: any) => Promise<void>;
  updateOrganization: (orgId: string, data: any) => Promise<void>;
  getPlans: () => Promise<Plan[]>;
  updatePlans: (plans: Plan[]) => Promise<void>;
  createPlan: (planData: Omit<Plan, 'id' | 'isActive' | 'currency' | 'features'>) => Promise<Plan>;
};

const initialState: AppState = {
  properties: [],
  tenants: [],
  contracts: [],
  payments: [],
  maintenanceRequests: [],
  buildings: [],
  units: [],
  isLoading: false,
};

export const useAppStore = create<AppStore>((set) => {
  // NOTA: useToast solo puede usarse dentro de un componente, así que deberás pasar el toast como prop o usarlo en los métodos desde los componentes.
  // Aquí se asume que los métodos de notificación se llamarán desde los componentes tras cada acción.
  return {
    ...initialState,
    setLoading: (loading) => set({ isLoading: loading }),
    loadProperties: async () => {
      set({ isLoading: true });
      const response = await apiClient.getProperties();
      const properties = response.properties.map((prop: any) => ({
        ...prop,
        createdAt: new Date(prop.createdAt),
        updatedAt: new Date(prop.updatedAt),
      }));
      set({ properties, isLoading: false });
    },
    loadUnits: async () => {
      const response = await apiClient.getUnits();
      const units = response.units.map((unit: any) => ({
        ...unit,
        createdAt: new Date(unit.createdAt),
        updatedAt: new Date(unit.updatedAt),
      }));
      set({ units });
    },
    createProperty: async (data) => {
      const backendData = { ...data, type: data.type.toUpperCase(), status: data.status?.toUpperCase() || 'AVAILABLE' };
      const response = await apiClient.createProperty(backendData);
      const property = { ...response.property, createdAt: new Date(response.property.createdAt), updatedAt: new Date(response.property.updatedAt) };
      set((state) => ({ properties: [...state.properties, property] }));
    },
    updateProperty: async (id, data) => {
      const backendData = { ...data, type: data.type?.toUpperCase(), status: data.status?.toUpperCase() };
      const response = await apiClient.updateProperty(id, backendData);
      const property = { ...response.property, createdAt: new Date(response.property.createdAt), updatedAt: new Date(response.property.updatedAt) };
      set((state) => ({ properties: state.properties.map((p) => p.id === id ? property : p) }));
    },
    deleteProperty: async (id) => {
      await apiClient.deleteProperty(id);
      set((state) => ({ properties: state.properties.filter((p) => p.id !== id) }));
    },
    createUnit: async (data) => {
      const backendData = { ...data, type: data.type.toUpperCase() };
      const response = await apiClient.createUnit(backendData);
      const unit = { ...response.unit, createdAt: new Date(response.unit.createdAt), updatedAt: new Date(response.unit.updatedAt) };
      set((state) => ({ units: [...state.units, unit] }));
    },
    updateUnit: async (id, data) => {
      const backendData = { ...data, type: data.type?.toUpperCase() };
      const response = await apiClient.updateUnit(id, backendData);
      const unit = { ...response.unit, createdAt: new Date(response.unit.createdAt), updatedAt: new Date(response.unit.updatedAt) };
      set((state) => ({ units: state.units.map((u) => u.id === id ? unit : u) }));
    },
    deleteUnit: async (id) => {
      await apiClient.deleteUnit(id);
      set((state) => ({ units: state.units.filter((u) => u.id !== id), properties: state.properties.filter((p) => p.unitId !== id) }));
    },
    getTenants: async () => {
      const response = await apiClient.getTenants();
      set({ tenants: response.tenants });
    },
    createTenant: async (data) => {
      const response = await apiClient.createTenant(data);
      set((state) => ({ tenants: [...state.tenants, response.tenant] }));
    },
    updateTenant: async (id, data) => {
      const response = await apiClient.updateTenant(id, data);
      set((state) => ({ tenants: state.tenants.map((t) => t.id === id ? response.tenant : t) }));
    },
    deleteTenant: async (id) => {
      await apiClient.deleteTenant(id);
      set((state) => ({ tenants: state.tenants.filter((t) => t.id !== id), contracts: state.contracts.filter((c) => c.tenantId !== id) }));
    },
    loadContracts: async () => {
      const response = await apiClient.getContracts();
      set({ contracts: response.contracts });
    },
    createContract: async (data) => {
      const response = await apiClient.createContract(data);
      set((state) => ({ contracts: [...state.contracts, response.contract] }));
    },
    updateContract: async (id, data) => {
      const response = await apiClient.updateContract(id, data);
      set((state) => ({ contracts: state.contracts.map((c) => c.id === id ? response.contract : c) }));
    },
    deleteContract: async (id) => {
      await apiClient.deleteContract(id);
      set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) }));
    },
    loadPayments: async () => {
      const response = await apiClient.getPayments();
      const payments = response.payments.map((payment: Payment) => ({ ...payment, type: payment.type.toUpperCase(), status: payment.status, dueDate: payment.dueDate, paidDate: payment.paidDate }));
      set({ payments });
    },
    createPayment: async (data) => {
      const response = await apiClient.createPayment(data);
      set((state) => ({ payments: [...state.payments, response.payment] }));
    },
    updatePayment: async (id, data) => {
      const response = await apiClient.updatePayment(id, data);
      set((state) => ({ payments: state.payments.map((p) => p.id === id ? response.payment : p) }));
    },
    updatePaymentStatus: async (id, status) => {
      const response = await apiClient.updatePaymentStatus(id, status);
      set((state) => ({ payments: state.payments.map((p) => p.id === id ? response.updatedPayment : p) }));
      if (response.newPayment) {
        set((state) => ({ payments: [...state.payments, response.newPayment] }));
      }
    },
    loadMaintenanceRequests: async () => {
      const response = await apiClient.getMaintenanceRequests();
      const requests = response.maintenanceRequests.map((request: any) => ({
        ...request,
        priority: request.priority.toUpperCase(),
        category: request.category.toUpperCase(),
        status: request.status.toUpperCase(),
        reportedDate: request.reportedDate,
        completedDate: request.completedDate ? formatDateInUTC(request.completedDate) : null,
      }));
      set({ maintenanceRequests: requests });
    },
    createMaintenanceRequest: async (data) => {
      const response = await apiClient.createMaintenaceRequest(data);
      set((state) => ({ maintenanceRequests: [...state.maintenanceRequests, response.maintenanceRequest] }));
    },
    updateMaintenanceRequest: async (id, data) => {
      const response = await apiClient.updateMaintenanceRequest(id, data);
      set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => m.id === id ? response.maintenanceRequest : m) }));
    },
    asignMaintenanceTechinician: async (id, asignTo) => {
      const response = await apiClient.asignMaintenanceTechinician(id, asignTo);
      set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => m.id === id ? response.maintenanceRequest : m) }));
    },
    markMaintenanceAsComplete: async (id, data) => {
      const response = await apiClient.markMaintenanceAsComplete(id, data);
      set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => m.id === id ? response.maintenanceRequest : m) }));
    },
    updateOrganization: async (orgId, data) => {
      const response = await apiClient.updateOrganization(orgId, data);
      set({ organization: response.organization });
    },
    getPlans: async () => {
      const response = await apiClient.getSuperAdminPlans();
      return response.data;
    },
    updatePlans: async (plans) => {
      await apiClient.updateSuperAdminPlans(plans);
    },
    createPlan: async (planData) => {
      const response = await apiClient.createSuperAdminPlan(planData);
      return response.data;
    },
  };
}); 