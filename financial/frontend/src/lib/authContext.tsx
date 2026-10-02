"use client";
// Session state for the finance portal (HttpOnly cookie set by /api/auth/login).
// Recreated 2 Oct 2026: the original src/lib was never committed.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

export type Role = "VIEWER" | "EDITOR" | "ADMIN";
export interface AuthUser {
  id: string;
  name: string;
  email: string; // username or email
  role: Role;
  is_active: boolean;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.get<AuthUser>("/api/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const u = await api.post<AuthUser>("/api/auth/login", { email: username.trim(), password });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
