import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Organization, Subscription, AuthState } from '../types/auth';
import { apiClient } from '../config/api';

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; organization: Organization; subscription: Subscription; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'UPDATE_ORGANIZATION'; payload: Organization }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  organization: null,
  subscription: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        organization: action.payload.organization,
        subscription: action.payload.subscription,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        organization: null,
        subscription: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_ORGANIZATION':
      return { ...state, organization: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
} | null>(null);

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
  planId: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await apiClient.login(email, password);
      
      // Set token in API client
      apiClient.setToken(response.token);
      
      // Transform backend response to frontend format
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        role: response.user.role.toLowerCase().replace('_', '_') as any,
        organizationId: response.user.organizationId,
        isActive: true,
        createdAt: new Date(response.user.createdAt || Date.now()),
        updatedAt: new Date(),
        lastLogin: response.user.lastLogin ? new Date(response.user.lastLogin) : undefined,
      };

      const organization: Organization = response.organization ? {
        id: response.organization.id,
        name: response.organization.name,
        slug: response.organization.slug,
        planId: response.organization.planId,
        isActive: response.organization.isActive,
        settings: response.organization.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : {
        id: '',
        name: '',
        slug: '',
        planId: '',
        isActive: false,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let subscription: Subscription;
      if (response.subscription) {
        subscription = {
          id: response.subscription.id,
          organizationId: response.subscription.organizationId || organization?.id || '',
          planId: response.subscription.planId,
          status: response.subscription.status.toLowerCase() as any,
          currentPeriodStart: new Date(response.subscription.currentPeriodStart),
          currentPeriodEnd: new Date(response.subscription.currentPeriodEnd),
          trialEnd: response.subscription.trialEnd ? new Date(response.subscription.trialEnd) : undefined,
          createdAt: new Date(),
        };
      } else {
        // Provide a default/fallback Subscription object if needed
        subscription = {
          id: '',
          organizationId: organization?.id || '',
          planId: '',
          status: '' as any,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          trialEnd: undefined,
          createdAt: new Date(),
        };
      }

      if (organization) {
        apiClient.setOrganizationId(organization.id);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, organization: organization!, subscription: subscription!, token: response.token },
      });

      // Redirect based on user role
      if (user.role === 'super_admin') {
        window.location.href = '/super-admin';
      }

    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message || 'Error de autenticación' });
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await apiClient.register(data);
      
      // Set token in API client
      apiClient.setToken(response.token);
      
      // Transform backend response to frontend format
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        role: response.user.role.toLowerCase().replace('_', '_') as any,
        organizationId: response.user.organizationId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const organization: Organization = {
        id: response.organization.id,
        name: response.organization.name,
        slug: response.organization.slug,
        planId: response.organization.planId,
        isActive: response.organization.isActive,
        settings: response.organization.settings,
        createdAt: new Date(response.organization.createdAt),
        updatedAt: new Date(response.organization.updatedAt),
      };

      const subscription: Subscription = {
        id: response.subscription.id,
        organizationId: response.subscription.organizationId,
        planId: response.subscription.planId,
        status: response.subscription.status.toLowerCase() as any,
        currentPeriodStart: new Date(response.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(response.subscription.currentPeriodEnd),
        trialEnd: response.subscription.trialEnd ? new Date(response.subscription.trialEnd) : undefined,
        createdAt: new Date(response.subscription.createdAt),
      };

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, organization, subscription, token: response.token },
      });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message || 'Error al crear la cuenta' });
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.setToken(null);
      apiClient.setOrganizationId(null);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const switchOrganization = async (organizationId: string) => {
    // Implementation for switching between organizations (for users with multiple org access)
    console.log('Switching to organization:', organizationId);
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          apiClient.setToken(token);
          const response = await apiClient.getCurrentUser();
          
          // Transform backend response to frontend format
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            role: response.user.role.toLowerCase().replace('_', '_') as any,
            organizationId: response.user.organizationId,
            isActive: true,
            createdAt: new Date(response.user.createdAt),
            updatedAt: new Date(),
            lastLogin: response.user.lastLogin ? new Date(response.user.lastLogin) : undefined,
          };

          const organization: Organization = response.organization ? {
            id: response.organization.id,
            name: response.organization.name,
            slug: response.organization.slug,
            planId: response.organization.planId,
            isActive: response.organization.isActive,
            settings: response.organization.settings,
            createdAt: new Date(),
            updatedAt: new Date(),
          } : {
            id: '',
            name: '',
            slug: '',
            planId: '',
            isActive: false,
            settings: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const subscription: Subscription = response.subscription ? {
            id: response.subscription.id,
            organizationId: response.subscription.organizationId || organization?.id || '',
            planId: response.subscription.planId,
            status: response.subscription.status.toLowerCase() as any,
            currentPeriodStart: new Date(response.subscription.currentPeriodStart),
            currentPeriodEnd: new Date(response.subscription.currentPeriodEnd),
            trialEnd: response.subscription.trialEnd ? new Date(response.subscription.trialEnd) : undefined,
            createdAt: new Date(),
          } : {
            id: '',
            organizationId: organization?.id || '',
            planId: '',
            status: '' as any,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            trialEnd: undefined,
            createdAt: new Date(),
          };

          dispatch({
            type: 'LOGIN_SUCCESS',
payload: { user, organization, subscription, token: response.token },          });
        } catch (error) {
          console.error('Auth check failed:', error);
          apiClient.setToken(null);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout, register, switchOrganization }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}