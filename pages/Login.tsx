import React from 'react';
import { MOCK_USER_STUDENT, MOCK_USER_ADMIN } from '../services/mockData';
import { Profile } from '../types';

interface LoginProps {
  onLogin: (user: Profile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-accent-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(132,204,22,0.4)] rotate-3">
          <span className="text-5xl drop-shadow-md">🏐</span>
        </div>
        
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Gestao<span className="text-primary-400">Time</span></h1>
        <p className="text-zinc-400 mb-12 text-center font-medium">Domine a areia.<br/>Gerencie seus treinos.</p>

        <div className="space-y-4 w-full">
          <button 
            onClick={() => onLogin(MOCK_USER_STUDENT)}
            className="group w-full bg-surface border border-zinc-700 hover:border-primary-500 text-white p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(132,204,22,0.15)]"
          >
            <div className="relative">
                <img src={MOCK_USER_STUDENT.avatar_url} className="w-12 h-12 rounded-full border-2 border-zinc-600 group-hover:border-primary-400 transition-colors" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-surface"></div>
            </div>
            <div className="text-left">
                <div className="font-bold text-lg">Sou Aluno</div>
                <div className="text-xs text-zinc-500 font-medium">Acessar agenda e check-ins</div>
            </div>
          </button>

          <button 
            onClick={() => onLogin(MOCK_USER_ADMIN)}
            className="group w-full bg-surface border border-zinc-700 hover:border-accent-500 text-white p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
          >
            <div className="relative">
                <img src={MOCK_USER_ADMIN.avatar_url} className="w-12 h-12 rounded-full border-2 border-zinc-600 group-hover:border-accent-400 transition-colors" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-500 rounded-full border border-surface"></div>
            </div>
            <div className="text-left">
                <div className="font-bold text-lg">Sou Coach</div>
                <div className="text-xs text-zinc-500 font-medium">Gerenciar time e horários</div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Indicador de Versão */}
      <div className="absolute bottom-6 text-zinc-700 font-mono text-[10px] uppercase tracking-widest opacity-50">
        v1.4
      </div>
    </div>
  );
};