"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLedgerName } from "@/lib/ledger";
import { TransactionModal } from "./TransactionModal";
import { AuditDrawer } from "./AuditDrawer";
import { SearchModal } from "./SearchModal";
import { NotificationPopover } from "./NotificationPopover";

type Item = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

/**
 * App shell for signed-in users: sidebar on desktop (≥1024 px), top bar + slide-out drawer on phones/tablets,
 * plus search (Ctrl/⌘K), notifications, "Add transaction" (editors) and the audit trail (admin).
 * The login page renders without the shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const ledgerName = useLedgerName();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Close the drawer after navigating; open search with Ctrl/⌘K
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!user || pathname === "/login") {
    return <main>{children}</main>;
  }

  const canEdit = role === "EDITOR" || role === "ADMIN";
  const groups: { title: string; items: Item[] }[] = [
    { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
    {
      title: "Money",
      items: [
        { label: "Income", href: "/income", icon: TrendingUp },
        { label: "Expenses & bills", href: "/expenses", icon: Receipt },
        { label: "Budgets", href: "/budgets", icon: PiggyBank },
      ],
    },
    {
      title: "Records",
      items: [
        { label: "Projects", href: "/projects", icon: FolderKanban },
        { label: "Document vault", href: "/documents", icon: FileText },
        { label: "Reports", href: "/reports", icon: BarChart3 },
      ],
    },
  ];
  if (role === "EDITOR") groups.push({ title: "Team", items: [{ label: "Viewer accounts", href: "/team", icon: Users }] });
  if (role === "ADMIN")
    groups.push({
      title: "Admin",
      items: [
        { label: "User management", href: "/admin/users", icon: UserCog },
        { label: "Categories & methods", href: "/admin/settings", icon: Settings },
        { label: "Data import (XLSX)", href: "/admin/import", icon: Upload },
      ],
    });

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleBadge = role === "ADMIN" ? "badge badge-admin" : role === "EDITOR" ? "badge badge-info" : "badge badge-muted";
  const roleLabel = role === "ADMIN" ? "Audit" : role === "EDITOR" ? "Editor" : "Viewer";

  const brand = (
    <NextLink href="/dashboard" className="sidebar-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/krs-mark-light.png" alt="KRS logo" width={36} height={36} />
      <div>
        <div className="brand-text-title">KRS Finance</div>
        {ledgerName ? <span className="ledger-pill">{ledgerName} ledger</span> : <div className="brand-text-sub">Kalam Robotics Society</div>}
      </div>
    </NextLink>
  );

  const nav = (
    <nav className="sidebar-nav" aria-label="Main">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="nav-group-title">{g.title}</div>
          {g.items.map((item) => {
            const Icon = item.icon;
            return (
              <NextLink key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? "active" : ""}`} aria-current={isActive(item.href) ? "page" : undefined}>
                <Icon />
                {item.label}
              </NextLink>
            );
          })}
          {g.title === "Admin" && (
            <button type="button" className="nav-item" onClick={() => setShowAuditDrawer(true)}>
              <ShieldCheck />
              Audit trail
            </button>
          )}
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="sidebar-footer">
      <div className="user-card">
        <div className="avatar" aria-hidden>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="name">{user.name}</div>
          <span className={roleBadge} style={{ fontSize: "0.62rem", padding: "0.05rem 0.4rem" }}>
            {roleLabel}
          </span>
        </div>
      </div>
      <button type="button" className="nav-item" onClick={() => logout()}>
        <LogOut />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        {brand}
        {nav}
        {footer}
      </aside>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>{brand}</div>
              <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setDrawerOpen(false)} style={{ marginRight: "0.5rem" }}>
                <X />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </>
      )}

      <div className="shell-main">
        <header className="topbar">
          <button type="button" className="icon-btn mobile-only" aria-label="Open menu" data-testid="nav-toggle" onClick={() => setDrawerOpen(true)}>
            <Menu />
          </button>
          <NextLink href="/dashboard" className="topbar-title mobile-only">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/krs-mark-light.png" alt="" width={30} height={30} />
            <span className="t">KRS Finance{ledgerName ? ` · ${ledgerName}` : ""}</span>
          </NextLink>
          <button type="button" className="search-trigger" onClick={() => setShowSearchModal(true)}>
            <Search />
            Search transactions, vendors…
            <span className="kbd">Ctrl K</span>
          </button>
          <div className="topbar-spacer desktop-only" />
          <div className="topbar-actions">
            <button type="button" className="icon-btn search-icon" aria-label="Search" onClick={() => setShowSearchModal(true)}>
              <Search />
            </button>
            <NotificationPopover />
            {canEdit && (
              <button type="button" className="btn btn-primary btn-sm desktop-only" onClick={() => setShowTransactionModal(true)}>
                <Plus />
                Add transaction
              </button>
            )}
          </div>
        </header>

        <main>{children}</main>

        {canEdit && (
          <button type="button" className="fab" aria-label="Add transaction" onClick={() => setShowTransactionModal(true)}>
            <Plus />
          </button>
        )}
      </div>

      {showTransactionModal && (
        <TransactionModal
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            setShowTransactionModal(false);
            window.location.reload();
          }}
        />
      )}
      {showAuditDrawer && <AuditDrawer onClose={() => setShowAuditDrawer(false)} />}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </div>
  );
}
