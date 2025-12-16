import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentFinance } from './pages/StudentFinance';
import { AdminFinance } from './pages/AdminFinance';
import { Profile } from './types';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  // Simple auth state management for demo
  const [user, setUser] = useState<Profile | null>(null);

  const handleLogin = (loggedInUser: Profile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

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
          </Routes>
        </Layout>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;