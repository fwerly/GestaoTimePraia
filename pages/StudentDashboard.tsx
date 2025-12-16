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
          <h2 className="text-3xl font-black text-white tracking-tight">Próximos<br/><span className="text-primary-400">Treinos</span></h2>
        </div>
        <button 
          onClick={fetchSchedules}
          className="text-xs font-bold text-black bg-primary-500 px-4 py-2 rounded-full hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20 active:scale-95"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-5">
           {[1,2,3].map(i => (
             <div key={i} className="h-40 bg-surface rounded-3xl animate-pulse border border-white/5"></div>
           ))}
        </div>
      ) : (
        <div className="pb-10">
          {schedules.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
               <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                 <Clock size={40} />
               </div>
               <h3 className="text-zinc-400 font-bold text-lg mb-1">Agenda Vazia</h3>
               <p className="text-zinc-600 text-sm">Aguarde o coach liberar novos horários.</p>
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