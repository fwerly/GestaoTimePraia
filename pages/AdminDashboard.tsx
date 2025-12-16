import React, { useState, useEffect } from 'react';
import { Schedule, Profile } from '../types';
import { getSchedules, createSchedule, deleteSchedule } from '../services/dataService';
import { ScheduleCard } from '../components/ScheduleCard';
import { Plus, XCircle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const AdminDashboard: React.FC<Props> = ({ user }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!date || !startTime || !endTime) return;

    try {
      const startIso = new Date(`${date}T${startTime}`).toISOString();
      const endIso = new Date(`${date}T${endTime}`).toISOString();

      await createSchedule({
        start_time: startIso,
        end_time: endIso,
        location,
        limit_count: limit,
        status: 'active'
      });

      addToast("Agendado com sucesso!", "success");
      setIsCreating(false);
      setStartTime('');
      setEndTime('');
      refresh();
    } catch (error) {
      console.error(error);
      addToast("Erro ao criar. Verifique os dados.", "error");
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
          <h1 className="text-3xl font-black text-white tracking-tight">Painel<br/><span className="text-accent-500">Coach</span></h1>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-accent-500 text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-95 transition-all hover:bg-accent-400"
        >
          <Plus size={24} />
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface p-6 rounded-3xl shadow-2xl border border-white/10 mb-8 animate-in slide-in-from-top-4 relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-white">Novo Treino</h3>
            <button onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white"><XCircle size={24} /></button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Data</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} 
                className="w-full p-4 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:border-accent-500 focus:outline-none transition-colors appearance-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Início</label>
                <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} 
                  className="w-full p-4 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:border-accent-500 focus:outline-none transition-colors appearance-none" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Fim</label>
                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} 
                  className="w-full p-4 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:border-accent-500 focus:outline-none transition-colors appearance-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Local</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} 
                className="w-full p-4 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:border-accent-500 focus:outline-none transition-colors placeholder-zinc-700" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Vagas</label>
              <input type="number" required value={limit} onChange={e => setLimit(Number(e.target.value))} 
                className="w-full p-4 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:border-accent-500 focus:outline-none transition-colors" />
            </div>
            <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors">
              CRIAR AGENDAMENTO
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
          />
        ))}
        {schedules.length === 0 && !isCreating && (
          <div className="text-center py-10 text-zinc-600 text-sm font-medium">
            Nenhum treino na lista.
          </div>
        )}
      </div>
    </div>
  );
};