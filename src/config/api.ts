// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private organizationId: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
    this.organizationId = localStorage.getItem('organization_id');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

 setOrganizationId(organizationId: string | null) {
  this.organizationId = organizationId;
  if (organizationId) {
    localStorage.setItem('organization_id', organizationId);
  } else {
    localStorage.removeItem('organization_id');
  }
}


  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers && !(options.headers instanceof Headers) ? options.headers as Record<string, string> : {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Add organization ID header for authenticated requests
    if (this.organizationId && this.token) {
      headers['X-Organization-ID'] = this.organizationId;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
throw errorData;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName: string;
    planId: string;
  }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    return this.request<any>('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request<any>('/auth/refresh', {
      method: 'POST',
    });
  }

  // Properties endpoints
  async getProperties(params?: {
    status?: string;
    type?: string;
    unitId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<any>(`/properties${query ? `?${query}` : ''}`);
  }

  async getProperty(id: string) {
    return this.request<any>(`/properties/${id}`);
  }

  async createProperty(data: any) {
    return this.request<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProperty(id: string, data: any) {
    return this.request<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProperty(id: string) {
    return this.request<any>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Units endpoints
  async getUnits(params?: {
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<any>(`/units${query ? `?${query}` : ''}`);
  }

  async getUnit(id: string) {
    return this.request<any>(`/units/${id}`);
  }

  async createUnit(data: any) {
    return this.request<any>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUnit(id: string, data: any) {
    return this.request<any>(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUnit(id: string) {
    return this.request<any>(`/units/${id}`, {
      method: 'DELETE',
    });
  }

  async getTenants(params?: {
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request<any>(`/tenants${query ? `?${query}` : ''}`);
  }
  async getTenant(id: string) {
    return this.request<any>(`/tenants/${id}`);
  }

  async createTenant(data: any) {
    return this.request<any>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: any) {
    return this.request<any>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTenant(id: string) {
    return this.request<any>(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }

  // Contracts endpoints
  async getContracts(params?: {
    status?: string;
    tenantId?: string;
    propertyId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<any>(`/contracts${query ? `?${query}` : ''}`);
  }

  async getContract(id: string) {
    return this.request<any>(`/contracts/${id}`);
  }

  async createContract(data: any) {
    return this.request<any>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContract(id: string, data: any) {
    return this.request<any>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContract(id: string) {
    return this.request<any>(`/contracts/${id}`, {
      method: 'DELETE',
    });
  }

  // Organizations endpoints
  async getOrganizations() {
    return this.request<any>('/organizations');
  }

  async getOrganization(id: string) {
    return this.request<any>(`/organizations/${id}`);
  }

  async updateOrganization(id: string, data: any) {
    return this.request<any>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createPayment(data: any) {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getPayments(params?: {
    contractId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<any>(`/payments${query ? `?${query}` : ''}`);
  }

  async getPayment(id: string) {
    return this.request<any>(`/payments/${id}`);
  }

  async updatePayment(id: string, data: any) {
    return this.request<any>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentStatus(id: string, status: 'CANCELLED' | 'REFUNDED') {
    return this.request<any>(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({status}),
    });
  }

  async getMaintenanceRequests(params?: {
    status?: string;
    priority?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<any>(`/maintenance${query ? `?${query}` : ''}`);
  }

  async createMaintenaceRequest(data: any) {
    return this.request<any>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaintenanceRequest(id: string, data: any) {
    return this.request<any>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async asignMaintenanceTechinician(id: string, assignedTo: any){
    return this.request<any>(`/maintenance/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(assignedTo),
    });
  }

    async markMaintenanceAsComplete(id: string, data:any){
    return this.request<any>(`/maintenance/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserPassword(id: string, currentPassword: string, newPassword: string, confirmPassword?: string) {
    return this.request<any>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  }

  async updateUserProfile(id: string, data: any) {
    return this.request<any>('/users/' + id, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getLogActivities(params?: {
    page?: number;
    limit?: number;
    isSystemAction?: boolean
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<any>(`/activity-log${query ? `?${query}` : ''}`);
  }
}



export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;