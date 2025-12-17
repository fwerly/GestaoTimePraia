
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface Props {
  onComplete?: () => void;
}

export const UpdatePassword: React.FC<Props> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { log } = useDebug();
  const navigate = useNavigate();

  useEffect(() => {
    log("UpdatePassword Montado. Verificando sessão...");
    
    // Pequena pausa para garantir que o SDK leu o hash antes de limparmos
    const timer = setTimeout(() => {
      if (window.location.hash.includes('access_token')) {
        log("Limpando hash da URL para estabilizar SDK...");
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    log("Chamando updateUser...");

    // Se em 8 segundos não responder, mas o evento global disparar, o App.tsx cuidará da saída.
    // Aqui apenas garantimos que o botão não fique travado para sempre se algo falhar silenciosamente.
    const failSafe = setTimeout(() => {
      if (loading) {
        log("Failsafe atingido no formulário. Verificando estado global...", "warn");
        setLoading(false);
      }
    }, 8000);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      clearTimeout(failSafe);

      if (error) {
        log(`Erro no update: ${error.message}`, "error");
        addToast(error.message, "error");
        setLoading(false);
      } else {
        log("Sucesso retornado pela API de Update.");
        addToast("Senha atualizada com sucesso!", "success");
        if (onComplete) onComplete();
        navigate('/', { replace: true });
      }
      
    } catch (error: any) {
      log(`Exceção no formulário: ${error.message}`, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/40 via-transparent to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
            <Lock size={40} className="text-primary-500" />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Arena Segura</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center">Crie sua nova senha de acesso</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Nova Senha</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all font-medium"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <BadgeCheck size={18} />
                  Confirmar Alteração
                </>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 py-2"
            >
              Voltar ao Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
