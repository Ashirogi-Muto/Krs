"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/formatters";

interface PaymentMethod {
  id: string;
  name: string;
}

interface PaymentModalProps {
  expense: {
    id: string;
    transaction_id: string;
    description: string;
    vendor: string;
    total_amount: number;
    amount_paid: number;
    amount_pending: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ expense, onClose, onSuccess }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(expense.amount_pending.toString());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMethods() {
      try {
        const methods = await api.get<PaymentMethod[]>("/api/metadata/payment-methods");
        setPaymentMethods(methods);
        if (methods.length > 0) setPaymentMethodId(methods[0].id);
      } catch (err) {
        console.error("Failed to load payment methods:", err);
      }
    }
    loadMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const parsedAmt = parseFloat(paymentAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError("Payment amount must be greater than zero.");
      setLoading(false);
      return;
    }

    if (parsedAmt > expense.amount_pending) {
      setError(`Payment amount (₹${parsedAmt}) cannot exceed remaining balance (₹${expense.amount_pending}).`);
      setLoading(false);
      return;
    }

    try {
      await api.post(`/api/expenses/${expense.id}/payment`, {
        payment_amount: parsedAmt.toFixed(2),
        payment_date: paymentDate,
        payment_method_id: paymentMethodId,
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: "1.25rem", color: "#FFFFFF" }}>Record Payment Clearance</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {expense.transaction_id} — {expense.description} ({expense.vendor})
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

        {/* Bill Summary Banner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.5rem",
            padding: "0.875rem",
            backgroundColor: "var(--bg-surface-elevated)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Total Bill</span>
            <strong className="tabular-num" style={{ color: "var(--text-primary)" }}>
              {formatINR(expense.total_amount)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Paid to Date</span>
            <strong className="tabular-num" style={{ color: "var(--success)" }}>
              {formatINR(expense.amount_paid)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Remaining Due</span>
            <strong className="tabular-num" style={{ color: "var(--warning)" }}>
              {formatINR(expense.amount_pending)}
            </strong>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              borderRadius: "var(--radius-sm)",
              color: "#FCA5A5",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={expense.amount_pending}
                required
                className="input-text"
                style={{ width: "100%" }}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                required
                className="input-text"
                style={{ width: "100%" }}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                required
                className="select-input"
                style={{ width: "100%" }}
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reference / UTR / Cheque No.</label>
              <input
                type="text"
                placeholder="e.g. UTR-987654321"
                className="input-text"
                style={{ width: "100%" }}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Cleared via club UPI account"
              className="input-text"
              style={{ width: "100%" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Recording Clearance..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
