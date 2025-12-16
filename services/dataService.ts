import { supabase } from '../utils/supabaseClient';
import { Schedule, Checkin, Profile, Payment } from '../types';

// ... (existing functions keep unchanged)

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

// --- FUNÇÕES FINANCEIRAS & MERCADO PAGO ---

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

    // Verifica se a resposta é JSON. Se estiver rodando no Vite local sem 'vercel dev', 
    // ele pode retornar o index.html (text/html), o que causaria erro no JSON.parse.
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("API Backend não encontrada. Se estiver local, use 'vercel dev' ou faça deploy.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao gerar Pix no Mercado Pago');
    }

    return data;
  } catch (error: any) {
    console.error("Erro MP:", error);
    throw new Error(error.message || "Erro de conexão com API");
  }
};

// --- HELPER DE DADOS DE TESTE ---

export const generateMockData = async () => {
  // 1. Criar Alunos Fictícios
  const mockStudents = [
    { 
      id: `mock-${Math.random().toString(36).substr(2, 9)}`, 
      full_name: 'Carlos Oliveira', 
      role: 'student', 
      avatar_url: 'https://i.pravatar.cc/150?u=carlos' 
    },
    { 
      id: `mock-${Math.random().toString(36).substr(2, 9)}`, 
      full_name: 'Fernanda Lima', 
      role: 'student', 
      avatar_url: 'https://i.pravatar.cc/150?u=fernanda' 
    },
    { 
      id: `mock-${Math.random().toString(36).substr(2, 9)}`, 
      full_name: 'Roberto Firmino', 
      role: 'student', 
      avatar_url: 'https://i.pravatar.cc/150?u=roberto' 
    }
  ];

  const { error: err1 } = await supabase.from('profiles').upsert(mockStudents);
  if (err1) {
    console.error('Erro ao criar alunos:', err1);
    throw new Error('Falha ao criar alunos');
  }

  // 2. Criar Pagamentos (Vencidos e Normais)
  const payments = [
    {
      student_id: mockStudents[0].id,
      description: 'Mensalidade Abril (Atrasada)',
      amount: 150.00,
      status: 'overdue',
      due_date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(), // 15 dias atrás
    },
    {
      student_id: mockStudents[1].id,
      description: 'Mensalidade Março (Muito Atrasada)',
      amount: 150.00,
      status: 'overdue',
      due_date: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString(), // 45 dias atrás
    },
    {
      student_id: mockStudents[2].id,
      description: 'Torneio Interno',
      amount: 80.00,
      status: 'pending',
      due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), // Futuro
    },
    {
      student_id: mockStudents[0].id,
      description: 'Uniforme 2024',
      amount: 120.00,
      status: 'pending',
      due_date: new Date().toISOString(), // Hoje
    }
  ];

  const { error: err2 } = await supabase.from('payments').insert(payments);
  if (err2) {
    console.error('Erro ao criar pagamentos:', err2);
    throw new Error('Falha ao criar pagamentos');
  }
};