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
import supabase from '../lib/supabase';
import { api } from '../lib/api';
import type { Profile } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  token: string | null;
  refreshProfile: () => Promise<void>;
  setProfile: (p: Profile | null) => void;
  signOut: () => Promise<void>;
  requireAuth: (action?: () => void) => boolean;
  loginOpen: boolean;
  setLoginOpen: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const syncProfile = useCallback(async (sess: Session | null) => {
    if (!sess?.user || !sess.access_token) {
      setProfile(null);
      return;
    }
    try {
      const p = await api.ensureProfile(sess.access_token);
      setProfile(p);
    } catch (err) {
      console.error('ensureProfile', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      await syncProfile(s);
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      syncProfile(s).finally(() => setLoading(false));
      if (s) setLoginOpen(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.access_token || !user) return;
    try {
      const data = await api.getProfile({ id: user.id }, session.access_token);
      setProfile(data.profile);
    } catch (err) {
      console.error(err);
    }
  }, [session, user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (user && session) {
        action?.();
        return true;
      }
      setLoginOpen(true);
      return false;
    },
    [user, session]
  );

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      token: session?.access_token ?? null,
      refreshProfile,
      setProfile,
      signOut,
      requireAuth,
      loginOpen,
      setLoginOpen,
    }),
    [user, session, profile, loading, refreshProfile, signOut, requireAuth, loginOpen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
