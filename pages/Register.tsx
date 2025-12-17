
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { User, Mail, Lock, Phone } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=84cc16&color=000&bold=true`;

      // 1. Tenta criar o usuário no Auth
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

      // 2. Se o e-mail já existe no sistema Auth do Supabase
      if (authError && (authError.message.includes('already registered') || authError.status === 422)) {
        // Tentamos o login automático como "último recurso" se for a mesma senha
        const { data: logData, error: logError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!logError && logData.session) {
           addToast("Você já tem conta! Entrando automaticamente...", "success");
           navigate('/'); 
           return;
        } else {
           // Se a senha estiver errada, damos a orientação correta
           throw new Error("Este e-mail já faz parte do time. Tente entrar com sua senha ou peça para o treinador resetar.");
        }
      }

      if (authError) {
        if (authError.message.includes('Database error')) {
          throw new Error("Sem sinal com a arena. Tente novamente.");
        }
        throw authError;
      }

      // 3. Sucesso!
      if (authData.user) {
        if (authData.session) {
           addToast("Bem-vindo ao time! Acesso liberado.", "success");
        } else {
           addToast("Conta criada! Verifique seu e-mail para ativar.", "success");
        }
        navigate('/');
      }
    } catch (error: any) {
      console.error("Erro no registro:", error);
      addToast(error.message || "Não conseguimos criar sua conta.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-zinc-800/30 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 italic tracking-tighter uppercase">Novo Atleta</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Entre para a arena agora</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/10 p-5 rounded-3xl space-y-3 shadow-xl">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
              <input 
                type="text" 
                placeholder="Nome Completo" 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
              />
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
              <input 
                type="email" 
                placeholder="E-mail" 
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
              />
            </div>

            <div className="relative group">
              <Phone className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
              <input 
                type="tel" 
                placeholder="WhatsApp" 
                required
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
              />
            </div>

            <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
                <input 
                  type="password" 
                  placeholder="Senha (mín. 6 caracteres)" 
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-400 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] active:scale-[0.98] mt-4"
          >
            {loading ? 'Validando Entrada...' : 'Entrar na Arena'}
          </button>
        </form>

        <div className="mt-8 text-center bg-zinc-900/40 p-4 rounded-2xl border border-white/5 shadow-inner">
          <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
            Já possui acesso? 
            <Link to="/" className="block mt-2 text-primary-500 hover:text-white transition-all text-sm font-black underline decoration-primary-500/30 underline-offset-4">
              IR PARA LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
