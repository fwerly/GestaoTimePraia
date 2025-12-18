
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
  hardReset: () => void;
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

  const hardReset = useCallback(() => {
    log("PURGA DE EMERGÊNCIA v1.28.0 DISPARADA");
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = window.location.origin;
  }, [log]);

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
        log(`Perfil [${data.role}] Ativo.`);
      }
    } catch (err: any) {
      log(`Erro perfil: ${err.message}`, 'error');
    } finally {
      // Garante que o estado de carregamento termina mesmo se o perfil falhar
      setLoading(false);
      setAuthReady(true);
    }
  }, [log]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    log("Auth Engine v1.28.0 - Anti-Stall Ativo");

    // Timeout de segurança: Se em 6 segundos nada acontecer, destrava a UI
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        log("TIMEOUT DE SEGURANÇA: Destravando UI forçadamente.", "warn");
        setLoading(false);
        setAuthReady(true);
      }
    }, 6000);

    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('type=signup') || hash.includes('access_token=')) {
        log("Contexto de recuperação via URL.");
        setIsRecoveryMode(true);
      }
    };

    checkHash();

    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession) {
        loadProfile(initSession.user.id);
      } else {
        setLoading(false);
        setAuthReady(true);
      }
      clearTimeout(safetyTimeout);
    }).catch(err => {
      log("Erro crítico getSession: " + err.message, "error");
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
        setSession(null);
        setIsRecoveryMode(false);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [log, loadProfile, loading]);

  const signOut = async () => {
    log("SignOut v1.28.0...");
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    // Limpeza de cache sb-
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k));
    
    sessionStorage.clear();
    setUser(null);
    setSession(null);
    setIsRecoveryMode(false);
    setLastEvent(null);
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
      refreshProfile: async () => {}, // Simplificado para v1.28
      setRecoveryMode: setIsRecoveryMode,
      hardReset
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
