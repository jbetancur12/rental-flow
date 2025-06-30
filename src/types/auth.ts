export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user';
  organizationId: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  domain?: string; // Custom domain
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  planId: string;
  isActive: boolean;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  features: {
    multipleProperties: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
  };
  limits: {
    maxProperties: number;
    maxTenants: number;
    maxUsers: number;
    storageGB: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxProperties: number;
    maxTenants: number;
    maxUsers: number;
    storageGB: number;
  };
  isActive: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}