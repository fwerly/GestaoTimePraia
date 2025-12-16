import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle2 } from './ui/Icons';
import { Schedule, Profile } from '../types';
import { checkIn, checkOut } from '../services/dataService';
import { useToast } from '../context/ToastContext';

interface ScheduleCardProps {
  schedule: Schedule;
  currentUser: Profile;
  onUpdate: () => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, currentUser, onUpdate, isAdmin, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const { addToast } = useToast();

  const attendees = schedule.checkins || [];
  const isCheckedIn = attendees.some(c => c.user_id === currentUser.id);
  const spotsTaken = attendees.length;
  const isFull = spotsTaken >= schedule.limit_count;
  const availableSpots = schedule.limit_count - spotsTaken;

  const startDate = new Date(schedule.start_time);
  const endDate = new Date(schedule.end_time);

  const dayName = startDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
  const dayNumber = startDate.getDate();
  const timeString = `${startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isCheckedIn) {
        await checkOut(schedule.id, currentUser.id);
        addToast("Presença cancelada.", "success");
      } else {
        await checkIn(schedule.id, currentUser);
        addToast("Presença confirmada!", "success");
      }
      onUpdate();
    } catch (error) {
      console.error(error);
      addToast("Erro ao atualizar presença.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl p-5 mb-5 relative group border border-white/5 shadow-lg">
      
      {/* Top Section: Date & Info */}
      <div className="flex gap-4 mb-4">
        {/* Date Box */}
        <div className="flex flex-col items-center justify-center bg-zinc-800/50 rounded-2xl w-16 h-16 border border-white/5">
          <span className="text-[10px] font-bold text-zinc-500">{dayName.replace('.','')}</span>
          <span className="text-2xl font-black text-white">{dayNumber}</span>
        </div>

        {/* Info */}
        <div className="flex-1 py-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-white font-bold text-xl leading-none mb-2">
                {timeString}
              </div>
              <div className="flex items-center text-xs font-medium text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded-md inline-flex">
                <MapPin size={12} className="mr-1 text-primary-400" />
                {schedule.location}
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => onDelete && onDelete(schedule.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">Excluir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Status */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
           <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
              {attendees.slice(0, 5).map((att) => (
                <img 
                  key={att.id}
                  src={att.profile?.avatar_url}
                  alt={att.profile?.full_name}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-zinc-800 object-cover"
                />
              ))}
              {attendees.length > 0 && (
                 <button 
                  onClick={() => setShowAttendees(!showAttendees)}
                  className="h-8 w-8 rounded-full bg-zinc-800 ring-2 ring-surface flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:bg-zinc-700 transition-colors"
                 >
                   {showAttendees ? 'x' : `+${Math.max(0, attendees.length - 5)}`}
                 </button>
              )}
              {attendees.length === 0 && (
                <span className="text-xs text-zinc-600 font-medium italic">Seja o primeiro!</span>
              )}
           </div>
           
           <div className="text-right">
             <span className={`text-sm font-black ${isFull ? 'text-red-500' : 'text-primary-400'}`}>
               {isFull ? 'LOTADO' : availableSpots}
             </span>
             <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wide">
               {isFull ? 'Sem vagas' : 'Vagas restantes'}
             </span>
           </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor] ${isFull ? 'bg-red-500 text-red-500' : 'bg-primary-500 text-primary-500'}`}
              style={{ width: `${(spotsTaken / schedule.limit_count) * 100}%` }}
            ></div>
        </div>
      </div>

      {/* Expanded List */}
      {showAttendees && (
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 mb-4 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Lista de Presença</h4>
            <div className="grid grid-cols-2 gap-2">
              {attendees.map(att => (
                <div key={att.id} className="flex items-center gap-2 text-xs text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  {att.profile?.full_name.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
      )}

      {/* Main Action Button */}
      {!isAdmin && (
        <button
          onClick={handleAction}
          disabled={loading || (!isCheckedIn && isFull)}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isCheckedIn 
              ? 'bg-zinc-800 text-red-400 border border-red-900/30 hover:bg-red-900/20'
              : isFull 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                : 'bg-primary-500 text-black hover:bg-primary-400 shadow-[0_0_20px_rgba(132,204,22,0.25)]'
          }`}
        >
          {loading ? (
            <span className="animate-pulse">Processando...</span>
          ) : isCheckedIn ? (
            <>Sair do Treino</>
          ) : isFull ? (
            <>Lista de Espera</>
          ) : (
            <>
              <CheckCircle2 size={18} className="text-black" />
              Confirmar Presença
            </>
          )}
        </button>
      )}
    </div>
  );
};