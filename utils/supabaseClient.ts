import { createClient } from '@supabase/supabase-js';

// Na Vercel, as variáveis de ambiente começam com VITE_ para serem expostas ao frontend.
// Protegemos o acesso a import.meta.env com um objeto vazio (|| {}) para evitar crash se env for undefined.
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeWpjdXF1Z3BrZXJrbXhkdXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTg2MDcsImV4cCI6MjA4MTMzNDYwN30.oaUtL3Q6_m5rE1jgY2eY44D0PlbP_mw38tA9ss3Q3w0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);