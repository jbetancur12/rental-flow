import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, Organization, Subscription, AuthState, UserRole, SubscriptionStatus } from '../types/auth';
import { apiClient } from '../config/api';
import { useToast } from '../hooks/useToast';
import { isPast } from 'date-fns';

interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  // Add other fields as needed
}

interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateUserProfileResponse {
  user: User;
}


type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; organization: Organization; subscription: Subscription; token: string; isSubscriptionActive: boolean } }
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
   isSubscriptionActive: false
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
        isSubscriptionActive: action.payload.isSubscriptionActive,
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
  login: (email: string, password: string) => Promise<User |void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateUserProfile: (userId: string, data: UpdateUserProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>; // <-- AÑADIR ESTA LÍNEA
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
  const toast = useToast();

      const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      apiClient.setOrganizationId(null);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

const processAuthResponse = useCallback((response: any): boolean => {
    localStorage.setItem('auth_token', response.token);
    apiClient.setToken(response.token);


    const user: User = {
        ...response.user,
        role: response.user.role.toUpperCase() as UserRole,
        createdAt: new Date(response.user.createdAt),
        updatedAt: new Date(response.user.updatedAt),
        lastLogin: response.user.lastLogin ? new Date(response.user.lastLogin) : undefined,
    };

    let organization: Organization;
    let subscription: Subscription;
    let isSubscriptionActive = false;

    if (user.role === 'SUPER_ADMIN') {

        apiClient.setOrganizationId(user.organizationId); 
        organization = response.organization || {
            id: user.organizationId,
            name: 'Plataforma RentFlow',
            // ... otros valores por defecto ...
        };
        subscription = { 
            id: 'super-admin-sub', 
            status: 'ACTIVE',
            planId: 'platform',
            organizationId: user.organizationId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            createdAt: new Date(),
            // ... otros valores por defecto ...
        };
        isSubscriptionActive = true; 

    } else {
        // 2. Lógica para usuarios normales (la que ya teníamos)
        if (!response.organization || !response.subscription) {
            toast.error('Error de Datos', 'Faltan datos de la organización o suscripción.');
            logout();
            return false;
        }

        apiClient.setOrganizationId(response.organization.id);

        organization = {
            ...response.organization,
            createdAt: new Date(response.organization.createdAt),
            updatedAt: new Date(response.organization.updatedAt),
        };

        subscription = {
            ...response.subscription,
            status: response.subscription.status.toUpperCase() as SubscriptionStatus,
            currentPeriodStart: new Date(response.subscription.currentPeriodStart),
            currentPeriodEnd: new Date(response.subscription.currentPeriodEnd),
            trialEnd: response.subscription.trialEnd ? new Date(response.subscription.trialEnd) : undefined,
            createdAt: new Date(response.subscription.createdAt),
        };

        if (subscription.status === 'ACTIVE' || subscription.status === 'DEMO') {
            isSubscriptionActive = true;
        } else if (
            subscription.status === 'TRIALING' &&
            subscription.trialEnd &&
            !isPast(new Date(subscription.trialEnd))
        ) {
            isSubscriptionActive = true;
        }
    }

    // 3. Despachamos los datos ya procesados
    dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, organization, subscription, token: response.token, isSubscriptionActive },
    });


    
    return true;

}, [logout, toast]);



  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await apiClient.login(email, password);
      const wasSuccessful = processAuthResponse(response);
      if (wasSuccessful) {
        toast.success('','¡Bienvenido de nuevo!');
        return response.user as User;
      }
    } catch (error: any) {
      let errorMsg = error?.message || 'Error de autenticación';
      if (error?.code === 'ORGANIZATION_INACTIVE') {
        errorMsg = 'Tu organización está deshabilitada. Contacta al administrador.';
      }
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMsg });
      toast.error('Error de autenticación', errorMsg);
    }
  }, [processAuthResponse, toast]);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await apiClient.register(data);
      processAuthResponse(response);
      toast.success('', '¡Cuenta creada exitosamente!');
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message || 'Error al crear la cuenta' });
      toast.error('Error en el registro', error.message);
    }
  }, [processAuthResponse, toast]);



  const changePassword = useCallback(
  async ({ userId, currentPassword, newPassword, confirmPassword }: ChangePasswordData): Promise<void> => {
    try {
      // Tu API client espera los argumentos por separado
      await apiClient.updateUserPassword(userId, currentPassword, newPassword, confirmPassword);
      toast.success('Contraseña Actualizada', 'Tu contraseña ha sido cambiada exitosamente.');
    } catch (error: any) {
      toast.error('Error al Cambiar Contraseña', error.message || 'La contraseña actual es incorrecta o no se pudo actualizar.');
      // Re-lanzamos el error para que el componente que llama (Settings) sepa que la operación falló.
      throw error;
    }
  },
  [toast]
);


  const updateUserProfile = useCallback(
    async (userId: string, data: UpdateUserProfileData): Promise<void> => {
      try {
        const response: UpdateUserProfileResponse = await apiClient.updateUserProfile(userId, data);
        dispatch({ type: 'UPDATE_USER', payload: response.user });
        toast.success('Perfil Actualizado', 'Perfil actualizado exitosamente.');
      } catch (error) {
        toast.error('Error', 'Error al actualizar el perfil.');
        throw error;
      }
    },
    [toast]
  );

  const switchOrganization = useCallback(async (organizationId: string) => {
    console.log('Switching to organization:', organizationId);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        apiClient.setToken(token);
        const response = await apiClient.getCurrentUser();
        processAuthResponse({ ...response, token });
      } catch (error) {
        console.error('Sesión inválida, cerrando sesión:', error);
        logout();
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [processAuthResponse, logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    login,
    logout,
    register,
    changePassword,
    updateUserProfile,
    switchOrganization,
  }), [state, login, logout, register, changePassword, updateUserProfile, switchOrganization]);

  return (
    <AuthContext.Provider value={contextValue}>
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