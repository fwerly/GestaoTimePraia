
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck, ShieldAlert, AlertTriangle, Clock } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface Props {
  onComplete?: () => void;
}

export const UpdatePassword: React.FC<Props> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(true);
  const [isClockSkew, setIsClockSkew] = useState(false);
  
  const { addToast } = useToast();
  const { log } = useDebug();
  const navigate = useNavigate();
  const authListener = useRef<any>(null);

  useEffect(() => {
    log("UpdatePassword: Motor v1.17.33 iniciado.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      log(`Evento Auth: ${event}`);
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        log(`Sessão ativa para: ${session.user.email}`);
        setSessionValid(true);
        setValidating(false);
        setIsClockSkew(false);
      }
    });
    authListener.current = subscription;

    const performAuth = async () => {
      try {
        const url = window.location.href;
        const access_token = url.match(/[#&]access_token=([^&]*)/)?.[1];
        const refresh_token = url.match(/[#&]refresh_token=([^&]*)/)?.[1];

        if (access_token && refresh_token) {
          log("Sincronizando tokens...");
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          
          if (error) {
            log(`Erro setSession: ${error.message}`, "error");
            // Detecta o erro de relógio no futuro
            if (error.message.toLowerCase().includes('future') || error.message.toLowerCase().includes('skew')) {
              setIsClockSkew(true);
            }
          }
        }

        // Checagem manual com polling para contornar o delay do clock skew
        let attempts = 0;
        const maxAttempts = 15; // Aumentado para 15 segundos de tolerância

        const checkManual = async () => {
          attempts++;
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            log("Sessão validada via Polling.");
            setSessionValid(true);
            setValidating(false);
            setIsClockSkew(false);
          } else if (attempts < maxAttempts) {
            setTimeout(checkManual, 1000);
          } else {
            log("Timeout de validação atingido.", "error");
            setSessionValid(false);
            setValidating(false);
          }
        };

        checkManual();

      } catch (err: any) {
        log(`Erro crítico: ${err.message}`, "error");
        setSessionValid(false);
        setValidating(false);
      }
    };

    performAuth();

    return () => {
      if (authListener.current) authListener.current.unsubscribe();
    };
  }, [log]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast("Senha muito curta.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      addToast("Senha atualizada!", "success");
      await supabase.auth.signOut();
      if (onComplete) onComplete();
      navigate('/', { replace: true });
    } catch (error: any) {
      log(`Erro Update: ${error.message}`, "error");
      addToast(error.message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary-900/10 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-2xl transition-colors ${
            isClockSkew ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-primary-500/10 border-primary-500/20'
          }`}>
            {validating ? (
              <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isClockSkew ? 'border-yellow-500' : 'border-primary-500'} border-t-transparent`}></div>
            ) : (
              <Lock size={28} className={sessionValid ? "text-primary-500" : "text-red-500"} />
            )}
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">Acesso</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Segurança do Atleta</p>
        </div>

        {validating ? (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
               <p className="text-zinc-400 text-sm font-medium animate-pulse italic">
                 {isClockSkew ? 'Aguardando sincronia do tempo...' : 'Validando credenciais...'}
               </p>
               {isClockSkew && (
                 <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                   <div className="flex items-center justify-center gap-2 text-yellow-500 mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Aviso de Relógio</span>
                   </div>
                   <p className="text-[10px] text-zinc-500 leading-tight">
                     Seu relógio parece estar atrasado em relação ao servidor. <br/>
                     Aguarde alguns instantes ou verifique as configurações do Windows.
                   </p>
                 </div>
               )}
            </div>
          </div>
        ) : sessionValid === false ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl space-y-6 shadow-2xl animate-in zoom-in-95">
            <ShieldAlert size={48} className="mx-auto text-red-500" />
            <div className="space-y-2">
              <p className="text-red-400 text-sm font-bold uppercase tracking-tight italic leading-snug">
                Link de recuperação inválido ou expirado.
              </p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white/5 text-white font-black text-[10px] uppercase py-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors tracking-widest"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-2xl space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 italic">Defina sua nova Senha</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      required
                      minLength={6}
                      autoFocus
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all placeholder:text-zinc-700"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-50 italic"
              >
                {loading ? 'Salvando...' : (
                  <>
                    <BadgeCheck size={18} />
                    Atualizar Agora
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
