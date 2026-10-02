"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";

interface CategoryItem {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface PaymentMethodItem {
  id: string;
  name: string;
  is_active: boolean;
}

export default function AdminSettingsPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [catSubmitting, setCatSubmitting] = useState(false);

  // New Method Modal
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [methodName, setMethodName] = useState("");
  const [methodSubmitting, setMethodSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, pms] = await Promise.all([
        api.get<CategoryItem[]>("/api/metadata/categories"),
        api.get<PaymentMethodItem[]>("/api/metadata/payment-methods"),
      ]);
      setCategories(cats);
      setMethods(pms);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadData();
  }, [role]);

  const toggleCategoryStatus = async (cat: CategoryItem) => {
    try {
      await api.patch(`/api/admin/categories/${cat.id}/status`, { is_active: !cat.is_active });
      loadData();
    } catch (err: any) {
      alert(`Error updating category: ${err.message}`);
    }
  };

  const toggleMethodStatus = async (pm: PaymentMethodItem) => {
    try {
      await api.patch(`/api/admin/payment-methods/${pm.id}/status`, { is_active: !pm.is_active });
      loadData();
    } catch (err: any) {
      alert(`Error updating payment method: ${err.message}`);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSubmitting(true);
    try {
      await api.post("/api/admin/categories", {
        name: catName.trim(),
        type: catType,
      });
      setShowCatModal(false);
      setCatName("");
      loadData();
    } catch (err: any) {
      alert(`Error creating category: ${err.message}`);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCreateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setMethodSubmitting(true);
    try {
      await api.post("/api/admin/payment-methods", {
        name: methodName.trim(),
      });
      setShowMethodModal(false);
      setMethodName("");
      loadData();
    } catch (err: any) {
      alert(`Error creating payment method: ${err.message}`);
    } finally {
      setMethodSubmitting(false);
    }
  };

  const incomeCats = categories.filter((c) => c.type === "INCOME");
  const expenseCats = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="app-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Financial Metadata & Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Configure accounting categories, payment channels, and active lookup options
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: "2rem" }}>
        {/* Expense Categories */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", margin: 0 }}>Expense Categories</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                Tags applied when recording club expenditures and bills
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setCatType("EXPENSE");
                setShowCatModal(true);
              }}
            >
              + Add Category
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {expenseCats.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500, color: c.is_active ? "#F9FAFB" : "var(--text-muted)" }}>{c.name}</span>
                <button
                  onClick={() => toggleCategoryStatus(c)}
                  className={`badge ${c.is_active ? "badge-success" : "badge-muted"}`}
                  style={{ cursor: "pointer", border: "none" }}
                  title="Click to toggle"
                >
                  {c.is_active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Income Categories */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", margin: 0 }}>Income Categories</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                Tags applied when recording sponsorships, membership, and grants
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setCatType("INCOME");
                setShowCatModal(true);
              }}
            >
              + Add Category
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {incomeCats.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500, color: c.is_active ? "#F9FAFB" : "var(--text-muted)" }}>{c.name}</span>
                <button
                  onClick={() => toggleCategoryStatus(c)}
                  className={`badge ${c.is_active ? "badge-success" : "badge-muted"}`}
                  style={{ cursor: "pointer", border: "none" }}
                  title="Click to toggle"
                >
                  {c.is_active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", margin: 0 }}>Payment Channels & Methods</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                Disbursement and collection mechanisms (UPI, Cheque, NEFT, Cash)
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMethodModal(true)}>
              + Add Method
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {methods.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500, color: m.is_active ? "#F9FAFB" : "var(--text-muted)" }}>{m.name}</span>
                <button
                  onClick={() => toggleMethodStatus(m)}
                  className={`badge ${m.is_active ? "badge-success" : "badge-muted"}`}
                  style={{ cursor: "pointer", border: "none" }}
                  title="Click to toggle"
                >
                  {m.is_active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
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
          onClick={() => setShowCatModal(false)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "1.75rem" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem" }}>Add {catType} Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3D Printing Filament"
                  className="input"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={catSubmitting}>
                  {catSubmitting ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showMethodModal && (
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
          onClick={() => setShowMethodModal(false)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "1.75rem" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem" }}>Add Payment Channel</h2>
            <form onSubmit={handleCreateMethod}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label">Channel / Method Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petty Cash / Imprest"
                  className="input"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMethodModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={methodSubmitting}>
                  {methodSubmitting ? "Adding..." : "Add Method"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
