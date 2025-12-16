import { Schedule, Profile } from '../types';

export const MOCK_USER_STUDENT: Profile = {
  id: 'user-1',
  full_name: 'João Silva',
  role: 'student',
  avatar_url: 'https://picsum.photos/seed/user1/150/150',
};

export const MOCK_USER_ADMIN: Profile = {
  id: 'admin-1',
  full_name: 'Coach Beto',
  role: 'admin',
  avatar_url: 'https://picsum.photos/seed/admin/150/150',
};

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'sch-1',
    start_time: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(), // Today 18:00
    end_time: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
    location: 'Arena Copacabana - Posto 5',
    limit_count: 12,
    status: 'active',
    checkins: [
      { id: 'c1', schedule_id: 'sch-1', user_id: 'u2', created_at: new Date().toISOString(), profile: { id: 'u2', full_name: 'Ana Clara', role: 'student', avatar_url: 'https://picsum.photos/seed/ana/150/150' } },
      { id: 'c2', schedule_id: 'sch-1', user_id: 'u3', created_at: new Date().toISOString(), profile: { id: 'u3', full_name: 'Pedro Costa', role: 'student', avatar_url: 'https://picsum.photos/seed/pedro/150/150' } },
      { id: 'c3', schedule_id: 'sch-1', user_id: 'u4', created_at: new Date().toISOString(), profile: { id: 'u4', full_name: 'Lucas P.', role: 'student', avatar_url: 'https://picsum.photos/seed/lucas/150/150' } },
    ]
  },
  {
    id: 'sch-2',
    start_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
    end_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), 
    location: 'Arena Ipanema - Posto 9',
    limit_count: 8,
    status: 'active',
    checkins: []
  }
];