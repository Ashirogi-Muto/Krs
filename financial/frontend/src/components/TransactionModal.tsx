"use client";

import React, { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { formatINR } from "@/lib/formatters";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface TransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionModal({ onClose, onSuccess }: TransactionModalProps) {
  const [txType, setTxType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [dateVal, setDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Expense specific
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [dueDate, setDueDate] = useState("");

  // Income specific
  const [source, setSource] = useState("");
  const [receivedBy, setReceivedBy] = useState("Treasurer");
  const [incomeAmount, setIncomeAmount] = useState("");

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catData, methodData] = await Promise.all([
          api.get<Category[]>(`/api/metadata/categories?type=${txType}`),
          api.get<PaymentMethod[]>("/api/metadata/payment-methods"),
        ]);
        setCategories(catData);
        if (catData.length > 0) setCategoryId(catData[0].id);
        setPaymentMethods(methodData);
        if (methodData.length > 0) setPaymentMethodId(methodData[0].id);
      } catch (err: any) {
        console.error("Failed to load metadata:", err);
      }
    }
    loadMetadata();
  }, [txType]);

  // Derived pending amount for expense
  const parsedTotal = parseFloat(totalAmount) || 0;
  const parsedPaid = parseFloat(amountPaid) || 0;
  const pendingAmount = Math.max(0, parsedTotal - parsedPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (txType === "EXPENSE") {
        if (parsedPaid > parsedTotal) {
          throw new Error(`Amount paid (₹${parsedPaid}) cannot exceed total bill amount (₹${parsedTotal})`);
        }

        const expPayload = {
          bill_date: dateVal,
          description: description.trim(),
          category_id: categoryId,
          vendor: vendor.trim(),
          total_amount: parsedTotal.toFixed(2),
          amount_paid: parsedPaid.toFixed(2),
          due_date: dueDate || null,
          payment_date: parsedPaid > 0 ? dateVal : null,
          payment_method_id: paymentMethodId || null,
          reference_number: referenceNumber.trim() || null,
          notes: notes.trim() || null,
        };

        const createdExp = await api.post<any>("/api/expenses", expPayload);

        // Atomic upload if receipt attached
        if (receiptFile && createdExp?.id) {
          const formData = new FormData();
          formData.append("file", receiptFile);
          formData.append("entity_type", "EXPENSE");
          formData.append("entity_id", createdExp.id);
          await api.upload("/api/documents/upload", formData);
        }
      } else {
        const parsedIncome = parseFloat(incomeAmount) || 0;
        if (parsedIncome <= 0) {
          throw new Error("Income amount must be greater than zero");
        }

        const incPayload = {
          date: dateVal,
          source: source.trim(),
          category_id: categoryId,
          amount: parsedIncome.toFixed(2),
          payment_method_id: paymentMethodId,
          received_by: receivedBy.trim(),
          reference_number: referenceNumber.trim() || null,
          notes: notes.trim() || null,
        };

        const createdInc = await api.post<any>("/api/income", incPayload);

        if (receiptFile && createdInc?.id) {
          const formData = new FormData();
          formData.append("file", receiptFile);
          formData.append("entity_type", "INCOME");
          formData.append("entity_id", createdInc.id);
          await api.upload("/api/documents/upload", formData);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to record transaction. Please verify fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: "1.25rem", color: "#FFFFFF" }}>Quick Add Transaction</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Record club inflow or expense with optional receipt vault attachment
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

        {/* Type Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button
            type="button"
            className={`btn ${txType === "EXPENSE" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => setTxType("EXPENSE")}
          >
            Expense / Bill (Outflow)
          </button>
          <button
            type="button"
            className={`btn ${txType === "INCOME" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => setTxType("INCOME")}
          >
            Income (Inflow)
          </button>
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
          {txType === "EXPENSE" ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bill Date *</label>
                  <input
                    type="date"
                    required
                    className="input-text"
                    style={{ width: "100%" }}
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auditorium booking, 3D printing filament"
                  className="input-text"
                  style={{ width: "100%" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vendor / Payee *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audio Pro Rentals, Campus Facilities"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    required
                    className="select-input"
                    style={{ width: "100%" }}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Bill Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Cleared / Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic pending indicator */}
              <div
                style={{
                  padding: "0.625rem 0.875rem",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>Derived Pending Balance:</span>
                <strong
                  className="tabular-num"
                  style={{ color: pendingAmount > 0 ? "var(--warning)" : "var(--success)" }}
                >
                  {formatINR(pendingAmount)} ({pendingAmount > 0 ? (parsedPaid > 0 ? "PARTIALLY PAID" : "PENDING") : "PAID"})
                </strong>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
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
                  <label className="form-label">Receipt / Reference No.</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-1001, UPI txn ID"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    className="input-text"
                    style={{ width: "100%" }}
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Received (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Source / Contributor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IILM University, Tech Sponsor"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    required
                    className="select-input"
                    style={{ width: "100%" }}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
                  <label className="form-label">Received By *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Treasurer, President"
                    className="input-text"
                    style={{ width: "100%" }}
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Number (UPI / Cheque / Bank Ref)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-123456789"
                  className="input-text"
                  style={{ width: "100%" }}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Document / Receipt Vault Attachment */}
          <div className="form-group" style={{ marginTop: "0.5rem" }}>
            <label className="form-label">Attach Supporting Document (Receipt, Bill, Invoice, PDF)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="input-text"
              style={{ width: "100%", padding: "0.4rem" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setReceiptFile(e.target.files[0]);
                }
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
              Allowed: JPG, PNG, WEBP, PDF (Max 10MB). Encrypted and stored in private vault.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Description</label>
            <textarea
              rows={2}
              placeholder="Additional internal financial notes..."
              className="input-text"
              style={{ width: "100%", resize: "vertical" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving Transaction..." : `Save ${txType === "EXPENSE" ? "Expense" : "Income"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
