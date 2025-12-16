import React, { useState, useEffect } from 'react';
import { Schedule, Profile } from '../types';
import { getSchedules, createSchedule, deleteSchedule, updateSchedule } from '../services/dataService';
import { ScheduleCard } from '../components/ScheduleCard';
import { Plus, XCircle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const AdminDashboard: React.FC<Props> = ({ user }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { addToast } = useToast();
  
  // Form State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('Arena Copacabana');
  const [limit, setLimit] = useState(12);

  const refresh = async () => {
    const data = await getSchedules();
    setSchedules(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('Arena Copacabana');
    setLimit(12);
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingId(schedule.id);
    
    // Convert ISO to Input format
    const start = new Date(schedule.start_time);
    const end = new Date(schedule.end_time);
    
    setDate(start.toISOString().split('T')[0]);
    // Format HH:MM for input type="time"
    setStartTime(start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setEndTime(end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    
    setLocation(schedule.location);
    setLimit(schedule.limit_count);
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!date || !startTime || !endTime) return;

    try {
      // Reconstruct ISO strings
      // Note: This simple reconstruction assumes browser local time, which is consistent with the inputs
      const startIso = new Date(`${date}T${startTime}`).toISOString();
      const endIso = new Date(`${date}T${endTime}`).toISOString();

      const payload = {
        start_time: startIso,
        end_time: endIso,
        location,
        limit_count: limit,
        status: 'active' as const
      };

      if (editingId) {
        await updateSchedule(editingId, payload);
        addToast("Treino atualizado!", "success");
      } else {
        await createSchedule(payload);
        addToast("Agendado com sucesso!", "success");
      }

      setIsModalOpen(false);
      refresh();
    } catch (error) {
      console.error(error);
      addToast("Erro ao salvar. Verifique os dados.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Cancelar este treino?')) {
      try {
        await deleteSchedule(id);
        addToast("Treino cancelado.", "success");
        refresh();
      } catch (error) {
        addToast("Erro ao excluir.", "error");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8 px-1">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">Gestão<br/><span className="text-accent-500">de Turmas</span></h1>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-accent-500 text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-95 transition-all hover:bg-accent-400 border border-accent-400"
        >
          <Plus size={24} />
        </button>
      </div>

      {isModalOpen && (
        <div className="bg-zinc-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 mb-8 animate-in slide-in-from-top-4 relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl text-white italic uppercase tracking-wide">
                {editingId ? 'Editar Treino' : 'Novo Treino'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><XCircle size={24} /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">Data</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} 
                className="w-full p-4 bg-black/40 text-white rounded-xl border border-white/5 focus:border-accent-500 focus:outline-none transition-colors appearance-none font-bold" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">Início</label>
                <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} 
                  className="w-full p-4 bg-black/40 text-white rounded-xl border border-white/5 focus:border-accent-500 focus:outline-none transition-colors appearance-none font-bold" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">Fim</label>
                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} 
                  className="w-full p-4 bg-black/40 text-white rounded-xl border border-white/5 focus:border-accent-500 focus:outline-none transition-colors appearance-none font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">Local</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} 
                className="w-full p-4 bg-black/40 text-white rounded-xl border border-white/5 focus:border-accent-500 focus:outline-none transition-colors placeholder-zinc-700 font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">Vagas</label>
              <input type="number" required value={limit} onChange={e => setLimit(Number(e.target.value))} 
                className="w-full p-4 bg-black/40 text-white rounded-xl border border-white/5 focus:border-accent-500 focus:outline-none transition-colors font-bold" />
            </div>
            <button type="submit" className="w-full bg-white text-black font-black italic uppercase tracking-wider py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors shadow-lg">
              {editingId ? 'Salvar Alterações' : 'Criar Agendamento'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-5 pb-20">
        {schedules.map(schedule => (
          <ScheduleCard 
            key={schedule.id}
            schedule={schedule}
            currentUser={user}
            isAdmin={true}
            onUpdate={refresh}
            onDelete={handleDelete}
            onEdit={openEditModal}
          />
        ))}
        {schedules.length === 0 && !isModalOpen && (
          <div className="text-center py-10 text-zinc-600 text-sm font-medium">
            Nenhum treino na lista.
          </div>
        )}
      </div>
    </div>
  );
};