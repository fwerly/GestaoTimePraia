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

// --- GESTÃO DE USUÁRIOS (NOVO) ---

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

export const deleteUserProfile = async (userId: string): Promise<void> => {
  console.log("Iniciando exclusão forçada do usuário:", userId);

  // 1. Limpeza Explícita de Checkins
  const { error: errCheckins } = await supabase.from('checkins').delete().eq('user_id', userId);
  if (errCheckins) console.warn("Checkins warning:", errCheckins);
  
  // 2. Limpeza Explícita de Pagamentos
  const { error: errPayments } = await supabase.from('payments').delete().eq('student_id', userId);
  if (errPayments) console.warn("Payments warning:", errPayments);

  // 3. Excluir o Perfil E VERIFICAR se foi excluído
  // O .select() garante que retornamos os dados excluídos. Se voltar vazio, o RLS bloqueou.
  const { data, error } = await supabase.from('profiles').delete().eq('id', userId).select();

  if (error) {
    console.error("Erro fatal ao excluir perfil:", error);
    
    if (error.code === '42883') {
       throw new Error("ERRO SQL: Conflito UUID vs Texto. Rode o script de correção.");
    }
    if (error.code === '42501') {
       throw new Error("PERMISSÃO NEGADA: Você não tem permissão para excluir este usuário.");
    }
    throw new Error(error.message || "Erro desconhecido ao excluir perfil.");
  }

  // Verificação de segurança: Se data for vazio, o banco disse "OK" mas não apagou nada (RLS)
  if (!data || data.length === 0) {
     throw new Error("Exclusão ignorada pelo Banco. Verifique se você é Admin e se as Políticas RLS estão atualizadas.");
  }
  
  console.log("Perfil excluído com sucesso.");
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

    const contentType = response.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON API Response:", text);
      throw new Error(`Erro API (Status ${response.status}): Resposta inválida do servidor.`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erro MP: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error: any) {
    console.error("Erro no Service:", error);
    throw new Error(error.message || "Falha de conexão.");
  }
};

// --- HELPER DE DADOS DE TESTE ---

export const generateMockData = async () => {
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
  if (err1) throw new Error('Falha ao criar alunos');

  const payments = [
    {
      student_id: mockStudents[0].id,
      description: 'Mensalidade Abril (Atrasada)',
      amount: 150.00,
      status: 'overdue',
      due_date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    },
    {
      student_id: mockStudents[1].id,
      description: 'Mensalidade Março (Muito Atrasada)',
      amount: 150.00,
      status: 'overdue',
      due_date: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString(),
    },
    {
      student_id: mockStudents[2].id,
      description: 'Torneio Interno',
      amount: 80.00,
      status: 'pending',
      due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    },
    {
      student_id: mockStudents[0].id,
      description: 'Uniforme 2024',
      amount: 120.00,
      status: 'pending',
      due_date: new Date().toISOString(),
    }
  ];

  const { error: err2 } = await supabase.from('payments').insert(payments);
  if (err2) throw new Error('Falha ao criar pagamentos');
};