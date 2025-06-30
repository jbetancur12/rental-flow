import { Property, Tenant, Contract, Payment, MaintenanceRequest, Building } from '../types';

export const mockBuildings: Building[] = [
  {
    id: 'building-1',
    name: 'Sunset Apartments',
    address: '123 Main Street, Downtown',
    units: [],
    totalUnits: 24,
    occupiedUnits: 18,
    amenities: ['Gym', 'Pool', 'Parking', 'Laundry'],
    manager: 'Sarah Johnson',
    createdAt: new Date('2023-01-15')
  },
  {
    id: 'building-2',
    name: 'Oak Tower',
    address: '456 Oak Avenue, Midtown',
    units: [],
    totalUnits: 36,
    occupiedUnits: 32,
    amenities: ['Elevator', 'Security', 'Parking', 'Rooftop'],
    manager: 'Mike Davis',
    createdAt: new Date('2022-08-20')
  }
];

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    name: 'Apartment 2A',
    type: 'apartment',
    address: '123 Main Street, Unit 2A',
    size: 750,
    rooms: 2,
    bathrooms: 1,
    amenities: ['Air Conditioning', 'Dishwasher', 'Balcony'],
    rent: 1200,
    status: 'rented',
    photos: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'],
    unitId: 'unit-1', // Belongs to Sunset Apartments building
    unitNumber: '2A',
    floor: 2,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'prop-2',
    name: 'Apartment 3B',
    type: 'apartment',
    address: '123 Main Street, Unit 3B',
    size: 900,
    rooms: 2,
    bathrooms: 2,
    amenities: ['Air Conditioning', 'Dishwasher', 'Balcony', 'In-Unit Laundry'],
    rent: 1450,
    status: 'available',
    photos: ['https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg'],
    unitId: 'unit-1', // Belongs to Sunset Apartments building
    unitNumber: '3B',
    floor: 3,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'prop-3',
    name: 'Oak Family House',
    type: 'house',
    address: '456 Oak Avenue, Suburbs',
    size: 1200,
    rooms: 3,
    bathrooms: 2,
    amenities: ['Garage', 'Yard', 'Fireplace', 'Basement'],
    rent: 1800,
    status: 'rented',
    photos: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'],
    unitId: 'unit-2', // Belongs to Oak Family House unit
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'prop-4',
    name: 'Downtown Office Space',
    type: 'commercial',
    address: '789 Business Plaza',
    size: 2500,
    rooms: 8,
    bathrooms: 3,
    amenities: ['Conference Rooms', 'Parking', 'Security', 'Elevator'],
    rent: 4500,
    status: 'available',
    photos: ['https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg'],
    unitId: 'unit-3', // Belongs to Downtown Office Space unit
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'prop-5',
    name: 'Commercial Suite 101',
    type: 'commercial',
    address: '123 Main Street, Suite 101',
    size: 1200,
    rooms: 4,
    bathrooms: 2,
    amenities: ['Street Access', 'Large Windows', 'Reception Area'],
    rent: 2500,
    status: 'available',
    photos: ['https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg'],
    unitId: 'unit-1', // Belongs to Sunset Apartments building
    unitNumber: '101',
    floor: 1,
    createdAt: new Date('2023-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

export const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@email.com',
    phone: '(555) 123-4567',
    emergencyContact: {
      name: 'Bob Johnson',
      phone: '(555) 987-6543',
      relationship: 'Spouse'
    },
    employment: {
      employer: 'Tech Corp',
      position: 'Software Engineer',
      income: 75000
    },
    references: [
      {
        id: 'ref-1',
        name: 'Previous Landlord',
        relationship: 'Landlord',
        phone: '(555) 111-2222',
        email: 'landlord@email.com'
      }
    ],
    applicationDate: new Date('2023-11-15'),
    status: 'active',
    creditScore: 750
  },
  {
    id: 'tenant-2',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@email.com',
    phone: '(555) 234-5678',
    emergencyContact: {
      name: 'Mary Brown',
      phone: '(555) 876-5432',
      relationship: 'Mother'
    },
    employment: {
      employer: 'Design Studio',
      position: 'Creative Director',
      income: 65000
    },
    references: [],
    applicationDate: new Date('2023-10-20'),
    status: 'active',
    creditScore: 720
  }
];

export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    monthlyRent: 1200,
    securityDeposit: 1200,
    terms: [
      'No pets allowed',
      'No smoking',
      'Tenant responsible for utilities',
      'Notice required for entry'
    ],
    status: 'active',
    signedDate: new Date('2023-12-15')
  },
  {
    id: 'contract-2',
    propertyId: 'prop-3',
    tenantId: 'tenant-2',
    startDate: new Date('2023-11-01'),
    endDate: new Date('2024-10-31'),
    monthlyRent: 1800,
    securityDeposit: 1800,
    terms: [
      'Pets allowed with deposit',
      'No smoking indoors',
      'Tenant maintains yard',
      '24-hour notice for entry'
    ],
    status: 'active',
    signedDate: new Date('2023-10-25')
  }
];

export const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    contractId: 'contract-1',
    tenantId: 'tenant-1',
    amount: 1200,
    type: 'rent',
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2023-12-30'),
    status: 'paid',
    method: 'bank_transfer'
  },
  {
    id: 'payment-2',
    contractId: 'contract-1',
    tenantId: 'tenant-1',
    amount: 1200,
    type: 'rent',
    dueDate: new Date('2024-02-01'),
    status: 'pending'
  },
  {
    id: 'payment-3',
    contractId: 'contract-2',
    tenantId: 'tenant-2',
    amount: 1800,
    type: 'rent',
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2024-01-02'),
    status: 'paid',
    method: 'check'
  }
];

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 'maint-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    title: 'Leaky Faucet in Kitchen',
    description: 'The kitchen faucet is dripping constantly and needs repair.',
    priority: 'medium',
    category: 'plumbing',
    status: 'in_progress',
    reportedDate: new Date('2024-01-20'),
    assignedTo: 'Mike Plumber',
    estimatedCost: 150
  },
  {
    id: 'maint-2',
    propertyId: 'prop-3',
    tenantId: 'tenant-2',
    title: 'HVAC Not Working',
    description: 'Heating system is not turning on despite thermostat settings.',
    priority: 'high',
    category: 'hvac',
    status: 'open',
    reportedDate: new Date('2024-01-25'),
    estimatedCost: 300
  },
  {
    id: 'maint-3',
    propertyId: 'prop-2',
    title: 'Unit Painting Before Move-in',
    description: 'Repaint unit 3B before new tenant moves in.',
    priority: 'low',
    category: 'other',
    status: 'open',
    reportedDate: new Date('2024-01-28'),
    estimatedCost: 800
  }
];