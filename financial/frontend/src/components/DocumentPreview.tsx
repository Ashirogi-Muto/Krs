"use client";

import React from "react";

interface DocumentPreviewProps {
  document: {
    id: string;
    filename: string;
    mime_type: string;
    file_size: number;
    transaction_id?: string;
  };
  onClose: () => void;
}

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const streamUrl = `/api/documents/${document.id}/stream`;
  const isPdf = document.mime_type === "application/pdf";
  const isImage = document.mime_type.startsWith("image/");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "800px", width: "95%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: "1.125rem", color: "#FFFFFF" }}>{document.filename}</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {document.transaction_id ? `Linked to ${document.transaction_id} • ` : ""}
              {(document.file_size / 1024).toFixed(1)} KB • {document.mime_type}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a
              href={streamUrl}
              download={document.filename}
              className="btn btn-secondary btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "0 0.5rem",
              }}
            >
              &times;
            </button>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: "var(--radius-sm)",
            padding: "1rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "350px",
            maxHeight: "65vh",
            overflow: "auto",
          }}
        >
          {isImage && (
            <img
              src={streamUrl}
              alt={document.filename}
              style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "4px" }}
            />
          )}

          {isPdf && (
            <iframe
              src={streamUrl}
              title={document.filename}
              style={{ width: "100%", height: "550px", border: "none", borderRadius: "4px" }}
            />
          )}

          {!isImage && !isPdf && (
            <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
              <p style={{ marginBottom: "1rem" }}>Preview not directly supported for this format.</p>
              <a href={streamUrl} download={document.filename} className="btn btn-primary">
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
