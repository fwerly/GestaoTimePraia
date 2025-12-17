
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { DebugProvider, useDebug } from './context/DebugContext';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordUpdate, setForcePasswordUpdate] = useState(false);
  const { log } = useDebug();
  const initAttempted = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        setUser(profile);
        log(`Perfil: ${profile.full_name}`);
      }
    } catch (err: any) {
      log(`Erro perfil: ${err.message}`, 'error');
    }
  }, [log]);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    let mounted = true;
    log("App v1.17.27 - Iniciando...");

    const init = async () => {
      try {
        const href = window.location.href;
        const isRecovery = href.includes('type=recovery') || href.includes('access_token=');
        
        if (isRecovery) {
          log("Redirecionando para fluxo de recuperação de senha.", "warn");
          setForcePasswordUpdate(true);
        }

        // Busca básica de sessão
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          log(`Sessão encontrada: ${session.user.email}`);
          await loadProfile();
        }

      } catch (err: any) {
        log(`Erro init: ${err.message}`, "error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log(`Evento Auth: ${event}`);
      
      if (event === 'PASSWORD_RECOVERY') {
        setForcePasswordUpdate(true);
      }

      if (session) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await loadProfile();
          if (event === 'USER_UPDATED' && forcePasswordUpdate) {
            setForcePasswordUpdate(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setForcePasswordUpdate(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, log]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setForcePasswordUpdate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(132,204,22,0.2)]"></div>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Acessando Arena...</p>
      </div>
    );
  }

  if (forcePasswordUpdate) {
    return <UpdatePassword onComplete={() => setForcePasswordUpdate(false)} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
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
    <DebugProvider>
      <ToastProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ToastProvider>
    </DebugProvider>
  );
};

export default App;
