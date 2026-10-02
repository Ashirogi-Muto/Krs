"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SearchResultItem {
  id: string;
  entity_type: string;
  title: string;
  subtitle: string;
  url: string;
  tag?: string;
  extra?: string;
}

interface SearchResponse {
  query: string;
  total_results: number;
  transactions: SearchResultItem[];
  projects: SearchResultItem[];
  documents: SearchResultItem[];
  users: SearchResultItem[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<SearchResponse>(`/api/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "640px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search transactions, projects, vault receipts, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: "#F9FAFB",
              fontSize: "1.05rem",
            }}
          />
          {loading && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Searching...</span>
          )}
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.4rem",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              color: "var(--text-secondary)",
            }}
          >
            ESC
          </span>
        </div>

        {/* Search Results Area */}
        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "1rem" }}>
          {!query.trim() ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Type keywords to search across the entire KRS financial ledger.
            </div>
          ) : results && results.total_results === 0 && !loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              No matches found for "{query}".
            </div>
          ) : results ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Transactions */}
              {results.transactions.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Transactions ({results.transactions.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {results.transactions.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigateTo(t.url)}
                        style={{
                          padding: "0.6rem 0.8rem",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                      >
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#F9FAFB" }}>{t.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{t.subtitle}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {t.extra && <span style={{ fontSize: "0.75rem", color: "#F59E0B" }}>{t.extra}</span>}
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "9999px",
                              backgroundColor: t.entity_type === "INCOME" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                              color: t.entity_type === "INCOME" ? "#10B981" : "#EF4444",
                              fontWeight: 600,
                            }}
                          >
                            {t.tag || t.entity_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Projects & Events ({results.projects.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {results.projects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigateTo(p.url)}
                        style={{
                          padding: "0.6rem 0.8rem",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                      >
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#F9FAFB" }}>{p.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{p.subtitle}</div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(6, 182, 212, 0.2)",
                            color: "var(--primary)",
                            fontWeight: 600,
                          }}
                        >
                          {p.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vault Documents */}
              {results.documents.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Document Vault ({results.documents.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {results.documents.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => navigateTo(d.url)}
                        style={{
                          padding: "0.6rem 0.8rem",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                      >
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#F9FAFB" }}>{d.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{d.subtitle}</div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(14, 165, 233, 0.2)",
                            color: "#0EA5E9",
                            fontWeight: 600,
                          }}
                        >
                          {d.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users (Admin Only) */}
              {results.users.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Users ({results.users.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => navigateTo(u.url)}
                        style={{
                          padding: "0.6rem 0.8rem",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                      >
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#F9FAFB" }}>{u.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{u.subtitle}</div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(168, 85, 247, 0.2)",
                            color: "#A855F7",
                            fontWeight: 600,
                          }}
                        >
                          {u.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
