
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck, AlertTriangle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface Props {
  onComplete?: () => void;
}

export const UpdatePassword: React.FC<Props> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const { addToast } = useToast();
  const { log } = useDebug();
  const navigate = useNavigate();

  useEffect(() => {
    log("UpdatePassword: Verificando validade da sessão para troca...");
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        log(`Sessão confirmada para: ${session.user.email}. Pronto para atualizar.`);
        setSessionValid(true);
      } else {
        log("ERRO: Nenhuma sessão ativa para trocar a senha. O token pode ter expirado.", "error");
        setSessionValid(false);
      }
    };

    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionValid) {
      log("Tentativa de update sem sessão válida abortada.", "error");
      addToast("Sessão inválida ou expirada. Tente recuperar a senha novamente.", "error");
      return;
    }

    if (password.length < 6) {
      addToast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    log("Iniciando requisição supabase.auth.updateUser...");

    const apiTimeout = setTimeout(() => {
      if (loading) {
        log("ALERTA: A API de atualização de senha está demorando mais de 10s...", "warn");
      }
    }, 10000);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      clearTimeout(apiTimeout);

      if (error) {
        log(`Erro retornado pelo servidor: ${error.message}`, "error");
        addToast(error.message, "error");
        setLoading(false);
        return;
      }

      log("Sucesso absoluto: Senha alterada no servidor!");
      addToast("Senha alterada com sucesso! Acesso liberado.", "success");
      
      // Limpa hash residual
      if (window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      if (onComplete) onComplete();
      navigate('/', { replace: true });
      
    } catch (error: any) {
      log(`Exceção capturada no formulário: ${error.message}`, "error");
      addToast("Erro inesperado. Verifique sua internet.", "error");
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
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Redefinir</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">Digite sua nova credencial abaixo</p>
        </div>

        {sessionValid === false && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-400 text-[10px] font-bold uppercase leading-relaxed">
              Link expirado ou inválido. Por favor, volte ao login e solicite um novo e-mail de recuperação.
            </p>
          </div>
        )}

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
                    disabled={sessionValid === false}
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all font-medium disabled:opacity-50"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || sessionValid === false}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <BadgeCheck size={18} />
                  Salvar Nova Senha
                </>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 py-2"
            >
              Cancelar e Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
