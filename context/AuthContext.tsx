
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Profile } from '../types';
import { useDebug } from './DebugContext';

interface AuthContextType {
  user: Profile | null;
  session: any;
  loading: boolean;
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { log } = useDebug();

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
        log(`Perfil carregado: ${data.full_name}`);
      }
    } catch (err: any) {
      log(`Erro ao carregar perfil: ${err.message}`, 'error');
    }
  }, [log]);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  };

  useEffect(() => {
    log("Iniciando Auth Engine v1.18.0");

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      log(`Evento Auth Global: ${event}`);
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
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
