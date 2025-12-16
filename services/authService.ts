import { supabase } from '../utils/supabaseClient';
import { Profile } from '../types';

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil:', JSON.stringify(error, null, 2));
    return null;
  }
  return data as Profile;
};