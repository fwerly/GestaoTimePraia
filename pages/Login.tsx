import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { MOCK_USER_ADMIN, MOCK_USER_STUDENT } from '../services/mockData';
import { Profile } from '../types';
import { Mail, Lock, Trophy } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface LoginProps {
  onLogin: (user: Profile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // --- ADMIN BYPASS HACK ---
    if (email === 'admin' && password === 'admin') {
      setTimeout(() => {
        onLogin(MOCK_USER_ADMIN);
        addToast("Bem-vindo, Treinador!", "success");
      }, 500);
      return;
    }

    // --- STUDENT BYPASS HACK ---
    if (email === 'user' && password === 'user') {
      setTimeout(() => {
        onLogin(MOCK_USER_STUDENT);
        addToast(`Bora pro treino, ${MOCK_USER_STUDENT.full_name.split(' ')[0]}! 🚀`, "success");
      }, 500);
      return;
    }
    // -------------------------

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Tenta buscar o perfil existente
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
        
        // SELF-HEALING: Se autenticou mas não tem perfil (erro comum de RLS no cadastro), cria agora.
        if (!profile && data.session.user) {
          console.log("Perfil não encontrado. Tentando criar automaticamente...");
          const metadata = data.session.user.user_metadata || {};
          
          const newProfile = {
             id: data.session.user.id,
             full_name: metadata.full_name || 'Novo Usuário',
             role: 'student', // Default seguro
             whatsapp: metadata.whatsapp || null,
             avatar_url: metadata.avatar_url || `https://ui-avatars.com/api/?name=User&background=random`
          };

          const { data: createdProfile, error: createError } = await supabase
             .from('profiles')
             .insert([newProfile])
             .select()
             .single();
             
          if (!createError && createdProfile) {
             profile = createdProfile;
          } else {
             console.error("Falha na autocriação do perfil:", createError);
          }
        }

        if (profile) {
          onLogin(profile as Profile);
          addToast(`Bora pro treino, ${profile.full_name.split(' ')[0]}! 🚀`, "success");
        } else {
           addToast("Conta existe, mas o perfil não foi carregado.", "error");
        }
      }
    } catch (error: any) {
      if (error.message === 'Invalid login credentials') {
        addToast("Email/Senha incorretos ou email não confirmado.", "error");
      } else {
        addToast(error.message || "Erro no login.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Sports Dynamic Background - Efeito "Refletor de Estádio" */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/40 via-transparent to-transparent opacity-60"></div>
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-zinc-950/80 to-transparent pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Logo Area */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-primary-500 blur-[40px] opacity-20 rounded-full"></div>
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center relative rotate-3 shadow-2xl shadow-black">
             <Trophy size={40} className="text-primary-500" />
          </div>
          <div className="w-24 h-24 bg-primary-500 rounded-3xl absolute top-0 left-0 -z-10 -rotate-6 opacity-40"></div>
        </div>
        
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic uppercase">
          Gestao<span className="text-primary-500">Time</span>
        </h1>
        <p className="text-zinc-400 mb-10 text-center font-medium tracking-wide uppercase text-xs">
          Performance . Agenda . Foco
        </p>

        {/* Card de Login */}
        <div className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Email</label>
               <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all font-medium placeholder:text-zinc-700"
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
                    className="w-full bg-black/40 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all font-medium placeholder:text-zinc-700"
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] active:scale-[0.98] mt-4"
            >
              {loading ? 'Acessando...' : 'Entrar na Arena'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Novo no time? <Link to="/register" className="text-white font-bold hover:text-primary-500 transition-colors border-b-2 border-primary-500/30 hover:border-primary-500 pb-0.5">Criar Conta</Link>
          </p>
        </div>

        {/* Versão */}
        <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-40">
           <span className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em]">System v1.13</span>
           <div className="w-8 h-0.5 bg-zinc-800 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};