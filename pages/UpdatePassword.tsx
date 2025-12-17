
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, BadgeCheck, ShieldAlert, Clock, AlertTriangle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface Props {
  onComplete?: () => void;
}

export const UpdatePassword: React.FC<Props> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'validating' | 'ready' | 'error' | 'skew'>('validating');
  const [errorDetail, setErrorDetail] = useState('');
  
  const { addToast } = useToast();
  const { log } = useDebug();
  const navigate = useNavigate();
  const hasAttemptedSetSession = useRef(false);

  useEffect(() => {
    log("UpdatePassword: Iniciando Diagnóstico v1.17.35");

    const validateAndWarmup = async () => {
      if (hasAttemptedSetSession.current) return;
      hasAttemptedSetSession.current = true;

      const url = window.location.href;
      const access_token = url.match(/[#&]access_token=([^&]*)/)?.[1];
      const refresh_token = url.match(/[#&]refresh_token=([^&]*)/)?.[1];

      if (!access_token) {
        log("Erro: Nenhum token de acesso encontrado na URL.", "error");
        setStatus('error');
        setErrorDetail("Link de recuperação incompleto ou corrompido.");
        return;
      }

      log("Tokens brutos detectados. Tentando forçar sessão...");
      
      try {
        const { data, error } = await supabase.auth.setSession({ 
          access_token, 
          refresh_token: refresh_token || '' 
        });

        if (error) {
          log(`Erro ao setar sessão: ${error.message}`, "error");
          
          if (error.message.toLowerCase().includes('future') || error.message.toLowerCase().includes('skew')) {
            log("DIAGNÓSTICO: Relógio do usuário está ATRASADO.", "warn");
            setStatus('skew');
            addToast("Aviso: Seu relógio parece estar desregulado.", "error");
          } else {
            setStatus('error');
            setErrorDetail(error.message);
          }
        } else if (data.session) {
          log(`Sessão validada para: ${data.session.user.email}`);
          setStatus('ready');
        } else {
          // Caso estranho onde não há erro mas não há sessão
          log("Aviso: Tokens aceitos mas sessão não retornada imediatamente.", "warn");
          setStatus('ready'); // Liberamos o form e deixamos o updateUser tentar
        }
      } catch (err: any) {
        log(`Exceção na validação: ${err.message}`, "error");
        setStatus('error');
      }
    };

    validateAndWarmup();
  }, [log]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast("A senha deve ter 6+ caracteres.", "error");
      return;
    }

    setLoading(true);
    log("Tentando atualizar senha no backend...");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        log(`Erro no Update: ${error.message}`, "error");
        
        if (error.message.toLowerCase().includes('future') || error.message.toLowerCase().includes('skew')) {
          addToast("Erro crítico: Seu relógio está atrasado. Sincronize o Windows e tente novamente.", "error");
          setStatus('skew');
        } else {
          addToast(error.message, "error");
        }
        setLoading(false);
        return;
      }

      log("Sucesso absoluto: Senha alterada.");
      addToast("Senha redefinida com sucesso!", "success");
      
      await supabase.auth.signOut();
      if (onComplete) onComplete();
      navigate('/', { replace: true });

    } catch (err: any) {
      log(`Erro inesperado: ${err.message}`, "error");
      addToast("Falha na comunicação com o servidor.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        {/* Header Dinâmico */}
        <div className="mb-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 shadow-2xl transition-all duration-500 ${
            status === 'skew' ? 'bg-yellow-500/10 border-yellow-500/30 rotate-12' : 
            status === 'error' ? 'bg-red-500/10 border-red-500/30' :
            'bg-zinc-900 border-zinc-800'
          }`}>
            {status === 'validating' ? (
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            ) : status === 'skew' ? (
              <Clock size={40} className="text-yellow-500 animate-pulse" />
            ) : status === 'error' ? (
              <ShieldAlert size={40} className="text-red-500" />
            ) : (
              <Lock size={32} className="text-primary-500" />
            )}
          </div>
          
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Recuperar</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Acesso à Arena</p>
        </div>

        {/* Estados de Interface */}
        {status === 'validating' && (
          <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 animate-pulse">
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest italic">Autenticando tokens...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl space-y-6">
            <p className="text-red-400 text-sm font-bold uppercase tracking-tight">{errorDetail || "Link inválido ou expirado."}</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white/5 text-white font-black text-xs uppercase py-4 rounded-xl border border-white/10"
            >
              Voltar ao Início
            </button>
          </div>
        )}

        {(status === 'ready' || status === 'skew') && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {status === 'skew' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-4 text-left">
                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-black uppercase tracking-tight italic">Relógio Desincronizado!</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Detectamos que o seu computador está com a hora errada. 
                  Isso impede a segurança do sistema de validar seu acesso.
                  <br /><br />
                  <strong className="text-white">Solução:</strong> Vá nas configurações de Hora do Windows e clique em "Sincronizar Agora".
                </p>
              </div>
            )}

            <form onSubmit={handleUpdate} className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-2xl space-y-5 text-left">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 italic">Nova Senha</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      required
                      minLength={6}
                      autoFocus
                      disabled={loading}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-50 italic"
              >
                {loading ? 'Sincronizando...' : (
                  <>
                    <BadgeCheck size={18} />
                    Salvar Nova Senha
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
      
      <div className="mt-12 opacity-30">
         <span className="text-zinc-600 text-[9px] uppercase font-black tracking-[0.3em]">System Engine v1.17.35</span>
      </div>
    </div>
  );
};
