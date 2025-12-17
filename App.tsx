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
    // Check active session on load
    const checkSession = async () => {
      const profile = await getCurrentProfile();
      if (profile) setUser(profile);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const profile = await getCurrentProfile();
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
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