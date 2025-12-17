import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { getCurrentProfile, signOut } from './services/authService';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
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

  useEffect(() => {
    let mounted = true;

    // Função segura para checar sessão
    const checkSession = async () => {
      try {
        // Timeout de segurança: Se o Supabase demorar mais de 5s, libera o app
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
        const sessionPromise = getCurrentProfile();

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (mounted && result && (result as Profile).id) {
          setUser(result as Profile);
        }
      } catch (error) {
        console.error("Falha ao verificar sessão inicial:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Ao fazer login explícito, não precisamos de timeout, o usuário espera
        const profile = await getCurrentProfile();
        if (mounted) setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
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
       // Mock logout for admin and user bypass
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
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando...</p>
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