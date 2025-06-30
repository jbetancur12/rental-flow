export interface Property {
  id: string;
  name: string;
  type: 'apartment' | 'house' | 'commercial' | 'building';
  address: string;
  size: number;
  rooms: number;
  bathrooms: number;
  amenities: string[];
  rent: number;
  status: 'available' | 'reserved' | 'rented' | 'maintenance';
  photos: string[];
  
  // NEW: Connection to Units system
  unitId?: string; // Property belongs to a unit
  unitNumber?: string; // For apartments/commercial in buildings (2A, 101, Suite 200)
  floor?: number; // For apartments/commercial in buildings
  
  // Legacy fields (keep for backward compatibility)
  buildingId?: string;
  floors?: number; // For houses
  unitType?: 'apartment' | 'commercial' | 'office';
  
  createdAt: Date;
  updatedAt: Date;
}

// Main units that contain properties
export interface Unit {
  id: string;
  name: string;
  type: 'building' | 'house' | 'commercial'; // Main unit types
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
  createdAt: Date;
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
  createdAt: Date;
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
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'former';
  creditScore?: number;
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
  status: 'draft' | 'active' | 'expired' | 'terminated';
  signedDate?: Date;
  renewalNotificationSent?: boolean;
  terminationDate?: Date;
  terminationReason?: string;
}

export interface Payment {
  id: string;
  contractId: string;
  tenantId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'late_fee' | 'utility' | 'maintenance';
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  method?: 'cash' | 'check' | 'bank_transfer' | 'online';
  notes?: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string; // Property ID (which belongs to a unit)
  tenantId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
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