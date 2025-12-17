
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { MOCK_USER_ADMIN, MOCK_USER_STUDENT } from '../services/mockData';
import { Profile } from '../types';
import { Mail, Lock, Trophy } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface LoginProps {
  onLogin: (user: Profile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { log } = useDebug();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    log(`Login: ${email}`);

    // Bypass Admin para testes locais/emergência
    if (email === 'admin' && password === 'admin') {
      onLogin(MOCK_USER_ADMIN);
      addToast("Bem-vindo, Treinador!", "success");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
        
        if (pError) log(`Erro Perfil: ${pError.message}`, 'error');

        if (profile) {
          onLogin(profile as Profile);
          addToast(`Bora pro treino! 🚀`, "success");
        } else {
          addToast("Perfil não configurado.", "error");
        }
      }
    } catch (error: any) {
      log(`Erro Auth: ${error.message}`, 'error');
      addToast(error.message || "Acesso negado.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/40 via-transparent to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-primary-500 blur-[40px] opacity-20 rounded-full"></div>
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center relative rotate-3 shadow-2xl">
             <Trophy size={40} className="text-primary-500" />
          </div>
        </div>
        
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic uppercase text-center">
          Gestao<span className="text-primary-500">Time</span>
        </h1>
        <p className="text-zinc-400 mb-10 text-center font-medium uppercase text-xs tracking-widest">Performance . Foco . Disciplina</p>

        <div className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">E-mail</label>
               <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Senha</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg mt-4 transition-all active:scale-95"
            >
              {loading ? 'Entrando...' : 'Entrar na Arena'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Novo no time? <Link to="/register" className="text-white font-bold hover:text-primary-500 transition-colors border-b-2 border-primary-500/30 pb-0.5">Criar Conta</Link>
          </p>
        </div>

        <div className="absolute bottom-6 opacity-40">
           <span className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em]">System v1.17.25</span>
        </div>
      </div>
    </div>
  );
};
