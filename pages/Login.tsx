import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { MOCK_USER_ADMIN } from '../services/mockData';
import { Profile } from '../types';
import { Mail, Lock, Chrome, AlertTriangle } from '../components/ui/Icons';
import { signInWithGoogle } from '../services/authService';
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
    // Atendendo a solicitação: usuário "admin" e senha "admin" loga como administrador.
    if (email === 'admin' && password === 'admin') {
      setTimeout(() => {
        onLogin(MOCK_USER_ADMIN);
        addToast("Bem-vindo, Coach!", "success");
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
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        
        if (profile) {
          onLogin(profile as Profile);
          addToast(`Bem-vindo, ${profile.full_name}!`, "success");
        } else {
           // Fallback if profile missing
           addToast("Perfil não encontrado.", "error");
        }
      }
    } catch (error: any) {
      addToast(error.message || "Erro no login.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // O redirecionamento acontece e o App.tsx captura a sessão no useEffect
    } catch (error: any) {
      addToast("Erro ao conectar com Google. Verifique a configuração.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-accent-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(132,204,22,0.4)] rotate-3">
          <span className="text-5xl drop-shadow-md">🏐</span>
        </div>
        
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Gestao<span className="text-primary-400">Time</span></h1>
        <p className="text-zinc-400 mb-8 text-center font-medium">Faça login para continuar.</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="relative">
             <Mail className="absolute left-4 top-3.5 text-zinc-500" size={20} />
             <input 
               type="text" // text para permitir digitar só "admin"
               placeholder="Email" 
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
             />
          </div>

          <div className="relative">
             <Lock className="absolute left-4 top-3.5 text-zinc-500" size={20} />
             <input 
               type="password" 
               placeholder="Senha" 
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
             />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-400 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)]"
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-6">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="text-zinc-600 text-xs font-bold uppercase">Ou</span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors"
        >
          <Chrome size={20} />
          Entrar com Google
        </button>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Não tem uma conta? <Link to="/register" className="text-primary-400 font-bold hover:underline">Cadastre-se</Link>
          </p>
        </div>

        {/* Admin Tip */}
        <div className="absolute bottom-[-60px] text-zinc-800 text-[10px] uppercase font-bold tracking-widest opacity-30 select-none">
           Admin Access: admin / admin
        </div>
      </div>
    </div>
  );
};
