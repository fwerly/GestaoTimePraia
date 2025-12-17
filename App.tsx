
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
import { DebugProvider, useDebug } from './context/DebugContext';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordUpdate, setForcePasswordUpdate] = useState(false);
  const { log } = useDebug();

  useEffect(() => {
    let mounted = true;

    log("App Iniciado v1.17.21");

    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        log("Safety timeout atingido. Liberando UI forçadamente.", "warn");
        setLoading(false);
      }
    }, 4000);

    const checkUrlForRecovery = () => {
      const href = window.location.href;
      log(`Checando URL: ${href.substring(0, 50)}...`);
      if (href.includes('type=recovery') || href.includes('access_token=')) {
        log("Token de recuperação identificado na URL inicial!", "warn");
        setForcePasswordUpdate(true);
      }
    };
    checkUrlForRecovery();

    const initAuth = async () => {
      try {
        log("Buscando sessão atual...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          log(`Erro ao buscar sessão: ${error.message}`, "error");
          throw error;
        }

        if (session && mounted) {
          log(`Sessão ativa encontrada para: ${session.user.email}`);
          const profile = await getCurrentProfile();
          if (profile) {
            log(`Perfil carregado: ${profile.full_name}`);
            setUser(profile);
          }
        } else {
          log("Nenhuma sessão ativa encontrada.");
        }
      } catch (error: any) {
        log(`Erro fatal na inicialização: ${error.message}`, "error");
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log(`Auth Event Triggered: ${event}`);
      
      if (event === 'PASSWORD_RECOVERY') {
        log("Evento PASSWORD_RECOVERY recebido pelo Listener", "warn");
        setForcePasswordUpdate(true);
      }

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        log(`Sessão atualizada: ${session.user.email}`);
        const profile = await getCurrentProfile();
        if (mounted && profile) {
          setUser(profile);
          if (event === 'USER_UPDATED' && !window.location.href.includes('access_token')) {
            log("Update de usuário concluído, liberando fluxo de senha.");
            setForcePasswordUpdate(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        log("Usuário saiu do sistema.");
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
    log("Iniciando Logout...");
    await signOut();
    setUser(null);
    setForcePasswordUpdate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <p className="text-white font-black italic uppercase tracking-[0.2em] animate-pulse">Entrando na Arena</p>
          </div>
        </div>
      </div>
    );
  }

  if (forcePasswordUpdate) {
    return <UpdatePassword onComplete={() => {
      log("Fluxo de senha completo!");
      setForcePasswordUpdate(false);
    }} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />} />
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
