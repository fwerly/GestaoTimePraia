import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Trophy, Wallet } from './ui/Icons';
import { Profile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Profile | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const handleNav = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col max-w-md mx-auto relative">
      {/* Top Bar - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-30 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 flex items-center justify-center text-black font-black text-sm shadow-[0_0_15px_rgba(132,204,22,0.4)]">
            GT
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Gestao<span className="text-primary-400">Time</span></span>
        </div>
        
        <div className="flex items-center gap-3">
           {user.role === 'admin' && (
             <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider">
               COACH
             </span>
           )}
           <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors">
             <LogOut size={18} />
           </button>
        </div>
      </header>

      {/* Main Content Area - Padding for fixed header/footer */}
      <main className="flex-1 pt-20 pb-28 px-5 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation - Floating Glass Bar */}
      <nav className="fixed bottom-6 left-4 right-4 max-w-[calc(100%-2rem)] md:max-w-[26rem] mx-auto bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl py-3 px-6 flex justify-between items-center z-40 shadow-2xl shadow-black/50">
        
        <button 
          onClick={() => handleNav(user.role === 'admin' ? '/admin' : '/student')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 w-16 ${isActive(user.role === 'admin' ? 'admin' : 'student') && !isActive('finance') ? 'text-primary-400 scale-110' : 'text-zinc-500'}`}
        >
          {user.role === 'admin' ? <Calendar size={22} /> : <Trophy size={22} />}
          <span className="text-[10px] font-bold">Inicio</span>
        </button>

        <button 
          onClick={() => handleNav(user.role === 'admin' ? '/admin/finance' : '/student/finance')}
          className={`relative flex flex-col items-center gap-1 transition-all duration-300 w-16 ${isActive('finance') ? 'text-primary-400 scale-110' : 'text-zinc-500'}`}
        >
          <Wallet size={22} />
          <span className="text-[10px] font-bold">Finanças</span>
          {isActive('finance') && (
            <span className="absolute -bottom-2 w-1 h-1 bg-primary-400 rounded-full shadow-[0_0_10px_#84cc16]"></span>
          )}
        </button>

        <button 
          className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-all w-16"
        >
          <div className="p-0.5 rounded-full border border-zinc-600">
             <img src={user.avatar_url} alt="Profile" className="w-5 h-5 rounded-full" />
          </div>
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </nav>
    </div>
  );
};