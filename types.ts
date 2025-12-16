export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  whatsapp?: string;
  birth_date?: string; // YYYY-MM-DD
  address?: string;
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
}

export interface Checkin {
  id: string;
  schedule_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile; // Joined data
}

export interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  location: string;
  limit_count: number;
  status: 'active' | 'cancelled';
  checkins?: Checkin[]; // Joined data
  current_count?: number; // Calculated
}

export interface Payment {
  id: string;
  student_id: string;
  description: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  student?: Profile; // Joined data
  external_id?: string; // Mercado Pago ID
  qr_code?: string; // Copia e Cola Real
  qr_code_base64?: string; // Imagem base64 do MP
}

export interface UserSession {
  user: Profile | null;
  loading: boolean;
}