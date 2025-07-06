export interface Property {
  id: string;
  name: string;
  type: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'BUILDING';
  address: string;
  size: number;
  rooms: number;
  bathrooms: number;
  amenities: string[];
  rent: number;
  status: 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE';
  photos: string[];
  
  // NEW: Connection to Units system
  unitId?: string; // Property belongs to a unit
  unitNumber?: string; // For apartments/commercial in buildings (2A, 101, Suite 200)
  unitName?: string; // Name of the unit (e.g., "Building A", "Unit 101")
  floor?: number; // For apartments/commercial in buildings
  
  // Legacy fields (keep for backward compatibility)
  buildingId?: string;
  floors?: number; // For houses
  unitType?: 'APARTMENT' | 'COMMERCIAL' | 'OFFICE';
  contracts?: Contract[]; // Array of contract IDs
  
  createdAt?: Date;
  updatedAt: Date;
}

// Main units that contain properties
export interface Unit {
  id: string;
  name: string;
  type: 'BUILDING' | 'HOUSE' | 'COMMERCIAL'; // Main unit types
  address: string;
  description?: string;
  
  // For buildings
  totalFloors?: number;
  
  // For houses
  floors?: number; // Number of floors (1, 2, 3, etc.)
  
  // For commercial (standalone)
  size?: number;
  
  amenities: string[];
  photos: string[];
  manager?: string;
  createdAt?: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  type: 'residential' | 'commercial' | 'mixed';
  totalFloors: number;
  units: Property[];
  totalUnits: number;
  occupiedUnits: number;
  amenities: string[];
  manager?: string;
  createdAt?: Date;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  employment: {
    employer: string;
    position: string;
    income: number;
  };
  references: Reference[];
  applicationDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'FORMER';
  creditScore?: number;
  createdAt?: Date;
}

export interface Reference {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface Contract {
  id: string;
  propertyId: string; // Property ID (which belongs to a unit)
  tenantId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  terms: string[];
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  signedDate?: Date;
  renewalNotificationSent?: boolean;
  terminationDate?: Date;
  terminationReason?: string;
  tenant?: Tenant; // Array of tenant IDs associated with the contract
  createdAt?: Date
}

export interface Payment {
  id: string;
  contractId: string;
  tenantId: string;
  amount: number;
  type: 'RENT' | 'DEPOSIT' | 'LATE_FEE' | 'UTILITY' | 'MAINTENANCE';
  dueDate: Date;
  paidDate?: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED' | 'REFUNDED';
  method: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'ONLINE';
  notes?: string;
  periodStart?: Date; // Start date of the billing period
  periodEnd?: Date; // End date of the billing period
  createdAt?: Date
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string; // Property ID (which belongs to a unit)
  tenantId?: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'STRUCTURAL' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reportedDate: Date;
  completedDate?: Date;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  photos?: string[];
  notes?: string;
}

export interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  totalTenants: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  overduePayments: number;
  expiringContracts: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  email: string | null;
  plan: string;
  status: string; // Puedes usar tu enum SubscriptionStatus si coincide
  users: number;
  properties: number;
  tenants: number;
  mrr: number;
  createdAt: string; // Se reciben como string desde la API
  lastActivity: string;
}

// Interfaz para la información de paginación
export interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// Interfaz para la respuesta completa de la API
export interface GetOrganizationsResponse {
  data: OrganizationSummary[];
  pagination: PaginationInfo;
}

export interface PlanLimits {
  properties: number;
  tenants: number;
  users: number;
}

// Define la interfaz principal para un Plan
export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  features: string[];
  limits: PlanLimits;
  createdAt?: Date;
}
