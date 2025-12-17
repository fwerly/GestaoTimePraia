
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { MOCK_USER_ADMIN, MOCK_USER_STUDENT } from '../services/mockData';
import { Profile } from '../types';
import { Mail, Lock, Trophy } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';
import { useDebug } from '../context/DebugContext';

interface LoginProps {
  onLogin: (user: Profile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { log } = useDebug();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    log(`Iniciando tentativa de login: ${email}`);

    // Bypasses para testes rápidos
    if (email === 'admin' && password === 'admin') {
      log("Login MOCK Admin detectado.");
      setTimeout(() => {
        onLogin(MOCK_USER_ADMIN);
        addToast("Bem-vindo, Treinador!", "success");
      }, 500);
      return;
    }

    if (email === 'user' && password === 'user') {
      log("Login MOCK User detectado.");
      setTimeout(() => {
        const userWithRealName = { ...MOCK_USER_STUDENT, full_name: "Atleta de Teste" };
        onLogin(userWithRealName);
        addToast(`Bora pro treino! 🚀`, "success");
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        log(`Erro de credenciais: ${error.message}`, "error");
        throw error;
      }

      if (data.session) {
        log("Sessão Auth criada com sucesso. Buscando perfil...");
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
        
        const metadata = data.session.user.user_metadata || {};
        const emailName = data.session.user.email?.split('@')[0];
        const displayName = metadata.full_name || emailName || 'Atleta';

        if (!profile || !profile.full_name || profile.full_name === 'Novo Usuário' || profile.full_name === 'Atleta') {
          log("Perfil incompleto ou inexistente. Reparando...");
          const profileUpdate = {
             id: data.session.user.id,
             full_name: displayName,
             role: profile?.role || 'student',
             whatsapp: profile?.whatsapp || metadata.whatsapp || null,
             avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=84cc16&color=000&bold=true`
          };

          const { data: updatedProfile, error: updateError } = await supabase
             .from('profiles')
             .upsert([profileUpdate])
             .select()
             .single();
             
          if (!updateError && updatedProfile) {
             profile = updatedProfile;
             log("Perfil reparado com sucesso.");
          }
        }

        if (profile) {
          log(`Login concluído para: ${profile.full_name}`);
          onLogin(profile as Profile);
          addToast(`Bora pro treino, ${profile.full_name.split(' ')[0]}! 🚀`, "success");
        } else {
           log("Erro: Perfil não pôde ser recuperado.", "error");
           addToast("Sua conta está ativa, mas seu perfil não pôde ser criado.", "error");
        }
      }
    } catch (error: any) {
      const msg = error.message === 'Invalid login credentials' ? "E-mail ou senha incorretos." : error.message;
      addToast(msg || "Erro ao acessar a arena.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/40 via-transparent to-transparent opacity-60"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-primary-500 blur-[40px] opacity-20 rounded-full"></div>
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center relative rotate-3 shadow-2xl">
             <Trophy size={40} className="text-primary-500" />
          </div>
        </div>
        
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic uppercase">
          Gestao<span className="text-primary-500">Time</span>
        </h1>
        <p className="text-zinc-400 mb-10 text-center font-medium tracking-wide uppercase text-xs">
          Performance . Agenda . Foco
        </p>

        <div className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">E-mail</label>
               <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Senha</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg mt-4"
            >
              {loading ? 'Entrando...' : 'Entrar na Arena'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Novo no time? <Link to="/register" className="text-white font-bold hover:text-primary-500 transition-colors border-b-2 border-primary-500/30 pb-0.5">Criar Conta</Link>
          </p>
        </div>

        <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-40">
           <span className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em]">System v1.17.21</span>
        </div>
      </div>
    </div>
  );
};
