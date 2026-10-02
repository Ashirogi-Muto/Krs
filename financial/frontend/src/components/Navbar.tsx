"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { useAuth } from "@/lib/authContext";
import { useLedgerName } from "@/lib/ledger";
import { TransactionModal } from "./TransactionModal";
import { AuditDrawer } from "./AuditDrawer";
import { SearchModal } from "./SearchModal";
import { NotificationPopover } from "./NotificationPopover";

export function Navbar() {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  // Every hook must run on every render, before the early return below (React rule of hooks):
  // calling it after the return crashed the page as soon as a user signed in.
  const ledgerName = useLedgerName();

  if (!user || pathname === "/login") {
    return null;
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Income", href: "/income" },
    { label: "Expenses & Bills", href: "/expenses" },
    { label: "Projects", href: "/projects" },
    { label: "Budgets", href: "/budgets" },
    { label: "Document Vault", href: "/documents" },
    { label: "Reports", href: "/reports" },
  ];

  const adminItems = [
    { label: "User Management", href: "/admin/users" },
    { label: "Metadata Settings", href: "/admin/settings" },
    { label: "Data Import (XLSX)", href: "/admin/import" },
  ];

  const canEdit = role === "EDITOR" || role === "ADMIN";

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <NextLink href="/dashboard" className="nav-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/krs-mark-light.png" alt="KRS logo" width={36} height={36} />
              <div>
                <div className="brand-text-title">KALAM ROBOTICS SOCIETY</div>
                <div className="brand-text-sub">Financial Management{ledgerName ? ` · ${ledgerName} ledger` : ""}</div>
              </div>
            </NextLink>

            <div className="nav-links">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    {item.label}
                  </NextLink>
                );
              })}

              {role === "ADMIN" && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    Admin ▾
                  </button>
                  {showAdminMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        backgroundColor: "#111827",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                        minWidth: "180px",
                        zIndex: 100,
                        overflow: "hidden",
                      }}
                      onMouseLeave={() => setShowAdminMenu(false)}
                    >
                      {adminItems.map((a) => (
                        <NextLink
                          key={a.href}
                          href={a.href}
                          onClick={() => setShowAdminMenu(false)}
                          style={{
                            display: "block",
                            padding: "0.6rem 1rem",
                            fontSize: "0.85rem",
                            color: pathname === a.href ? "#3B82F6" : "#E2E8F0",
                            backgroundColor: pathname === a.href ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            textDecoration: "none",
                            transition: "background-color 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              pathname === a.href ? "rgba(59, 130, 246, 0.1)" : "transparent")
                          }
                        >
                          {a.label}
                        </NextLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Global Search Button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSearchModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.65rem" }}
              title="Global search (Ctrl+K)"
            >
              <span>🔍</span>
              <span style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>Search</span>
              <kbd
                style={{
                  fontSize: "0.65rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: "0.1rem 0.3rem",
                  borderRadius: "3px",
                  color: "#9CA3AF",
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Notification Popover */}
            <NotificationPopover />

            {canEdit && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowTransactionModal(true)}
              >
                + Add Transaction
              </button>
            )}

            {role === "EDITOR" && (
              <NextLink href="/team" className="btn btn-secondary btn-sm">
                Viewers
              </NextLink>
            )}

            {role === "ADMIN" && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAuditDrawer(true)}
                title="View immutable audit trail"
              >
                Audit Trail
              </button>
            )}

            <div className="user-pill">
              <span style={{ fontWeight: 600, color: "#E2E8F0" }}>{user.name.split(" ")[0]}</span>
              <span
                className={`badge ${
                  role === "ADMIN" ? "badge-danger" : role === "EDITOR" ? "badge-info" : "badge-muted"
                }`}
                style={{
                  fontSize: "0.7rem",
                  padding: "0.15rem 0.4rem",
                  backgroundColor: role === "ADMIN" ? "rgba(168, 85, 247, 0.2)" : undefined,
                  color: role === "ADMIN" ? "#C084FC" : undefined,
                  borderColor: role === "ADMIN" ? "rgba(168, 85, 247, 0.4)" : undefined,
                }}
              >
                {role}
              </span>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => logout()}
              title="Sign out of financial dashboard"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {showTransactionModal && (
        <TransactionModal
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            setShowTransactionModal(false);
            window.location.reload();
          }}
        />
      )}

      {showAuditDrawer && (
        <AuditDrawer onClose={() => setShowAuditDrawer(false)} />
      )}

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}
