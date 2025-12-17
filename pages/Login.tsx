
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Mail, Lock, Trophy } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface LoginProps {
  onLogin: (profile: any) => void;
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
    log(`Tentativa de Login Arena: ${email}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.session) {
        addToast("Acesso Liberado! 🚀", "success");
      }
    } catch (error: any) {
      log(`Erro no Login: ${error.message}`, 'error');
      addToast(error.message || "Acesso negado.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/30 via-transparent to-transparent opacity-60"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-primary-500 blur-[50px] opacity-20 rounded-full animate-pulse"></div>
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-[2.2rem] flex items-center justify-center relative rotate-3 shadow-2xl">
             <Trophy size={44} className="text-primary-500" />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic uppercase">
            Gestao<span className="text-primary-500">Time</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] italic">High Performance Engine</p>
        </div>

        <div className="w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 italic">Login do Atleta</label>
               <div className="relative group">
                  <Mail className="absolute left-4 top-4 text-zinc-600 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    required
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:border-primary-500 focus:outline-none transition-all placeholder:text-zinc-700 font-bold"
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 italic">Senha de Acesso</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-4 text-zinc-600 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    required
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:border-primary-500 focus:outline-none transition-all placeholder:text-zinc-700 font-bold"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-5 rounded-2xl shadow-[0_0_30px_rgba(132,204,22,0.2)] mt-4 transition-all active:scale-95 flex items-center justify-center gap-2 italic"
            >
              {loading ? 'Acessando...' : 'Entrar na Arena'}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">
            Novo Atleta? <Link to="/register" className="text-white font-black hover:text-primary-500 transition-colors border-b-2 border-primary-500/30 pb-0.5">Criar Perfil</Link>
          </p>
        </div>

        <div className="mt-16 opacity-30 group cursor-default">
           <span className="text-zinc-600 text-[9px] uppercase font-black tracking-[0.4em] group-hover:text-primary-500 transition-colors">Engine Core v1.21.0</span>
        </div>
      </div>
    </div>
  );
};
