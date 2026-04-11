import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whlrgdhfemzgmmnhqaky.supabase.co';
const supabaseAnonKey = 'sb_publishable_utE_5UAVfgMFGABlo51rQQ_VrD1BrM9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);