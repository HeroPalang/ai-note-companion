import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  cacheAuthUser,
  clearAuthLocalCache,
  isCurrentUserAdmin,
  isKeepSignedInEnabled,
  readCachedAuthUser,
  supabase,
} from "@/lib/supabase";

type BasicUser = {
  id: string;
  email?: string | null;
};

type AuthContextValue = {
  user: BasicUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: () => T): Promise<T> {
  return Promise.race([promise, sleep(ms).then(fallback)]);
}

async function resolveUser(): Promise<BasicUser | null> {
  try {
    const sessionResult = await withTimeout(supabase.auth.getSession(), 7000, () => ({
      data: { session: null },
      error: null,
    }));
    const { data } = sessionResult;
    const sessionUser = data?.session?.user;
    if (sessionUser?.id) {
      cacheAuthUser(sessionUser);
      return { id: sessionUser.id, email: sessionUser.email ?? null };
    }
  } catch (_error) {
    // Fallback to local cache.
  }

  const canUseCache = isKeepSignedInEnabled() || (typeof navigator !== "undefined" && !navigator.onLine);
  if (canUseCache) {
    const cached = readCachedAuthUser();
    if (cached?.id) return { id: cached.id, email: cached.email ?? null };
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BasicUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshAuth = useCallback(async () => {
    const nextUser = await resolveUser();
    setUser(nextUser);
    if (!bootstrapped) setBootstrapped(true);

    if (!nextUser?.id) {
      setIsAdmin(false);
      return;
    }

    // Admin check is non-blocking so page transitions don't get stuck.
    void withTimeout(isCurrentUserAdmin().catch(() => false), 6000, () => false).then((admin) => {
      setIsAdmin(admin);
    });
  }, [bootstrapped]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthLocalCache();
    setUser(null);
    setIsAdmin(false);
    if (!bootstrapped) setBootstrapped(true);
  }, [bootstrapped]);

  useEffect(() => {
    void refreshAuth();
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        cacheAuthUser(session.user);
      }
      void refreshAuth();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: !bootstrapped,
      isAuthenticated: Boolean(user?.id),
      isAdmin,
      refreshAuth,
      logout,
    }),
    [bootstrapped, isAdmin, logout, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}
