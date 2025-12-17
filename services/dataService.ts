import { supabase } from '../utils/supabaseClient';
import { Schedule, Checkin, Profile, Payment } from '../types';

export const getSchedules = async (): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      checkins (
        id,
        schedule_id,
        user_id,
        created_at,
        profile:profiles (
          id,
          full_name,
          role,
          avatar_url,
          whatsapp
        )
      )
    `)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }

  return (data || []) as Schedule[];
};

export const createSchedule = async (schedule: Omit<Schedule, 'id' | 'checkins'>): Promise<Schedule> => {
  const { data, error } = await supabase
    .from('schedules')
    .insert([{
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      location: schedule.location,
      limit_count: schedule.limit_count,
      status: schedule.status
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return { ...data, checkins: [] };
};

export const updateSchedule = async (id: string, updates: Partial<Schedule>): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const deleteSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const checkIn = async (scheduleId: string, user: Profile): Promise<Checkin> => {
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    throw new Error("Usuário já está inscrito.");
  }

  const { data, error } = await supabase
    .from('checkins')
    .insert([
      { schedule_id: scheduleId, user_id: user.id }
    ])
    .select(`
      *,
      profile:profiles(*)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data as Checkin;
};

export const checkOut = async (scheduleId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('checkins')
    .delete()
    .match({ schedule_id: scheduleId, user_id: userId });

  if (error) {
    throw error;
  }
};

// --- GESTÃO DE USUÁRIOS ---

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar perfis:', error);
    return [];
  }
  return data as Profile[];
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  // Limpeza de dependências
  await supabase.from('checkins').delete().eq('user_id', userId);
  await supabase.from('payments').delete().eq('student_id', userId);
  
  const { error } = await supabase.from('profiles').delete().eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
};

// --- FINANCEIRO ---

export const getStudents = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
  return data as Profile[];
};

export const getPayments = async (role: 'admin' | 'student', userId: string): Promise<Payment[]> => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      student:profiles(*)
    `)
    .order('due_date', { ascending: true });

  if (role === 'student') {
    query = query.eq('student_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }

  return (data || []) as Payment[];
};

export const createPayment = async (payment: Partial<Payment>): Promise<void> => {
  const { error } = await supabase.from('payments').insert([payment]);
  if (error) throw error;
};

export const updatePaymentStatus = async (id: string, status: Payment['status']): Promise<void> => {
  const { error } = await supabase.from('payments').update({ status }).eq('id', id);
  if (error) throw error;
};

// --- INTEGRAÇÃO API ---

export const generateMercadoPagoPix = async (paymentId: string, email: string) => {
  try {
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, email })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao comunicar com MP');
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Falha de conexão.");
  }
};

// Gerador de dados fictícios para teste rápido
export const generateMockData = async () => {
  // Implementação simplificada para o botão de 'Database'
  // Fix: Removed undefined addToast call. Service layer should not handle UI feedback.
};