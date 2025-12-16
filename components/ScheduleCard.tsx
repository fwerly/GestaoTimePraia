import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle2, Edit } from './ui/Icons';
import { Schedule, Profile } from '../types';
import { checkIn, checkOut } from '../services/dataService';
import { useToast } from '../context/ToastContext';

interface ScheduleCardProps {
  schedule: Schedule;
  currentUser: Profile;
  onUpdate: () => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (schedule: Schedule) => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, currentUser, onUpdate, isAdmin, onDelete, onEdit }) => {
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
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-5 mb-5 relative group border border-white/5 shadow-xl hover:bg-zinc-900/50 transition-colors">
      
      {/* Top Section: Date & Info */}
      <div className="flex gap-4 mb-4">
        {/* Date Box */}
        <div className="flex flex-col items-center justify-center bg-black/40 rounded-2xl w-16 h-16 border border-white/5 shadow-inner">
          <span className="text-[10px] font-black italic text-zinc-500">{dayName.replace('.','')}</span>
          <span className="text-2xl font-black text-white italic">{dayNumber}</span>
        </div>

        {/* Info */}
        <div className="flex-1 py-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-white font-black italic text-xl leading-none mb-2 tracking-wide">
                {timeString}
              </div>
              <div className="flex items-center text-xs font-bold text-zinc-400 bg-black/30 px-2 py-1 rounded-md inline-flex border border-white/5">
                <MapPin size={12} className="mr-1 text-primary-400" />
                {schedule.location}
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1">
                 {onEdit && (
                    <button 
                      onClick={() => onEdit(schedule)}
                      className="bg-black/40 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors p-2 rounded-full border border-white/5"
                    >
                      <Edit size={14} />
                    </button>
                 )}
                 <button 
                  onClick={() => onDelete && onDelete(schedule.id)}
                  className="bg-black/40 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors p-2 rounded-full border border-white/5"
                 >
                   <span className="text-[10px] font-bold uppercase tracking-widest px-1">X</span>
                 </button>
              </div>
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
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-zinc-800 object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
                />
              ))}
              {attendees.length > 0 && (
                 <button 
                  onClick={() => setShowAttendees(!showAttendees)}
                  className="h-8 w-8 rounded-full bg-black/60 ring-2 ring-black flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                 >
                   {showAttendees ? 'x' : `+${Math.max(0, attendees.length - 5)}`}
                 </button>
              )}
              {attendees.length === 0 && (
                <span className="text-xs text-zinc-600 font-medium italic">Seja o primeiro!</span>
              )}
           </div>
           
           <div className="text-right">
             <span className={`text-sm font-black italic ${isFull ? 'text-red-500' : 'text-primary-400'}`}>
               {isFull ? 'LOTADO' : availableSpots}
             </span>
             <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wide">
               {isFull ? 'Sem vagas' : 'Vagas restantes'}
             </span>
           </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 shadow-[0_0_15px_currentColor] ${isFull ? 'bg-red-500 text-red-500' : 'bg-primary-500 text-primary-500'}`}
              style={{ width: `${(spotsTaken / schedule.limit_count) * 100}%` }}
            ></div>
        </div>
      </div>

      {/* Expanded List */}
      {showAttendees && (
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 mb-4 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Lista de Presença</h4>
            <div className="grid grid-cols-2 gap-2">
              {attendees.map(att => (
                <div key={att.id} className="flex items-center gap-2 text-xs text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_5px_rgba(132,204,22,0.8)]"></div>
                  <span className="font-medium">{att.profile?.full_name.split(' ')[0]}</span>
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
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider italic flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isCheckedIn 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : isFull 
                ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-white/5'
                : 'bg-primary-500 text-black hover:bg-primary-400 shadow-[0_0_20px_rgba(132,204,22,0.3)] border border-primary-400'
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