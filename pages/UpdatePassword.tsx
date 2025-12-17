
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck, ShieldAlert } from '../components/ui/Icons';
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
  
  const { addToast } = useToast();
  const { log } = useDebug();
  const navigate = useNavigate();
  const attemptCount = useRef(0);

  useEffect(() => {
    const activateSessionManually = async () => {
      log("UpdatePassword: Iniciando extração manual de tokens...");
      
      try {
        // 1. Tentar extrair tokens manualmente da URL (independente do HashRouter)
        const fullUrl = window.location.href;
        const hashPart = fullUrl.split('#').pop() || '';
        const searchParams = new URLSearchParams(hashPart.includes('?') ? hashPart.split('?')[1] : hashPart);
        
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          log("Tokens encontrados! Forçando ativação de sessão...");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;
          if (data.session) {
            log(`Sessão ativada manualmente para: ${data.session.user.email}`);
            setSessionValid(true);
            setValidating(false);
            return;
          }
        } else {
          log("Nenhum token manual encontrado no fragmento da URL.");
        }

        // 2. Fallback: Verificar se o SDK já resolveu a sessão sozinho
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          log("Sessão já estava ativa no SDK.");
          setSessionValid(true);
          setValidating(false);
        } else {
          // Se não resolveu, dar mais uma chance (polling curto)
          if (attemptCount.current < 3) {
            attemptCount.current++;
            log(`Tentativa ${attemptCount.current}: Aguardando SDK...`);
            setTimeout(activateSessionManually, 1000);
          } else {
            log("Falha final: Token não pôde ser validado.", "error");
            setSessionValid(false);
            setValidating(false);
          }
        }
      } catch (err: any) {
        log(`Erro na ativação manual: ${err.message}`, "error");
        setSessionValid(false);
        setValidating(false);
      }
    };

    activateSessionManually();
  }, [log]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionValid) {
      addToast("Sessão inválida. Peça um novo link.", "error");
      return;
    }

    if (password.length < 6) {
      addToast("Mínimo de 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    log("Atualizando senha...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        log(`Erro no update: ${error.message}`, "error");
        addToast(error.message, "error");
        setLoading(false);
        return;
      }

      log("Sucesso! Senha alterada.");
      addToast("Senha alterada com sucesso!", "success");
      
      if (onComplete) onComplete();
      navigate('/', { replace: true });
      
    } catch (error: any) {
      log(`Erro inesperado: ${error.message}`, "error");
      addToast("Erro ao salvar senha.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary-900/40 to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
            {validating ? (
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Lock size={32} className={sessionValid ? "text-primary-500" : "text-red-500"} />
            )}
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Nova Senha</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Acesso Seguro</p>
        </div>

        {validating ? (
          <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5">
             <p className="text-zinc-400 text-sm font-medium animate-pulse">Ativando link de segurança...</p>
          </div>
        ) : sessionValid === false ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl space-y-4 shadow-2xl">
            <ShieldAlert size={40} className="mx-auto text-red-500" />
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">
              Link expirado ou corrompido.<br/>Tente gerar um novo acesso.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white/10 text-white font-black text-[10px] uppercase py-3 rounded-xl border border-white/10"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Nova Senha</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : (
                  <>
                    <BadgeCheck size={18} />
                    Salvar Senha
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
