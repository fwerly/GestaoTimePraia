import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { User, Mail, Lock, Phone, MapPin, Calendar, CheckCircle2, AlertTriangle } from '../components/ui/Icons';
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
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Criar Perfil na tabela profiles
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: 'student', // Padrão é aluno
            whatsapp,
            address,
            birth_date: birthDate,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=84cc16&color=000`
          }
        ]);

        if (profileError) {
          // Se der erro no perfil, é bom avisar, mas o user já foi criado no auth
          console.error("Erro ao criar perfil:", profileError);
          throw new Error("Usuário criado, mas falha ao salvar dados do perfil.");
        }

        addToast("Cadastro realizado com sucesso! Faça login.", "success");
        navigate('/');
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || "Erro ao cadastrar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Crie sua conta</h1>
          <p className="text-zinc-400 text-sm">Preencha seus dados para começar a treinar.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Nome */}
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
              type="text" 
              placeholder="Nome Completo" 
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
              type="email" 
              placeholder="Seu Email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Telefone */}
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
              type="tel" 
              placeholder="WhatsApp / Telefone" 
              required
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Data Nascimento */}
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
              type="date" 
              required
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors appearance-none"
            />
          </div>

          {/* Endereço */}
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
              type="text" 
              placeholder="Endereço Completo" 
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input 
              type="password" 
              placeholder="Crie uma senha" 
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-400 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] mt-2"
          >
            {loading ? 'Criando conta...' : 'CADASTRAR AGORA'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Já tem uma conta? <Link to="/" className="text-primary-400 font-bold hover:underline">Fazer Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
