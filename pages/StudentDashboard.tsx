import React, { useEffect, useState } from 'react';
import { Schedule, Profile } from '../types';
import { getSchedules } from '../services/dataService';
import { ScheduleCard } from '../components/ScheduleCard';
import { Clock } from 'lucide-react';

interface Props {
  user: Profile;
}

export const StudentDashboard: React.FC<Props> = ({ user }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    const data = await getSchedules();
    setSchedules(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div>
      <div className="mb-8 flex justify-between items-end px-1">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">Próximos<br/><span className="text-primary-500">Treinos</span></h2>
        </div>
        <button 
          onClick={fetchSchedules}
          className="text-[10px] font-black italic uppercase tracking-wider text-black bg-primary-500 px-4 py-2 rounded-xl hover:bg-primary-400 transition-colors shadow-[0_0_15px_rgba(132,204,22,0.3)] active:scale-95 border border-primary-400"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-5">
           {[1,2,3].map(i => (
             <div key={i} className="h-40 bg-zinc-900/40 rounded-3xl animate-pulse border border-white/5"></div>
           ))}
        </div>
      ) : (
        <div className="pb-10">
          {schedules.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
               <div className="w-24 h-24 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center mb-4 text-zinc-600 rotate-3">
                 <Clock size={48} />
               </div>
               <h3 className="text-zinc-400 font-bold text-lg mb-1 uppercase tracking-wider">Agenda Vazia</h3>
               <p className="text-zinc-600 text-sm">Aguarde o treinador liberar novos horários.</p>
             </div>
          ) : (
            schedules.map(schedule => (
              <ScheduleCard 
                key={schedule.id}
                schedule={schedule}
                currentUser={user}
                onUpdate={fetchSchedules}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};