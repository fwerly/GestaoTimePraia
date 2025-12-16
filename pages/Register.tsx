import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { User, Mail, Lock, Phone } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=84cc16&color=000&bold=true`;

      // 1. Cria o usuário na Auth e salva os dados no metadata (backup de segurança)
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

      if (authError) throw authError;

      if (authData.user) {
        // 2. Tenta criar o perfil na tabela pública imediatamente
        // Se falhar (ex: RLS bloqueando insert anônimo), o Login cuidará disso usando o metadata salvo acima.
        const profileData = {
            id: authData.user.id,
            full_name: fullName,
            role: 'student',
            whatsapp: whatsapp || null,
            avatar_url: avatarUrl
        };

        const { error: profileError } = await supabase.from('profiles').upsert(profileData);

        if (profileError) {
          console.warn("Aviso: Perfil não criado imediatamente (será criado no primeiro login).", profileError);
        }

        if (!authData.session) {
           addToast("Conta criada! Verifique seu email para confirmar.", "success");
        } else {
           addToast("Conta criada! Bem-vindo ao time.", "success");
        }
        
        navigate('/');
      }
    } catch (error: any) {
      console.error("Erro no registro:", error);
      addToast(error.message || "Erro ao cadastrar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-zinc-800/30 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 italic tracking-tighter uppercase">Novo Atleta</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Preencha sua ficha técnica</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          
          <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/10 p-5 rounded-3xl space-y-3 shadow-xl">
            {/* Nome */}
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
              <input 
                type="text" 
                placeholder="Nome Completo" 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
              <input 
                type="email" 
                placeholder="Email Principal" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
              />
            </div>

            {/* Telefone */}
            <div className="relative group">
              <Phone className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
              <input 
                type="tel" 
                placeholder="WhatsApp" 
                required
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
              />
            </div>

            {/* Senha */}
            <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-primary-500" size={18} />
                <input 
                type="password" 
                placeholder="Senha" 
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-sm font-medium"
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] mt-4"
          >
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
            Já possui cadastro? <Link to="/" className="text-primary-500 hover:text-primary-400 underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};