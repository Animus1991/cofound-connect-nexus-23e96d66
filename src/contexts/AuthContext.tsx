import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { configureApi } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  token?: string;
  refreshToken?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string, token?: string, id?: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const STORAGE_KEY = "cofounderbay_user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logoutRef = useRef<() => void>(() => {});
  const setUserRef = useRef<(u: User | null) => void>(() => {});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { email?: string; name?: string; id?: string; token?: string; refreshToken?: string };
        setUserState({
          id: parsed.id ?? `user-${Date.now()}`,
          email: parsed.email ?? "",
          name: parsed.name,
          token: parsed.token,
          refreshToken: parsed.refreshToken,
        });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  setUserRef.current = setUser;

  useEffect(() => {
    logoutRef.current = logout;
    configureApi({
      getToken: () => user?.token ?? null,
      getRefreshToken: () => user?.refreshToken ?? null,
      onTokenRefreshed: (token, newRefreshToken) => {
        if (user) {
          const updated = { ...user, token, ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}) };
          setUserRef.current(updated);
        }
      },
      onUnauthorized: () => logoutRef.current?.(),
    });
  }, [user, logout]);

  const login = useCallback((email: string, name?: string, token?: string, id?: string, refreshToken?: string) => {
    const newUser: User = {
      id: id ?? `user-${Date.now()}`,
      email,
      name,
      token,
      refreshToken,
    };
    setUser(newUser);
  }, [setUser]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
