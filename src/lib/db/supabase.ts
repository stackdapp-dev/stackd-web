/**
 * Supabase client configuration
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing environment variables. Database features will be disabled.');
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}
