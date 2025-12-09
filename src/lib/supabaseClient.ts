/* Supabase client initializer
   Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment.
   If the anon key is missing, `supabase` will be `null` and callers should
   fallback to localStorage-based behavior.
*/
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://jvfjvzotrqhlfwzcnixj.supabase.co';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// If no anon key is provided, do not initialize client (fallback mode)
export const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export default supabase;
