import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { alfaConfig } from '@/lib/alfa/config';

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!alfaConfig.url || !alfaConfig.anonKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (!browserClient) {
    browserClient = createClient(alfaConfig.url, alfaConfig.anonKey);
  }
  return browserClient;
}
