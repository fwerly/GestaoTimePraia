
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      addToast("Senha atualizada com sucesso! Acesso liberado.", "success");
      // Após atualizar a senha o usuário já está logado
      navigate('/');
    } catch (error: any) {
      addToast(error.message || "Erro ao atualizar senha.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/40 via-transparent to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20 shadow-[0_0_30px_rgba(132,204,22,0.2)]">
            <Lock size={40} className="text-primary-500" />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Nova Senha</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Defina sua nova credencial de acesso</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Senha de Acesso</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all font-medium placeholder:text-zinc-700"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Atualizando...' : (
                <>
                  <BadgeCheck size={18} />
                  Confirmar Nova Senha
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase font-black tracking-widest">
          Ambiente de Segurança GestaoTime
        </p>
      </div>
    </div>
  );
};
