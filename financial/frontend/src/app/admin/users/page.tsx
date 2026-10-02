"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatDate } from "@/lib/formatters";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "VIEWER" | "EDITOR" | "ADMIN";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const { user: currentUser, role } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"VIEWER" | "EDITOR" | "ADMIN">("VIEWER");
  const [newPassword, setNewPassword] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await api.get<UserItem[]>(`/api/admin/users${query}`);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [role, search]);

  const handleRoleChange = async (userId: string, targetRole: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: targetRole });
      loadUsers();
    } catch (err: any) {
      alert(`Role change error: ${err.message}`);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { is_active: !currentStatus });
      loadUsers();
    } catch (err: any) {
      alert(`Status toggle error: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      await api.post("/api/admin/users", {
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        password: newPassword,
      });

      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewRole("VIEWER");
      setNewPassword("");
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetSubmitting(true);
    setResetError(null);

    try {
      await api.post(`/api/admin/users/${resetUser.id}/reset-password`, {
        new_password: resetPassword,
      });
      setResetUser(null);
      setResetPassword("");
      alert(`Password successfully updated for ${resetUser.email}`);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p style={{ color: "#9CA3AF", fontSize: "0.95rem" }}>
            Manage staff, treasurer, and viewer access rights, assign administrative privileges, and reset credentials
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create New User
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Filter users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: "400px" }}
        />
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: "1.25rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9CA3AF" }}>Loading user accounts...</div>
        ) : error ? (
          <div style={{ padding: "2rem", color: "#EF4444", textAlign: "center" }}>{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: "#F9FAFB" }}>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: "#3B82F6" }}>(You)</span>
                      )}
                    </td>
                    <td style={{ color: "#9CA3AF" }}>{u.email}</td>
                    <td>
                      <select
                        className="input"
                        style={{ width: "auto", padding: "0.25rem 0.6rem", fontSize: "0.82rem" }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="VIEWER">VIEWER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`badge ${u.is_active ? "badge-success" : "badge-muted"}`}
                        style={{ cursor: "pointer", border: "none" }}
                        title="Click to toggle status"
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setResetUser(u);
                          setResetPassword("");
                          setResetError(null);
                        }}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1.25rem" }}>Create User Account</h2>
            {createError && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@krs.club"
                  className="input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Access Role *</label>
                <select
                  className="input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="VIEWER">VIEWER (Read-only dashboard, transactions, documents)</option>
                  <option value="EDITOR">EDITOR (Manage income, bills, clearances, projects)</option>
                  <option value="ADMIN">ADMIN (Full management including users, settings, and bulk import)</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">Initial Password (min 12 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="••••••••"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createSubmitting}>
                  {createSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setResetUser(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "0.5rem" }}>Reset Password</h2>
            <p style={{ color: "#9CA3AF", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              Set a new password for <strong style={{ color: "#F3F4F6" }}>{resetUser.email}</strong>
            </p>
            {resetError && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {resetError}
              </div>
            )}
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">New Password (min 12 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="••••••••"
                  className="input"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResetUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resetSubmitting}>
                  {resetSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
