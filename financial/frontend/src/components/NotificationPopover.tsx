"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationListResponse {
  unread_count: number;
  items: NotificationItem[];
}

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get<{ unread_count: number }>("/api/notifications/unread-count");
      setUnreadCount(data.unread_count);
    } catch {
      // ignore
    }
  };

  const fetchFullNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.get<NotificationListResponse>("/api/notifications");
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchFullNotifications();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.patch(`/api/notifications/${notif.id}/read`, {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    setIsOpen(false);
    if (notif.entity_type === "EXPENSE" && notif.entity_id) {
      router.push(`/expenses/${notif.entity_id}`);
    } else if (notif.entity_type === "INCOME" && notif.entity_id) {
      router.push(`/income/${notif.entity_id}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/api/notifications/mark-all-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "OVERDUE_BILL":
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)", icon: "🚨" };
      case "DUE_SOON":
        return { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)", icon: "⚠️" };
      case "PAYMENT_RECORDED":
        return { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", icon: "💰" };
      default:
        return { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)", icon: "🔔" };
    }
  };

  return (
    <div style={{ position: "relative" }} ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="btn btn-secondary btn-sm"
        style={{ position: "relative", padding: "0.4rem 0.65rem", display: "flex", alignItems: "center" }}
        title="Notifications"
      >
        <span style={{ fontSize: "1rem" }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              backgroundColor: "#EF4444",
              color: "#FFF",
              borderRadius: "9999px",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "0.1rem 0.35rem",
              minWidth: "18px",
              textAlign: "center",
              lineHeight: 1.2,
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "380px",
            backgroundColor: "#111827",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.85rem 1rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#F9FAFB" }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3B82F6",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.85rem" }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "#6B7280", fontSize: "0.85rem" }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => {
                const style = getTypeStyle(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      backgroundColor: n.is_read ? "transparent" : "rgba(59, 130, 246, 0.05)",
                      cursor: "pointer",
                      display: "flex",
                      gap: "0.75rem",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = n.is_read ? "transparent" : "rgba(59, 130, 246, 0.05)")
                    }
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: style.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.95rem",
                        flexShrink: 0,
                      }}
                    >
                      {style.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: n.is_read ? 500 : 600, color: "#F9FAFB" }}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: "#3B82F6",
                              display: "inline-block",
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#9CA3AF",
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {n.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
