import { createClient } from '@supabase/supabase-js';

// 1. Ambil data rahasia dari file .env secara aman
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 2. Validasi pencegahan biar gak pusing kalau lupa isi .env
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Waduh Wir! URL atau Anon Key Supabase di file .env belum kebaca.");
}

// 3. Inisialisasi client Supabase dengan variable dari .env
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');