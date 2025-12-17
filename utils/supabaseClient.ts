import { createClient } from '@supabase/supabase-js';

// Acesso seguro às variáveis de ambiente para evitar crashes (TypeError) se import.meta.env for undefined
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

// @ts-ignore
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
// @ts-ignore
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeWpjdXF1Z3BrZXJrbXhkdXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTg2MDcsImV4cCI6MjA4MTMzNDYwN30.oaUtL3Q6_m5rE1jgY2eY44D0PlbP_mw38tA9ss3Q3w0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);