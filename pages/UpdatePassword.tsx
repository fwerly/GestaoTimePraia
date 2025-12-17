
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
  const checkInterval = useRef<any>(null);

  useEffect(() => {
    const performAuth = async () => {
      log("UpdatePassword: Iniciando validação de segurança...");
      
      try {
        const url = window.location.href;
        
        // Extração via Regex (mais segura para URLs complexas com HashRouter)
        const access_token = url.match(/[#&]access_token=([^&]*)/)?.[1];
        const refresh_token = url.match(/[#&]refresh_token=([^&]*)/)?.[1];

        if (access_token && refresh_token) {
          log("Tokens detectados na URL. Sincronizando com Supabase...");
          
          // Tentamos setar a sessão. Não bloqueamos caso o retorno demore.
          supabase.auth.setSession({ access_token, refresh_token }).catch(e => {
            log(`Erro ao setar sessão: ${e.message}`, "error");
          });
        }

        // Aguardamos um pouco para que o SDK processe os tokens
        let attempts = 0;
        const maxAttempts = 5;

        const checkSession = async () => {
          attempts++;
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            log(`Sessão confirmada para: ${session.user.email}`);
            setSessionValid(true);
            setValidating(false);
            if (checkInterval.current) clearInterval(checkInterval.current);
          } else if (attempts >= maxAttempts) {
            log("Falha: Sessão não pôde ser validada após várias tentativas.", "error");
            setSessionValid(false);
            setValidating(false);
            if (checkInterval.current) clearInterval(checkInterval.current);
          } else {
            log(`Tentativa ${attempts}: Aguardando sessão...`);
          }
        };

        // Inicia checagem imediata e depois via intervalo
        await checkSession();
        if (validating) {
           checkInterval.current = setInterval(checkSession, 1000);
        }

      } catch (err: any) {
        log(`Erro crítico de validação: ${err.message}`, "error");
        setSessionValid(false);
        setValidating(false);
      }
    };

    performAuth();

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [log]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      addToast("A senha precisa de 6+ caracteres.", "error");
      return;
    }

    setLoading(true);
    log("Salvando nova senha...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        log(`Erro no Supabase: ${error.message}`, "error");
        addToast(error.message, "error");
        setLoading(false);
        return;
      }

      log("Sucesso: Senha redefinida!");
      addToast("Senha alterada! Entre com suas novas credenciais.", "success");
      
      // Limpa sessão para forçar novo login com a senha nova e garantir estado limpo
      await supabase.auth.signOut();
      
      if (onComplete) onComplete();
      navigate('/', { replace: true });
      
    } catch (error: any) {
      log(`Erro inesperado: ${error.message}`, "error");
      addToast("Erro ao processar alteração.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary-900/40 to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20 shadow-2xl">
            {validating ? (
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Lock size={32} className={sessionValid ? "text-primary-500" : "text-red-500"} />
            )}
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Acesso</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Recuperação de Conta</p>
        </div>

        {validating ? (
          <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
             <p className="text-zinc-400 text-sm font-medium animate-pulse italic">Validando credenciais...</p>
             <p className="text-[10px] text-zinc-600 mt-2 font-bold uppercase tracking-tighter">Isto pode levar alguns segundos</p>
          </div>
        ) : sessionValid === false ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl space-y-5 shadow-2xl">
            <ShieldAlert size={48} className="mx-auto text-red-500" />
            <p className="text-red-400 text-sm font-bold uppercase tracking-tight leading-snug">
              Link inválido ou expirado.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white/10 text-white font-black text-xs uppercase py-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Crie sua nova Senha</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      required
                      minLength={6}
                      autoFocus
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? 'Salvando...' : (
                  <>
                    <BadgeCheck size={18} />
                    Atualizar Senha
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
