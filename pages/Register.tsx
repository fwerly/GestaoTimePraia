
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { User, Mail, Lock, Phone, AlertTriangle, BadgeCheck } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { log } = useDebug();
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailExists(false);

    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=84cc16&color=000&bold=true`;

      log(`Registrando: ${email}`);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            whatsapp: whatsapp,
            role: 'student',
            avatar_url: avatarUrl
          }
        }
      });

      if (authError && (authError.message.includes('already registered') || authError.status === 422)) {
        setEmailExists(true);
        addToast("E-mail já cadastrado.", "error");
        setLoading(false);
        return;
      }

      if (authError) throw authError;

      if (authData.user) {
        addToast("Conta criada! Redirecionando...", "success");
        navigate('/');
      }
    } catch (error: any) {
      addToast(error.message || "Erro no cadastro.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    setLoading(true);
    try {
      // Usamos apenas o origin para o redirecionamento
      const redirectTo = window.location.origin;
      log(`Recuperação enviada para ${email} com redirect ${redirectTo}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      if (error) throw error;
      setResetSent(true);
      addToast("E-mail de recuperação enviado!", "success");
    } catch (error: any) {
      addToast("Erro ao enviar link.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-zinc-800/30 to-transparent pointer-events-none"></div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 italic tracking-tighter uppercase">Novo Atleta</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Complete seu alistamento</p>
        </div>

        {emailExists ? (
          <div className="bg-zinc-900/80 backdrop-blur-md border border-red-500/20 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-white font-black italic uppercase text-lg">E-mail já Cadastrado</h2>
              <p className="text-zinc-400 text-sm mt-2">Você já faz parte do time. Recuperar senha?</p>
            </div>

            {!resetSent ? (
              <button 
                onClick={handleSendResetLink}
                disabled={loading}
                className="w-full bg-white text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Senha'}
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3">
                <BadgeCheck className="text-green-500 shrink-0" size={20} />
                <p className="text-green-400 text-xs font-bold uppercase">Verifique seu e-mail!</p>
              </div>
            )}

            <button 
              onClick={() => setEmailExists(false)}
              className="w-full text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white"
            >
              Tentar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/10 p-5 rounded-3xl space-y-3">
              <div className="relative group">
                <User className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
                <input 
                  type="text" placeholder="Nome Completo" required
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none text-sm"
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
                <input 
                  type="email" placeholder="E-mail" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none text-sm"
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
                <input 
                  type="tel" placeholder="WhatsApp" required
                  value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none text-sm"
                />
              </div>

              <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
                  <input 
                    type="password" placeholder="Senha (mín. 6)" required minLength={6}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none text-sm"
                  />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg mt-4"
            >
              {loading ? 'Processando...' : 'Confirmar Cadastro'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
          <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
            Já é do time? 
            <Link to="/" className="block mt-2 text-primary-500 hover:text-white text-sm font-black underline decoration-primary-500/30 underline-offset-4">
              LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
