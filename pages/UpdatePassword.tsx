
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Lock, BadgeCheck, ShieldCheck, RefreshCw, CheckCircle2, Terminal } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { session, lastEvent, setRecoveryMode, signOut } = useAuth();
  const { addToast } = useToast();
  const { log } = useDebug();
  const navigate = useNavigate();
  
  const isUpdatingRef = useRef(false);
  const successTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading && lastEvent === 'USER_UPDATED') {
      log("Sincronização externa detectada v1.27.0.");
      successTimeoutRef.current = window.setTimeout(() => {
        if (!success) {
          log("Forçando sucesso via evento v1.27.0.");
          completeSuccess();
        }
      }, 1000);
    }
    return () => {
      if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
    };
  }, [lastEvent, loading, success]);

  useEffect(() => {
    const syncSession = async () => {
      if (!session && !success) {
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
          log("Validando tokens v1.27.0...");
          try {
            const params = new URLSearchParams(hash.replace('#', '?'));
            const { error } = await supabase.auth.setSession({
              access_token: params.get('access_token') || '',
              refresh_token: params.get('refresh_token') || ''
            });
            if (error) log("Erro setSession: " + error.message, "error");
            else log("Conectado.");
          } catch (e) {
            log("Erro de token.");
          }
        }
      }
    };
    syncSession();
  }, [session, success, log]);

  const completeSuccess = () => {
    if (success) return;
    setSuccess(true);
    setLoading(false);
    isUpdatingRef.current = false;
    log("ALTERAÇÃO RECONHECIDA v1.27.0.");
    addToast("Senha alterada!", "success");
    
    // Remove hash e limpa histórico para não reativar modo de recuperação ao recarregar
    window.location.hash = ''; 
    window.history.replaceState(null, '', window.location.pathname);
    
    if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast("Mínimo 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    isUpdatingRef.current = true;
    log("Gravando senha v1.27.0...");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        log(`Erro: ${error.message}`, "error");
        addToast(error.message, "error");
        setLoading(false);
        isUpdatingRef.current = false;
        return;
      }

      log("Confirmado pelo servidor.");
      completeSuccess();

    } catch (error: any) {
      log("Falha de rede v1.27.0.", "error");
      addToast("Erro de rede.", "error");
      setLoading(false);
      isUpdatingRef.current = false;
    }
  };

  const handleFinish = async () => {
    log("EXECUTANDO HARD REDIRECT v1.27.0...");
    await signOut(); 
    setRecoveryMode(false);
    // Redirecionamento forçado para garantir que NADA de cache de memória sobreva
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#84cc1610_0%,_transparent_50%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all duration-1000 ${success ? 'bg-primary-500 rotate-0 scale-110' : 'bg-zinc-900 border-2 border-primary-500/20 rotate-3'}`}>
             {success ? (
               <CheckCircle2 size={48} className="text-black" />
             ) : (
               <Lock size={40} className="text-primary-500" />
             )}
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-1">
            {success ? 'SUCESSO' : 'SEGURANÇA'}
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] italic">
            {success ? 'SENHA ATUALIZADA' : 'REDEFINIÇÃO DE ACESSO'}
          </p>
        </div>

        {success ? (
          <div className="bg-zinc-900/60 backdrop-blur-2xl border border-primary-500/30 p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-left">
            <div className="space-y-2">
              <p className="text-zinc-100 text-sm font-black uppercase italic">Tudo pronto!</p>
              <p className="text-zinc-400 text-xs leading-relaxed">Sua conta foi revalidada. Clique abaixo para limpar sua sessão e entrar com a nova senha.</p>
            </div>
            <button 
              onClick={handleFinish}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-5 rounded-2xl shadow-[0_10px_30px_rgba(132,204,22,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 italic"
            >
              LOGAR NOVAMENTE
            </button>
          </div>
        ) : !session ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
             <div className="flex justify-center text-primary-500">
               <RefreshCw size={40} className="animate-spin opacity-50" />
             </div>
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest animate-pulse italic">
               Sincronizando v1.27.0...
             </p>
             <button onClick={() => window.location.reload()} className="text-primary-500 text-[10px] font-black uppercase underline">Recarregar</button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-left">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                 <ShieldCheck size={12} className="text-primary-500" /> Nova Senha
               </label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-4 text-zinc-600 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 dígitos" 
                    required minLength={6} autoFocus
                    disabled={loading}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:border-primary-500 focus:outline-none transition-all placeholder:text-zinc-700 font-bold"
                  />
               </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-5 rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-3 transition-all disabled:opacity-50 italic"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  GRAVANDO...
                </>
              ) : 'ATUALIZAR ACESSO'}
            </button>
          </form>
        )}

        <div className="mt-16 opacity-30 flex items-center justify-center gap-2">
           <Terminal size={10} className="text-zinc-600" />
           <span className="text-zinc-600 text-[9px] uppercase font-black tracking-[0.4em]">Engine Core v1.27.0</span>
        </div>
      </div>
    </div>
  );
};
