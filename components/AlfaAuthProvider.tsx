'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { alfaConfig } from '@/lib/alfa/config';
import { getSupabaseClient } from '@/lib/supabase/client';

type AlfaAuthContextValue = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AlfaAuthContext = createContext<AlfaAuthContextValue | null>(null);

function isAdminSession(session: Session | null): boolean {
  if (!session?.user) return false;
  const u = session.user;
  return u.id === alfaConfig.adminUserId || u.app_metadata?.role === 'admin';
}

export function AlfaAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const client = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const publish = useCallback((next: Session | null) => {
    setSession(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!client) {
      setReady(true);
      return;
    }
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => publish(next));
    client.auth.getSession().then(({ data }) => publish(data.session));
    return () => sub.subscription.unsubscribe();
  }, [client, publish]);

  const isAdmin = isAdminSession(session);

  useEffect(() => {
    document.body.classList.toggle('admin-mode', isAdmin);
  }, [isAdmin]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error('Supabase no configurado');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!isAdminSession(data.session)) {
        await client.auth.signOut();
        throw new Error('Esta cuenta no tiene permisos de administrador.');
      }
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }, [client]);

  const value = useMemo<AlfaAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      ready,
      signIn,
      signOut,
    }),
    [session, isAdmin, ready, signIn, signOut],
  );

  return <AlfaAuthContext.Provider value={value}>{children}</AlfaAuthContext.Provider>;
}

export function useAlfaAuth(): AlfaAuthContextValue {
  const ctx = useContext(AlfaAuthContext);
  if (!ctx) throw new Error('useAlfaAuth debe usarse dentro de AlfaAuthProvider');
  return ctx;
}
