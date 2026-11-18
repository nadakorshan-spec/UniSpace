import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, errorMessage, getAccessToken, setAccessToken } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<{ data: User }>('/auth/me');
        if (active) setUser(data.data);
      } catch {
        setAccessToken(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const onUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener('unispase:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('unispase:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string } }>('/auth/login', {
      email,
      password,
    });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string } }>('/auth/register', {
      name,
      email,
      password,
    });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export { errorMessage };
