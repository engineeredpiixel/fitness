import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to get or create a local anonymous user ID
export const getLocalUserId = () => {
  if (typeof window === 'undefined') return 'server';
  
  let userId = localStorage.getItem('fitness_ai_local_id');
  if (!userId) {
    userId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('fitness_ai_local_id', userId);
  }
  return userId;
};
