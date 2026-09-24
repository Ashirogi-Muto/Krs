"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/formatters";

interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data: any;
  after_data: any;
  created_at: string;
}

export function AuditDrawer({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const data = await api.get<AuditLog[]>("/api/audit-logs?limit=50");
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuditLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <span className="badge badge-success">CREATED</span>;
      case "PAYMENT":
        return <span className="badge badge-info">PAYMENT</span>;
      case "UPDATE":
        return <span className="badge badge-warning">UPDATED</span>;
      case "CANCEL":
        return <span className="badge badge-danger">CANCELLED</span>;
      case "UPLOAD_DOC":
        return <span className="badge badge-info">ATTACHED DOC</span>;
      default:
        return <span className="badge badge-muted">{action}</span>;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.125rem", color: "#FFFFFF" }}>Immutable Audit Log</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Append-only historical record of financial modifications
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading audit history...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No audit records recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "0.875rem",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    {getActionBadge(log.action)}
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(log.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    {log.entity_type} • <span style={{ color: "var(--primary)" }}>{log.entity_id}</span>
                  </div>

                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                    Action taken by <strong style={{ color: "var(--text-primary)" }}>{log.user_name}</strong>
                  </div>

                  {log.after_data && (
                    <div
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "rgba(0, 0, 0, 0.25)",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono)",
                        color: "#94A3B8",
                        overflowX: "auto",
                      }}
                    >
                      <pre style={{ margin: 0 }}>{JSON.stringify(log.after_data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
