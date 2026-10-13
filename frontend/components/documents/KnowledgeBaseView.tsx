"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { uploadDocument, searchKnowledge } from "../../lib/api";
import type { DocumentItem, SearchResultChunk } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { StatusBadge } from "../ui/StatusBadge";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import {
  UploadCloud,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function KnowledgeBaseView() {
  const { getToken } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Session document history
  const [sessionDocuments, setSessionDocuments] = useState<DocumentItem[]>([]);

  // Vector Search Tester state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultChunk[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Invalid file type. Only PDF documents are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File exceeds maximum allowed size of 10 MB (${formatBytes(file.size)}).`,
      );
      return;
    }

    setSelectedFile(file);
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !currentWorkspace) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadSuccess(null);

      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const result = await uploadDocument(
        token,
        currentWorkspace.id,
        selectedFile,
        (progress) => {
          if (progress.total) {
            setUploadProgress(Math.round((progress.loaded * 100) / progress.total));
          }
        },
      );

      setUploadSuccess(
        `Document "${result.document.filename}" processed successfully (${
          result.chunksCreated || "chunks"
        } indexed).`,
      );
      setSessionDocuments((prev) => [result.document, ...prev]);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(
        err instanceof Error ? err.message : "Document upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  async function runSearch() {
    const query = searchQuery.trim();
    if (!query || !currentWorkspace) return;

    try {
      setIsSearching(true);
      setSearchError(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const results = await searchKnowledge(token, currentWorkspace.id, query, 5);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(
        err instanceof Error ? err.message : "Semantic vector search failed",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="Knowledge Base"
        title="No Workspace Selected"
        description="Select or create a workspace before managing knowledge base documents."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        section="Knowledge Base"
        title="Documents & Search"
        description="Upload business documentation (PDF format, up to 10 MB) to generate embeddings for semantic retrieval."
      />

      {/* Upload Zone */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1.5">
          Ingestion Pipeline
        </p>
        <h2 className="text-base font-semibold text-[var(--fg)] mb-4">
          Upload Knowledge Document
        </h2>

        {uploadError && (
          <div className="mb-4">
            <ErrorState
              title="Upload Rejected"
              message={uploadError}
              onRetry={() => setSelectedFile(null)}
            />
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-3.5 border border-[#16A34A]/40 bg-[#16A34A]/5 rounded-[1px] flex items-center gap-2.5 text-xs text-[#16A34A] font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
            className={`border border-dashed p-8 text-center transition-colors rounded-[1px] ${
              isDragging
                ? "border-[#E30613] bg-[#E30613]/5"
                : "border-[#D4D4D4] hover:border-[var(--fg)] bg-[var(--bg-subtle)]"
            }`}
          >
            <UploadCloud className="w-8 h-8 text-[var(--fg-muted)] mx-auto mb-3 stroke-[1.5]" />
            <p className="text-xs font-medium text-[var(--fg)] mb-1">
              Drag and drop your PDF here, or browse files
            </p>
            <p className="text-[11px] text-[var(--fg-muted)] mb-4">
              Supported format: PDF only â€¢ Maximum file size: 10 MB
            </p>

            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="sr-only"
              />
              <span className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--hover)] cursor-pointer transition-colors rounded-[1px]">
                Choose PDF File
              </span>
            </label>
          </div>

          {/* Selected File Details & Upload Action */}
          {selectedFile && (
            <div className="p-4 bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-[#E30613] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--fg)] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-[var(--fg-muted)] font-mono tabular-nums">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs font-medium uppercase tracking-[0.04em] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 text-xs font-medium uppercase tracking-[0.05em] btn-primary transition-colors rounded-[1px] disabled:opacity-50"
                >
                  {uploading ? "Extracting & Embedding..." : "Upload & Ingest"}
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-[var(--fg-muted)] font-mono">
                <span>Uploading to private storage & extracting text...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1 bg-[#E5E5E5] rounded-[1px] overflow-hidden">
                <div
                  className="h-full bg-[#E30613] transition-all duration-150"
                  style={{ width: `${Math.max(uploadProgress, 10)}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Uploaded Documents Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-0.5">
              Indexed Documents
            </p>
            <h2 className="text-base font-semibold text-[var(--fg)]">
              Workspace Document Records
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--fg-muted)]">
            {sessionDocuments.length} document{sessionDocuments.length === 1 ? "" : "s"} indexed
          </span>
        </div>

        {sessionDocuments.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] p-6 text-left">
            <p className="text-xs font-medium text-[var(--fg)] mb-1">
              No documents uploaded in this session
            </p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Upload PDF files above to split text into passage chunks and generate 1024-dimension vector embeddings.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--border)] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
                  <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                    Filename
                  </th>
                  <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                    File Size
                  </th>
                  <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                    Status
                  </th>
                  <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px] text-right">
                    Ingested
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sessionDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--hover)] transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--fg)] flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3 px-4 text-[var(--fg-muted)] font-mono tabular-nums">
                      {formatBytes(doc.sizeBytes)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--fg-muted)] font-mono text-[11px] tabular-nums">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Semantic Vector Search Playground */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-0.5">
              Vector Retrieval Inspection
            </p>
            <h2 className="text-base font-semibold text-[var(--fg)]">
              Test Knowledge Search
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--fg-muted)] uppercase border border-[var(--border)] px-1.5 py-0.5">
            pgvector (1024d)
          </span>
        </div>
        <p className="text-xs text-[var(--fg-muted)] mb-4 max-w-xl leading-relaxed">
          Submit questions to verify similarity search against uploaded document chunks.
        </p>

        {searchError && (
          <div className="mb-4">
            <ErrorState
              title="Search Query Error"
              message={searchError}
              onRetry={runSearch}
            />
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--fg-muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. What is the return refund policy?"
              required
              disabled={isSearching}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 text-xs font-medium uppercase tracking-[0.05em] btn-primary transition-colors rounded-[1px] disabled:opacity-50 shrink-0"
          >
            {isSearching ? "Searching..." : "Query Chunks"}
          </button>
        </form>

        {searchResults && (
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)]">
              Retrieved Chunks ({searchResults.length})
            </p>

            {searchResults.length === 0 ? (
              <div className="border border-[var(--border)] p-4 text-xs text-[var(--fg-muted)]">
                No document chunks matched this query. Upload documents or try different keywords.
              </div>
            ) : (
              <div className="border border-[var(--border)] divide-y divide-[var(--border)]">
                {searchResults.map((result, idx) => (
                  <div key={result.chunk_id || idx} className="p-4 bg-[var(--surface)] text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-[1px] bg-[var(--fg)] text-[var(--btn-text)] flex items-center justify-center text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[var(--fg)]">
                          {result.filename}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#16A34A] bg-[#16A34A]/5 border border-[#16A34A]/30 px-1.5 py-0.5 rounded-[1px]">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[var(--fg)] font-mono text-[11px] bg-[var(--bg-subtle)] p-3 border border-[var(--border)] rounded-[1px] whitespace-pre-wrap leading-relaxed">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



