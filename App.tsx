
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { getCurrentProfile, signOut } from './services/authService';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UpdatePassword } from './pages/UpdatePassword';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentFinance } from './pages/StudentFinance';
import { AdminFinance } from './pages/AdminFinance';
import { AdminUsers } from './pages/AdminUsers';
import { Profile } from './types';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Detectar recuperação de senha de forma robusta
    // Lida com links como: domain.com/#/#access_token=... ou domain.com/#access_token=...
    const checkRecoveryFlow = () => {
      const fullUrl = window.location.href;
      if (fullUrl.includes('type=recovery') || fullUrl.includes('access_token=')) {
        console.log("Fluxo de recuperação detectado na URL");
        setIsRecovering(true);
      }
    };

    checkRecoveryFlow();

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          const profile = await getCurrentProfile();
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // Listener para mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        const profile = await getCurrentProfile();
        if (mounted && profile) {
          setUser(profile);
          // Só desativa recuperação se não for apenas o login inicial do token
          if (event === 'USER_UPDATED') setIsRecovering(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setIsRecovering(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (loggedInUser: Profile) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    if (user?.id.startsWith('admin-') || user?.id.startsWith('user-')) {
       setUser(null);
    } else {
       await signOut();
       setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Iniciando Arena...</p>
        </div>
      </div>
    );
  }

  // PRIORIDADE MÁXIMA: Se detectamos tokens de recuperação, mostramos a tela de UpdatePassword
  // Mesmo que o Supabase ainda não tenha processado o evento PASSWORD_RECOVERY formalmente
  if (isRecovering && !user) {
    return (
      <ToastProvider>
        <HashRouter>
           <Routes>
              <Route path="*" element={<UpdatePassword />} />
           </Routes>
        </HashRouter>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <HashRouter>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route 
              path="/" 
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />} 
            />
            
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/" />} 
            />

            <Route 
              path="/reset-password" 
              element={<UpdatePassword />} 
            />
            
            <Route 
              path="/student" 
              element={
                user ? <StudentDashboard user={user} /> : <Navigate to="/" />
              } 
            />

            <Route 
              path="/student/finance" 
              element={
                user ? <StudentFinance user={user} /> : <Navigate to="/" />
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                user && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />
              } 
            />

            <Route 
              path="/admin/finance" 
              element={
                user && user.role === 'admin' ? <AdminFinance user={user} /> : <Navigate to="/" />
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                user && user.role === 'admin' ? <AdminUsers user={user} /> : <Navigate to="/" />
              } 
            />
          </Routes>
        </Layout>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
