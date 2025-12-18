
import React, { useState, useEffect } from 'react';
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
import { RefreshCw, Trash2 } from './components/ui/Icons';

const AppContent: React.FC = () => {
  const { user, loading, authReady, isRecoveryMode, signOut, hardReset } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    // Se demorar mais de 3.5s na tela de carregamento, mostra botão de emergência
    const t = setTimeout(() => {
      if (loading || !authReady) setShowEmergency(true);
    }, 3500);
    return () => clearTimeout(t);
  }, [loading, authReady]);

  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="relative mb-12">
          <div className="w-16 h-16 border-4 border-zinc-900 border-t-primary-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 bg-primary-500 blur-[50px] opacity-10 animate-pulse"></div>
        </div>
        
        <div className="space-y-2">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse italic">
            Sincronizando v1.28.0
          </p>
          <p className="text-zinc-800 text-[8px] font-bold uppercase tracking-widest">Estabelecendo Conexão Segura</p>
        </div>

        {showEmergency && (
          <div className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <p className="text-zinc-600 text-[9px] font-bold uppercase mb-4 tracking-tighter">Problemas para carregar?</p>
             <div className="flex flex-col gap-3">
               <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 px-6 py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest hover:text-white"
               >
                 <RefreshCw size={14} /> Tentar Recarregar
               </button>
               <button 
                onClick={hardReset}
                className="flex items-center justify-center gap-2 bg-red-950/20 text-red-500 px-6 py-3 rounded-xl border border-red-500/10 text-[10px] font-black uppercase tracking-widest hover:bg-red-950/40"
               >
                 <Trash2 size={14} /> Limpeza Profunda
               </button>
             </div>
          </div>
        )}
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
