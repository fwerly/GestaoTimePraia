
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DebugProvider } from './context/DebugContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UpdatePassword } from './pages/UpdatePassword';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentFinance } from './pages/StudentFinance';
import { AdminFinance } from './pages/AdminFinance';
import { AdminUsers } from './pages/AdminUsers';

const AppContent: React.FC = () => {
  const { user, loading, isRecoveryMode, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse italic">
          Sincronizando com a Arena...
        </p>
      </div>
    );
  }

  if (isRecoveryMode) {
    return <UpdatePassword />;
  }

  return (
    <Layout user={user} onLogout={signOut}>
      <Routes>
        <Route path="/" element={!user ? <Login onLogin={() => {}} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/student" element={user?.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/student/finance" element={user?.role === 'student' ? <StudentFinance user={user} /> : <Navigate to="/" />} />
        
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
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </DebugProvider>
  );
};

export default App;
