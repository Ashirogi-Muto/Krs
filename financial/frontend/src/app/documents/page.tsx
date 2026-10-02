"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatDate } from "@/lib/formatters";
import { DocumentPreview } from "@/components/DocumentPreview";
import { FileText, Image as ImageIcon, Download, Eye, Trash2, Search, Filter } from "lucide-react";

interface DocumentItem {
  id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  checksum_sha256?: string;
  uploaded_by: string;
  uploader_name?: string;
  uploaded_at: string;
  entity_type?: string;
  entity_id?: string;
  transaction_id?: string;
}

export default function DocumentVaultPage() {
  const { role } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get<DocumentItem[]>("/api/documents");
      setDocuments(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load document vault.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (doc: DocumentItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${doc.filename}"? This will permanently remove the file from storage and dissociate it from ${doc.transaction_id || "its transaction"}. This action is audited.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/documents/${doc.id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      alert(err.message || "Failed to delete document.");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.filename.toLowerCase().includes(search.toLowerCase()) ||
      (doc.transaction_id && doc.transaction_id.toLowerCase().includes(search.toLowerCase())) ||
      (doc.uploader_name && doc.uploader_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType =
      typeFilter === "ALL" ||
      (typeFilter === "IMAGE" && doc.mime_type.startsWith("image/")) ||
      (typeFilter === "PDF" && doc.mime_type === "application/pdf") ||
      (typeFilter === "EXPENSE" && doc.entity_type === "EXPENSE") ||
      (typeFilter === "INCOME" && doc.entity_type === "INCOME");

    return matchesSearch && matchesType;
  });

  const totalVaultSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Document & Receipt Vault</h1>
          <p className="page-subtitle">
            Secure private repository for invoices, vendor bills, cash receipts, and bank slips
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.5rem 1rem",
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
            }}
          >
            Vault: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{documents.length} Files</span> (
            {formatBytes(totalVaultSize)})
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, maxWidth: "600px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search by file name, TX ID, or uploader..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-text"
              style={{ width: "100%", paddingLeft: "2.25rem" }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-input"
            style={{ minWidth: "160px" }}
          >
            <option value="ALL">All Documents</option>
            <option value="IMAGE">Images (JPG, PNG, WebP)</option>
            <option value="PDF">PDF Invoices</option>
            <option value="EXPENSE">Expense Receipts</option>
            <option value="INCOME">Income Proofs</option>
          </select>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadDocuments} disabled={loading}>
          Refresh Vault
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius-md)",
            color: "#F87171",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Grid or Table Display */}
      {loading ? (
        <div className="empty-state">
          <p>Loading document repository...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state card">
          <FileText size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.3 }} />
          <h3>No documents found</h3>
          <p>
            {documents.length === 0
              ? "No receipts or invoices have been attached to transactions yet."
              : "No documents match your filter criteria."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredDocs.map((doc) => {
            const isPdf = doc.mime_type === "application/pdf";
            return (
              <div
                key={doc.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                }}
              >
                <div>
                  {/* File Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isPdf ? "rgba(239, 68, 68, 0.15)" : "rgba(6, 182, 212, 0.15)",
                          color: isPdf ? "#EF4444" : "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>

                      <div style={{ overflow: "hidden" }}>
                        <div
                          title={doc.filename}
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9375rem",
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {doc.filename}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {formatBytes(doc.file_size)} • {isPdf ? "PDF Document" : "Image"}
                        </div>
                      </div>
                    </div>

                    {doc.entity_type && (
                      <span
                        className={`badge ${doc.entity_type === "EXPENSE" ? "badge-danger" : "badge-success"}`}
                        style={{ fontSize: "0.6875rem" }}
                      >
                        {doc.entity_type}
                      </span>
                    )}
                  </div>

                  {/* Transaction Link Info */}
                  <div
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.8125rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Linked TX:</span>
                      <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                        {doc.transaction_id || "Unlinked / Orphan"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Uploaded By:</span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {doc.uploader_name || "Unknown"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Timestamp:</span>
                      <span style={{ color: "var(--text-secondary)" }}>{formatDate(doc.uploaded_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setPreviewDoc({
                          id: doc.id,
                          filename: doc.filename,
                          mime_type: doc.mime_type,
                        })
                      }
                      title="Preview file"
                    >
                      <Eye size={14} /> Preview
                    </button>

                    <a
                      href={`/api/documents/${doc.id}/stream`}
                      download={doc.filename}
                      className="btn btn-secondary btn-sm"
                      title="Download file"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>

                  {role === "EDITOR" && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(doc)}
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
}
