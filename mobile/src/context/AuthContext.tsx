import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, User } from '../types';
import { setAuthToken } from '../api/client';

const STORAGE_KEY = 'seniorcare.session';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** true tant que la session sauvegardée n'a pas été relue au démarrage. */
  loading: boolean;
  signIn: (session: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Gère la session (token + profil) et la persiste de façon sécurisée sur le téléphone. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage : on restaure la session si elle existe (le senior reste connecté)
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) {
          const session: AuthResponse = JSON.parse(raw);
          setAuthToken(session.accessToken);
          setToken(session.accessToken);
          setUser(session.user);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (session: AuthResponse) => {
    setAuthToken(session.accessToken);
    setToken(session.accessToken);
    setUser(session.user);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ user, token, loading, signIn, signOut }), [user, token, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
