
import React, { useState, useEffect, useCallback } from 'react';
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
  const [showRetry, setShowRetry] = useState(false);
  const { log } = useDebug();

  // Memoized profile loader
  const loadProfile = useCallback(async () => {
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        setUser(profile);
        log(`Perfil carregado: ${profile.full_name}`);
      }
    } catch (err: any) {
      log(`Erro ao carregar perfil: ${err.message}`, 'error');
    }
  }, [log]);

  useEffect(() => {
    let mounted = true;
    log("App v1.17.24 - Inicializando...");

    // Timer para mostrar botão de escape se a inicialização travar
    const retryTimer = setTimeout(() => {
      if (loading && mounted) {
        log("Inicialização lenta detectada. Ativando botão de escape.", "warn");
        setShowRetry(true);
      }
    }, 5000);

    const init = async () => {
      try {
        // 1. Verificar se há um token de recuperação na URL ANTES de carregar a sessão
        const href = window.location.href;
        if (href.includes('type=recovery') || href.includes('access_token=')) {
          log("Fluxo de recuperação identificado pela URL.", "warn");
          setForcePasswordUpdate(true);
        }

        // 2. Tentar pegar sessão atual
        log("Solicitando sessão ao Supabase...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          log(`Erro na sessão: ${error.message}`, "error");
        }

        if (session && mounted) {
          log(`Usuário autenticado: ${session.user.email}`);
          await loadProfile();
        }
      } catch (err: any) {
        log(`Falha crítica no init: ${err.message}`, "error");
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(retryTimer);
        }
      }
    };

    init();

    // 3. Listener Global de Auth (Única Instância)
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
      } else {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setForcePasswordUpdate(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(retryTimer);
    };
  }, [loadProfile, log]);

  const handleLogout = async () => {
    log("Ação: Saindo do sistema...");
    await signOut();
    setUser(null);
    setForcePasswordUpdate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Arena...</p>
        
        {showRetry && (
          <button 
            onClick={() => setLoading(false)}
            className="mt-10 px-6 py-3 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
          >
            Entrar Manualmente
          </button>
        )}
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
