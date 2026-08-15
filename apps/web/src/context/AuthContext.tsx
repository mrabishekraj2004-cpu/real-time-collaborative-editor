"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthUser,
  getProfile,
  loginUser,
  registerUser,
} from "../lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

interface AuthProviderProps {
  children: ReactNode;
}

const ACCESS_TOKEN_KEY =
  "collab-docs-access-token";

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    async function restoreSession() {
      const savedToken =
        window.localStorage.getItem(
          ACCESS_TOKEN_KEY,
        );

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile =
          await getProfile(savedToken);

        setAccessToken(savedToken);
        setUser(profile);
      } catch {
        window.localStorage.removeItem(
          ACCESS_TOKEN_KEY,
        );

        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      const response = await loginUser(
        email,
        password,
      );

      window.localStorage.setItem(
        ACCESS_TOKEN_KEY,
        response.accessToken,
      );

      setAccessToken(
        response.accessToken,
      );

      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ) => {
      await registerUser(
        name,
        email,
        password,
      );

      const loginResponse =
        await loginUser(email, password);

      window.localStorage.setItem(
        ACCESS_TOKEN_KEY,
        loginResponse.accessToken,
      );

      setAccessToken(
        loginResponse.accessToken,
      );

      setUser(loginResponse.user);
    },
    [],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(
      ACCESS_TOKEN_KEY,
    );

    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(
        user && accessToken,
      ),
      login,
      register,
      logout,
    }),
    [
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}