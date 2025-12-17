
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck, AlertTriangle, ShieldAlert } from '../components/ui/Icons';
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
  const pollCount = useRef(0);

  useEffect(() => {
    log("UpdatePassword: Iniciando verificação de sessão segura...");
    
    // Polling de sessão: Verifica a cada 1s por até 8s
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        log(`Sessão ativa encontrada para: ${session.user.email}`);
        setSessionValid(true);
        setValidating(false);
        return true;
      }
      
      pollCount.current += 1;
      log(`Tentativa ${pollCount.current}: Sessão ainda não detectada no SDK.`);
      
      if (pollCount.current >= 8) {
        log("Erro: Excedido tempo limite para detecção do token de recuperação.", "error");
        setSessionValid(false);
        setValidating(false);
        return false;
      }
      
      return null;
    };

    const interval = setInterval(async () => {
      const result = await checkSession();
      if (result !== null) {
        clearInterval(interval);
      }
    }, 1000);

    // Primeira verificação imediata
    checkSession().then(res => { if(res !== null) clearInterval(interval); });

    return () => clearInterval(interval);
  }, [log]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionValid) {
      addToast("Link de recuperação expirado ou inválido.", "error");
      return;
    }

    if (password.length < 6) {
      addToast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    log("Enviando nova senha para o servidor...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        log(`Erro ao atualizar usuário: ${error.message}`, "error");
        addToast(error.message, "error");
        setLoading(false);
        return;
      }

      log("Sucesso: Senha redefinida!");
      addToast("Senha redefinida com sucesso!", "success");
      
      if (onComplete) onComplete();
      navigate('/', { replace: true });
      
    } catch (error: any) {
      log(`Erro inesperado no formulário: ${error.message}`, "error");
      addToast("Erro ao salvar senha.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary-900/40 to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20 shadow-[0_0_30px_rgba(132,204,22,0.1)]">
            {validating ? (
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Lock size={32} className={sessionValid ? "text-primary-500" : "text-red-500"} />
            )}
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Redefinir Senha</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Acesso seguro à arena</p>
        </div>

        {validating ? (
          <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5">
             <p className="text-zinc-400 text-sm font-medium animate-pulse">Validando seu link de acesso...</p>
          </div>
        ) : sessionValid === false ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl space-y-4">
            <div className="flex justify-center text-red-500"><ShieldAlert size={40} /></div>
            <p className="text-red-400 text-xs font-bold uppercase leading-relaxed tracking-wider">
              O link de recuperação expirou ou é inválido. <br/> Por favor, solicite um novo e-mail.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white/10 text-white font-black text-[10px] uppercase py-3 rounded-xl border border-white/10"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                      className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? 'Salvando...' : (
                  <>
                    <BadgeCheck size={18} />
                    Confirmar Nova Senha
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
