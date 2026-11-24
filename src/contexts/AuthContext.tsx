import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, supabaseConfigStatus } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  configError?: string;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigStatus.isConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 1. 현재 세션 로딩
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. 세션 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 3. AppState 리스너: 앱 포그라운드 복귀 시 토큰 갱신 보장
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase?.auth.startAutoRefresh();
      } else {
        supabase?.auth.stopAutoRefresh();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 설정되지 않았습니다.');
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 설정되지 않았습니다.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    return { error, user: data.user };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: supabaseConfigStatus.isConfigured,
        configError: supabaseConfigStatus.errorMessage,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

