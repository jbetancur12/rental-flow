import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Property, Tenant, Contract, Payment, MaintenanceRequest, Building, Unit } from '../types';
import { useToast } from '../hooks/useToast';
import { useAuth } from './AuthContext';
import { apiClient } from '../config/api';

interface AppState {
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  buildings: Building[];
  units: Unit[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'ADD_PROPERTY'; payload: Property }
  | { type: 'UPDATE_PROPERTY'; payload: Property }
  | { type: 'DELETE_PROPERTY'; payload: string }
  | { type: 'SET_UNITS'; payload: Unit[] }
  | { type: 'ADD_UNIT'; payload: Unit }
  | { type: 'UPDATE_UNIT'; payload: Unit }
  | { type: 'DELETE_UNIT'; payload: string }
  | { type: 'SET_TENANTS'; payload: Tenant[] }
  | { type: 'ADD_TENANT'; payload: Tenant }
  | { type: 'UPDATE_TENANT'; payload: Tenant }
  | { type: 'ADD_CONTRACT'; payload: Contract }
  | { type: 'DELETE_CONTRACT'; payload: string }
  | { type: 'UPDATE_CONTRACT'; payload: Contract }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: Payment }
  | { type: 'ADD_MAINTENANCE_REQUEST'; payload: MaintenanceRequest }
  | { type: 'UPDATE_MAINTENANCE_REQUEST'; payload: MaintenanceRequest }
  | { type: 'LOAD_INITIAL_DATA'; payload: Partial<AppState> }
  | { type: 'CLEAR_DATA' };

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

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload };
    case 'ADD_PROPERTY':
      return { ...state, properties: [...state.properties, action.payload] };
    case 'UPDATE_PROPERTY':
      return {
        ...state,
        properties: state.properties.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PROPERTY':
      return {
        ...state,
        properties: state.properties.filter(p => p.id !== action.payload)
      };
    case 'SET_UNITS':
      return { ...state, units: action.payload };
    case 'SET_TENANTS':
      return { ...state, tenants: action.payload };
    case 'ADD_UNIT':
      return { ...state, units: [...state.units, action.payload] };
    case 'UPDATE_UNIT':
      return {
        ...state,
        units: state.units.map(u => u.id === action.payload.id ? action.payload : u)
      };
    case 'DELETE_UNIT':
      return {
        ...state,
        units: state.units.filter(u => u.id !== action.payload),
        properties: state.properties.filter(p => p.unitId !== action.payload)
      };
    case 'ADD_TENANT':
      return { ...state, tenants: [...state.tenants, action.payload] };
    case 'UPDATE_TENANT':
      return {
        ...state,
        tenants: state.tenants.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'ADD_CONTRACT':
      return { ...state, contracts: [...state.contracts, action.payload] };
    case 'UPDATE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'DELETE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.filter(c => c.id !== action.payload)
      };
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'ADD_MAINTENANCE_REQUEST':
      return { ...state, maintenanceRequests: [...state.maintenanceRequests, action.payload] };
    case 'UPDATE_MAINTENANCE_REQUEST':
      return {
        ...state,
        maintenanceRequests: state.maintenanceRequests.map(m => 
          m.id === action.payload.id ? action.payload : m
        )
      };
    case 'LOAD_INITIAL_DATA':
      return { ...state, ...action.payload };
    case 'CLEAR_DATA':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  toast: ReturnType<typeof useToast>;
  // API methods
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
  deleteTenant?: (id: string) => Promise<void>;
  loadContracts: () => Promise<void>;
  createContract: (data: any) => Promise<void>;
  updateContract: (id: string, data: any) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  createPayment: (data: any) => Promise<void>;
  updatePayment?: (id: string, data: any) => Promise<void>;
  createMaintenanceRequest?: (data: any) => Promise<void>;
  updateMaintenanceRequest?: (id: string, data: any) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const toast = useToast();
  const { state: authState } = useAuth();

  // Load properties from backend
  const loadProperties = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.getProperties();
      
      // Transform backend properties to frontend format
      const properties = response.properties.map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        type: prop.type.toLowerCase(),
        address: prop.address,
        size: prop.size,
        rooms: prop.rooms,
        bathrooms: prop.bathrooms,
        amenities: prop.amenities || [],
        rent: prop.rent,
        status: prop.status.toLowerCase(),
        photos: prop.photos || [],
        unitId: prop.unitId,
        unitNumber: prop.unitNumber,
        floor: prop.floor,
        createdAt: new Date(prop.createdAt),
        updatedAt: new Date(prop.updatedAt),
      }));
      
      dispatch({ type: 'SET_PROPERTIES', payload: properties });
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to load properties');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load units from backend
  const loadUnits = async () => {
    if (!authState.isAuthenticated || !authState.organization ) return;
    
    try {
      const response = await apiClient.getUnits();
      
      // Transform backend units to frontend format
      const units = response.units.map((unit: any) => ({
        id: unit.id,
        name: unit.name,
        type: unit.type.toLowerCase(),
        address: unit.address,
        description: unit.description,
        totalFloors: unit.totalFloors,
        floors: unit.floors,
        size: unit.size,
        amenities: unit.amenities || [],
        photos: unit.photos || [],
        manager: unit.manager,
        createdAt: new Date(unit.createdAt),
        updatedAt: new Date(unit.updatedAt),
      }));
      
      dispatch({ type: 'SET_UNITS', payload: units });
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to load units');
    }
  };



  // Create property
  const createProperty = async (data: any) => {
    try {
      // Transform frontend data to backend format
      const backendData = {
        ...data,
        type: data.type.toUpperCase(),
        status: data.status?.toUpperCase() || 'AVAILABLE',
      };
      
      const response = await apiClient.createProperty(backendData);
      
      // Transform response back to frontend format
      const property = {
        ...response.property,
        type: response.property.type.toLowerCase(),
        status: response.property.status.toLowerCase(),
        createdAt: new Date(response.property.createdAt),
        updatedAt: new Date(response.property.updatedAt),
      };
      
      dispatch({ type: 'ADD_PROPERTY', payload: property });
      toast.success('Propiedad Creada', 'La propiedad ha sido agregada exitosamente a tu portafolio.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create property');
      throw error;
    }
  };

  // Update property
  const updateProperty = async (id: string, data: any) => {
    try {
      // Transform frontend data to backend format
      const backendData = {
        ...data,
        type: data.type?.toUpperCase(),
        status: data.status?.toUpperCase(),
      };
      
      const response = await apiClient.updateProperty(id, backendData);
      
      // Transform response back to frontend format
      const property = {
        ...response.property,
        type: response.property.type.toLowerCase(),
        status: response.property.status.toLowerCase(),
        createdAt: new Date(response.property.createdAt),
        updatedAt: new Date(response.property.updatedAt),
      };
      
      dispatch({ type: 'UPDATE_PROPERTY', payload: property });
      toast.success('Propiedad Actualizada', 'La información de la propiedad ha sido actualizada exitosamente.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to update property');
      throw error;
    }
  };

  // Delete property
  const deleteProperty = async (id: string) => {
    try {
      await apiClient.deleteProperty(id);
      dispatch({ type: 'DELETE_PROPERTY', payload: id });
      toast.success('Propiedad Eliminada', 'La propiedad ha sido removida de tu portafolio.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to delete property');
      throw error;
    }
  };

  // Create unit
  const createUnit = async (data: any) => {
    try {
      // Transform frontend data to backend format
      const backendData = {
        ...data,
        type: data.type.toUpperCase(),
      };
      
      const response = await apiClient.createUnit(backendData);
      
      // Transform response back to frontend format
      const unit = {
        ...response.unit,
        type: response.unit.type.toLowerCase(),
        createdAt: new Date(response.unit.createdAt),
        updatedAt: new Date(response.unit.updatedAt),
      };
      
      dispatch({ type: 'ADD_UNIT', payload: unit });
      toast.success('Unidad Creada', 'La nueva unidad ha sido agregada exitosamente al sistema.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create unit');
      throw error;
    }
  };

  // Update unit
  const updateUnit = async (id: string, data: any) => {
    try {
      // Transform frontend data to backend format
      const backendData = {
        ...data,
        type: data.type?.toUpperCase(),
      };
      
      const response = await apiClient.updateUnit(id, backendData);
      
      // Transform response back to frontend format
      const unit = {
        ...response.unit,
        type: response.unit.type.toLowerCase(),
        createdAt: new Date(response.unit.createdAt),
        updatedAt: new Date(response.unit.updatedAt),
      };
      
      dispatch({ type: 'UPDATE_UNIT', payload: unit });
      toast.success('Unidad Actualizada', 'La información de la unidad ha sido actualizada exitosamente.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to update unit');
      throw error;
    }
  };

  // Delete unit
  const deleteUnit = async (id: string) => {
    try {
      await apiClient.deleteUnit(id);
      dispatch({ type: 'DELETE_UNIT', payload: id });
      toast.success('Unidad Eliminada', 'La unidad y todas sus propiedades han sido removidas del sistema.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to delete unit');
      throw error;
    }
  };

  // Get tenants
  const getTenants = async () => {
    if (!authState.isAuthenticated || !authState.organization) return;

    try {
      const response = await apiClient.getTenants();
      
      // Transform backend tenants to frontend format
      
      
      dispatch({ type: 'SET_TENANTS', payload: response.tenants });
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to load tenants');
    }
  }

  const createTenant = async (data: any) => {
    try {
      const response = await apiClient.createTenant(data);
      dispatch({ type: 'ADD_TENANT', payload: response.tenant });
      toast.success('Inquilino Agregado', 'El nuevo inquilino ha sido agregado exitosamente al sistema.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create tenant');
      throw error;
    }
  }

  const updateContract = async (id: string, data: any) => {
    try {
      const response = await apiClient.updateContract(id, data);
      dispatch({ type: 'UPDATE_CONTRACT', payload: response.contract });
      toast.success('Contrato Actualizado', 'El contrato ha sido actualizado exitosamente.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to update contract');
      throw error;
    }
  }

  const updateTenant = async (id: string, data: any) => {
    try {
      const response = await apiClient.updateTenant(id, data);
      dispatch({ type: 'UPDATE_TENANT', payload: response.tenant });
      toast.success('Inquilino Actualizado', 'La información del inquilino ha sido actualizada exitosamente.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to update tenant');
      throw error;
    }
  }

  const loadContracts = async () => {
    if (!authState.isAuthenticated || !authState.organization) return;

    try {
      const response = await apiClient.getContracts();
      
      // Transform backend contracts to frontend format
      const { contracts } = response
      
      dispatch({ type: 'LOAD_INITIAL_DATA', payload: { contracts } });
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to load contracts');
    }
  }

  const createContract = async (data: any) => {
    try {
      const response = await apiClient.createContract(data);
      dispatch({ type: 'ADD_CONTRACT', payload: response.contract });
      toast.success('Contrato Creado', 'El nuevo contrato de alquiler ha sido creado exitosamente.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create contract');
      throw error;
    }
  }

  const deleteContract = async (id: string) => {
    try {
      await apiClient.deleteContract(id);
      dispatch({ type: 'DELETE_CONTRACT', payload: id });
      toast.success('Contrato Eliminado', 'El contrato ha sido eliminado exitosamente.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to delete contract');
      throw error;
    }
  }

  const createPayment = async (data: any) => {
    try {
      const response = await apiClient.createPayment(data);
      dispatch({ type: 'ADD_PAYMENT', payload: response.payment });
      toast.success('Pago Registrado', 'El pago ha sido registrado exitosamente en el sistema.');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create payment');
      throw error;
    }
  }

  // Load initial data when authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.organization) {
      loadUnits();
      loadProperties();
      getTenants();
      loadContracts();
    }
  }, [authState.isAuthenticated, authState.organization]);

  // Enhanced dispatch with notifications for local operations
  const enhancedDispatch = (action: AppAction) => {
    dispatch(action);
    
    // Add success notifications for local CRUD operations
    switch (action.type) {
      case 'ADD_TENANT':
        toast.success('Inquilino Agregado', 'El nuevo inquilino ha sido agregado exitosamente al sistema.');
        break;
      case 'UPDATE_TENANT':
        toast.success('Inquilino Actualizado', 'La información del inquilino ha sido actualizada exitosamente.');
        break;
      case 'ADD_CONTRACT':
        toast.success('Contrato Creado', 'El nuevo contrato de alquiler ha sido creado exitosamente.');
        break;
      case 'UPDATE_CONTRACT':
        toast.success('Contrato Actualizado', 'El contrato ha sido actualizado exitosamente.');
        break;
      case 'ADD_PAYMENT':
        toast.success('Pago Registrado', 'El pago ha sido registrado exitosamente en el sistema.');
        break;
      case 'UPDATE_PAYMENT':
        toast.success('Pago Actualizado', 'La información del pago ha sido actualizada exitosamente.');
        break;
      case 'ADD_MAINTENANCE_REQUEST':
        toast.success('Solicitud de Mantenimiento Creada', 'La nueva solicitud de mantenimiento ha sido enviada.');
        break;
      case 'UPDATE_MAINTENANCE_REQUEST':
        toast.success('Solicitud de Mantenimiento Actualizada', 'La solicitud de mantenimiento ha sido actualizada exitosamente.');
        break;
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch: enhancedDispatch, 
      toast,
      loadProperties,
      loadUnits,
      createProperty,
      updateProperty,
      deleteProperty,
      createUnit,
      updateUnit,
      deleteUnit,
      createTenant,
      updateTenant,
      getTenants,
      loadContracts,
      createContract,
      updateContract,
      createPayment,
      deleteContract,
    
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}