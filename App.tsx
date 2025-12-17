
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

const AppContent: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordUpdate, setForcePasswordUpdate] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança para evitar tela branca/loading infinito
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Safety timeout atingido. Liberando interface.");
        setLoading(false);
      }
    }, 4000);

    // Checagem inicial de URL para recuperação
    const checkUrlForRecovery = () => {
      const href = window.location.href;
      if (href.includes('type=recovery') || href.includes('access_token=')) {
        console.log("Detectado token de recuperação na URL");
        setForcePasswordUpdate(true);
      }
    };
    checkUrlForRecovery();

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const profile = await getCurrentProfile();
          if (profile) setUser(profile);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      
      if (event === 'PASSWORD_RECOVERY') {
        setForcePasswordUpdate(true);
      }

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        const profile = await getCurrentProfile();
        if (mounted && profile) {
          setUser(profile);
          // Se foi um update de senha bem sucedido, podemos liberar
          if (event === 'USER_UPDATED' && !window.location.href.includes('access_token')) {
            setForcePasswordUpdate(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setForcePasswordUpdate(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setForcePasswordUpdate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(132,204,22,0.2)]"></div>
          <div className="space-y-2">
            <p className="text-white font-black italic uppercase tracking-[0.2em] animate-pulse">Entrando na Arena</p>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Preparando Equipamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se estiver em fluxo de recuperação, forçamos a tela de troca de senha
  if (forcePasswordUpdate) {
    return <UpdatePassword onComplete={() => setForcePasswordUpdate(false)} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route 
          path="/" 
          element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />} 
        />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={<UpdatePassword onComplete={() => setForcePasswordUpdate(false)} />} />
        
        <Route path="/student" element={user ? <StudentDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/student/finance" element={user ? <StudentFinance user={user} /> : <Navigate to="/" />} />
        
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/admin/finance" element={user?.role === 'admin' ? <AdminFinance user={user} /> : <Navigate to="/" />} />
        <Route path="/admin/users" element={user?.role === 'admin' ? <AdminUsers user={user} /> : <Navigate to="/" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
