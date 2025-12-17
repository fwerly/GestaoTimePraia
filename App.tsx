
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

    // 1. HARD TIMEOUT: Se em 4 segundos nada acontecer, libera a tela
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Safety timeout atingido. Forçando encerramento do loading.");
        setLoading(false);
      }
    }, 4000);

    // Detectar recuperação de senha na URL
    const checkRecoveryFlow = () => {
      const fullUrl = window.location.href;
      if (fullUrl.includes('type=recovery') || fullUrl.includes('access_token=')) {
        setIsRecovering(true);
      }
    };

    checkRecoveryFlow();

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session && mounted) {
          const profile = await getCurrentProfile();
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão inicial:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    checkSession();

    // Listener para mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        const profile = await getCurrentProfile();
        if (mounted && profile) {
          setUser(profile);
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
      clearTimeout(safetyTimeout);
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

  // Se o usuário está recuperando a senha, mostramos a tela de UpdatePassword
  // Isso deve acontecer ANTES da checagem de loading se possível, ou logo após
  if (isRecovering && !user && !loading) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Entrando na Arena...</p>
        </div>
      </div>
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
