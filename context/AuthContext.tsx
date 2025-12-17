
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
  lastEvent: string | null;
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
  const [lastEvent, setLastEvent] = useState<string | null>(null);
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

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      log("Manual profile refresh triggered");
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile, log]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    log("Auth Engine v1.24.0 - Online");

    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('type=signup') || hash.includes('access_token=')) {
        log("Sinal de recuperação na URL.");
        setIsRecoveryMode(true);
      }
    };

    checkHash();

    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession) {
        loadProfile(initSession.user.id);
      }
      setLoading(false);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      log(`Evento Auth: ${event}`);
      setLastEvent(event);
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
    log("Limpando ambiente v1.24.0...");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsRecoveryMode(false);
    setLastEvent(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      authReady,
      isRecoveryMode,
      lastEvent,
      signOut, 
      refreshProfile,
      setRecoveryMode: setIsRecoveryMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
