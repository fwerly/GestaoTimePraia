
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Lock, BadgeCheck, Clock, AlertTriangle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, setRecoveryMode, signOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast("Mínimo 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      addToast("Senha redefinida!", "success");
      await signOut(); // Força relogin para garantir sessão limpa
      setRecoveryMode(false);
      navigate('/', { replace: true });
    } catch (error: any) {
      addToast(error.message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-500/10 border-2 border-primary-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
             <Lock size={32} className="text-primary-500" />
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Segurança</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Atualização de Perfil</p>
        </div>

        {!session ? (
          <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 space-y-4">
             <div className="flex justify-center text-yellow-500 mb-2">
               <AlertTriangle size={32} />
             </div>
             <p className="text-zinc-400 text-sm font-bold uppercase tracking-tight italic">
               Aguardando validação da sessão...
             </p>
             <p className="text-zinc-600 text-[10px]">
               Se este aviso persistir, o link pode ter expirado ou seu relógio está atrasado.
             </p>
             <button onClick={() => window.location.reload()} className="text-primary-500 text-[10px] font-black uppercase underline">Recarregar</button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-2xl space-y-5 text-left animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 italic">Defina sua Nova Senha</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required minLength={6} autoFocus
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  />
               </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-50 italic"
            >
              {loading ? 'Salvando...' : (
                <>
                  <BadgeCheck size={18} />
                  Confirmar Nova Senha
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
