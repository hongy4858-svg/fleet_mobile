import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  errorMessage?: string;
}

export function checkSupabaseConfig(): SupabaseConfigStatus {
  const missingKeys: string[] = [];
  if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co') {
    missingKeys.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-public-key') {
    missingKeys.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missingKeys.length > 0) {
    return {
      isConfigured: false,
      missingKeys,
      errorMessage: `Supabase 환경변수가 설정되지 않았습니다 (mobile/.env에 ${missingKeys.join(', ')} 필요).`,
    };
  }

  return { isConfigured: true, missingKeys: [] };
}

export const supabaseConfigStatus = checkSupabaseConfig();

export const supabase: SupabaseClient | null = supabaseConfigStatus.isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

