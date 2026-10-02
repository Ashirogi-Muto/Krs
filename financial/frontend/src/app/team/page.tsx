"use client";

// Viewer accounts, managed by the treasurer (EDITOR). Only VIEWER accounts are listed or changed here.
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatDate } from "@/lib/formatters";

interface Viewer {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function ViewersPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setViewers(await api.get<Viewer[]>("/api/team/viewers"));
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (role !== "EDITOR" && role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [role, loading, router, load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post("/api/team/viewers", { name, username, password });
      setMessage({ ok: true, text: `Viewer "${username}" created. Share the password privately.` });
      setName("");
      setUsername("");
      setPassword("");
      load();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    }
  };

  const toggle = async (v: Viewer) => {
    try {
      await api.put(`/api/team/viewers/${v.id}/status`, { is_active: !v.is_active });
      load();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    }
  };

  const reset = async (v: Viewer) => {
    const pw = window.prompt(`New password for ${v.email} (at least 12 characters):`);
    if (!pw) return;
    try {
      await api.post(`/api/team/viewers/${v.id}/reset-password`, { new_password: pw });
      setMessage({ ok: true, text: `Password for "${v.email}" changed.` });
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    }
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Viewer accounts</h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only accounts for this ledger. Every change is recorded in the audit trail.</p>
      </div>

      {message && (
        <div className="card" style={{ marginBottom: "1rem", color: message.ok ? "#86EFAC" : "#FCA5A5" }}>
          {message.text}
        </div>
      )}

      <form className="card" onSubmit={create} style={{ marginBottom: "1.5rem", display: "grid", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Add a viewer</h2>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            <span className="label">Full name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </label>
          <label>
            <span className="label">Username</span>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required pattern="[A-Za-z0-9._\-]{3,64}" autoCapitalize="none" />
          </label>
          <label>
            <span className="label">Password (12+ characters)</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" />
          </label>
        </div>
        <div>
          <button className="btn btn-primary" type="submit">Create viewer</button>
        </div>
      </form>

      <div className="card table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {viewers.map((v) => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>{v.email}</td>
                <td>{v.is_active ? "Active" : "Disabled"}</td>
                <td>{formatDate(v.created_at)}</td>
                <td style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggle(v)}>{v.is_active ? "Disable" : "Enable"}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => reset(v)}>Reset password</button>
                </td>
              </tr>
            ))}
            {viewers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-secondary)" }}>No viewer accounts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
