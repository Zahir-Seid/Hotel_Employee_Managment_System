import type { Department } from './types';

// Static department fallback for filter dropdowns when API is slow/unavailable
export const MOCK_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Front Desk', description: 'Guest reception, check-in/check-out, concierge services', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Housekeeping', description: 'Room cleaning, laundry, public area maintenance', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Food & Beverage', description: 'Restaurant, bar, room service, kitchen operations', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Maintenance', description: 'Building systems, repairs, facility management', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Security', description: 'Guest safety, access control, loss prevention', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'Spa & Wellness', description: 'Massage, treatments, fitness center operations', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '7', name: 'Management', description: 'Executive leadership, HR, finance, administration', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];
