
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Profile } from '../types';
import { useDebug } from './DebugContext';

interface AuthContextType {
  user: Profile | null;
  session: any;
  loading: boolean;
  authReady: boolean;
  isRecoveryMode: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setRecoveryMode: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { log } = useDebug();
  const mounted = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUser(data as Profile);
        log(`Perfil [${data.role}]: ${data.full_name}`);
      }
    } catch (err: any) {
      log(`Erro de Perfil: ${err.message}`, 'error');
    }
  }, [log]);

  // Fix: Added implementation for refreshProfile required by AuthContextType interface
  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      log("Manual profile refresh triggered");
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile, log]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    log("Auth Engine v1.20.0 - On Fire");

    // Detectar modo recuperação pela URL
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('type=signup') || hash.includes('access_token=')) {
        log("Sinal de recuperação detectado na URL.");
        setIsRecoveryMode(true);
      }
    };

    checkHash();

    // Inicializar Sessão
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession) {
        loadProfile(initSession.user.id);
      }
      setLoading(false);
      setAuthReady(true);
    });

    // Escutar Mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      log(`Evento Global: ${event}`);
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (newSession) await loadProfile(newSession.user.id);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsRecoveryMode(false);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [log, loadProfile]);

  const signOut = async () => {
    log("Limpando ambiente de segurança...");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsRecoveryMode(false);
    window.location.hash = ''; // Limpa hash da URL no logout
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      authReady,
      isRecoveryMode, 
      signOut, 
      refreshProfile,
      setRecoveryMode: setIsRecoveryMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
