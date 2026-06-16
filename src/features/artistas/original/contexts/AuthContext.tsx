import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { api } from "../lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/auth";
import type { ApiResponse, User, UserRole } from "../types";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "FOLLOWER" | "ARTIST";
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthResult = {
  user: User;
  token: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));

  const refreshMe = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<ApiResponse<User>>("/auth/me");
      setUser(response.data.data);
      setToken(storedToken);
    } catch {
      clearStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
    const handler = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("perfilartistico:unauthorized", handler);
    return () => window.removeEventListener("perfilartistico:unauthorized", handler);
  }, [refreshMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await api.post<ApiResponse<AuthResult>>("/auth/login", payload);
    setStoredToken(response.data.data.token);
    setToken(response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await api.post<ApiResponse<AuthResult>>("/auth/register", payload);
    setStoredToken(response.data.data.token);
    setToken(response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => Boolean(user && roles.includes(user.role)),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout,
      refreshMe,
      hasRole
    }),
    [hasRole, isLoading, login, logout, refreshMe, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
