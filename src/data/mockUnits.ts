import { Unit } from '../types';

export const mockUnits: Unit[] = [
  {
    id: 'unit-1',
    name: 'Sunset Apartments',
    type: 'building',
    address: '123 Main Street, Downtown',
    description: 'Modern apartment building with 24 units across 6 floors',
    totalFloors: 6,
    amenities: ['Elevator', 'Gym', 'Pool', 'Parking', 'Laundry', 'Security'],
    photos: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'],
    manager: 'Sarah Johnson',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'unit-2',
    name: 'Oak Family House',
    type: 'house',
    address: '456 Oak Avenue, Suburbs',
    description: 'Beautiful 2-story family house with large backyard',
    floors: 2,
    amenities: ['Garage', 'Backyard', 'Fireplace', 'Basement', 'Central AC'],
    photos: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'],
    manager: 'Mike Davis',
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'unit-3',
    name: 'Downtown Office Space',
    type: 'commercial',
    address: '789 Business Plaza, Downtown',
    description: 'Premium commercial space perfect for offices or retail',
    size: 2500,
    amenities: ['Parking', 'Security', 'Elevator', 'Conference Rooms'],
    photos: ['https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg'],
    manager: 'Lisa Chen',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'unit-4',
    name: 'Riverside Townhouse',
    type: 'house',
    address: '321 River Road, Riverside',
    description: 'Elegant 3-story townhouse with river views',
    floors: 3,
    amenities: ['River View', 'Patio', 'Garage', 'Modern Kitchen'],
    photos: ['https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg'],
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2024-01-30')
  }
];