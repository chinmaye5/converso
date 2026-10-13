"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { updateWorkspace, deleteWorkspace, getProfile } from "../../lib/api";
import type { UserProfile } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import {
  Check,
  Bot,
  User,
  LogOut,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export function WorkspaceSettingsView() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const {
    currentWorkspace,
    updateCurrentWorkspaceName,
    refreshWorkspaces,
    workspaces,
  } = useWorkspace();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const token = await getToken();
        if (token) {
          const p = await getProfile(token);
          setProfile(p);
        }
      } catch (err) {
        console.warn("Could not load backend profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadUserProfile();
  }, [getToken]);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWorkspace || !name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const updated = await updateWorkspace(
        token,
        currentWorkspace.id,
        name.trim(),
      );
      updateCurrentWorkspaceName(updated.name);
      setSaveSuccess("Workspace name updated successfully.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update workspace",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkspace() {
    if (!currentWorkspace) return;

    try {
      setDeleting(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      await deleteWorkspace(token, currentWorkspace.id);
      setShowDeleteModal(false);
      await refreshWorkspaces();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete workspace",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="Workspace Settings"
        title="No Workspace Selected"
        description="Select or create a workspace to view its configuration."
      />
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        section="Administration"
        title="Workspace Settings"
        description="Manage workspace parameters, linked resources, and user account credentials."
      />

      {error && (
        <ErrorState
          title="Operation Error"
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {saveSuccess && (
        <div className="p-3.5 border border-[#16A34A]/40 bg-[#16A34A]/5 rounded-[1px] flex items-center gap-2.5 text-xs text-[#16A34A] font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Section 1: Workspace Identity & Rename */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1">
          Identity
        </p>
        <h2 className="text-base font-semibold text-[var(--fg)] mb-4">
          Workspace Details
        </h2>

        <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="ws-name"
              className="block text-xs font-medium uppercase tracking-[0.05em] text-[var(--fg)] mb-1.5"
            >
              Workspace Name
            </label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="w-full px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] rounded-[1px] focus:outline-none focus:ring-1 focus:ring-[#E30613]"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving || name.trim() === currentWorkspace.name}
              className="px-4 py-2 text-xs font-medium uppercase tracking-[0.05em] btn-primary rounded-[1px] transition-colors disabled:opacity-40"
            >
              {saving ? "Updating..." : "Update Name"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-[var(--fg-muted)]">
          <div>
            <p className="text-[10px] uppercase font-sans text-[var(--fg-muted)]">
              Workspace ID
            </p>
            <p className="text-[var(--fg)] mt-0.5 select-all">
              {currentWorkspace.id}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-sans text-[var(--fg-muted)]">
              Created Timestamp
            </p>
            <p className="text-[var(--fg)] mt-0.5">
              {new Date(currentWorkspace.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Account Profile */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1">
              Account
            </p>
            <h2 className="text-base font-semibold text-[var(--fg)]">
              User Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="px-3 py-1.5 text-xs font-medium uppercase tracking-[0.05em] text-[#E30613] hover:bg-[#E30613]/5 border border-[#E30613]/30 rounded-[1px] inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[1px] flex items-center gap-3">
          <div className="w-9 h-9 rounded-[1px] bg-[var(--fg)] text-[var(--btn-text)] flex items-center justify-center font-medium text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--fg)]">
              {profile?.name || "Authenticated Operator"}
            </p>
            <p className="text-[11px] text-[var(--fg-muted)] font-mono">
              {profile?.email || "Managed through Clerk SSO"}
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Chatbot Shortcut */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1">
            Assistant Integration
          </p>
          <h3 className="text-sm font-semibold text-[var(--fg)]">
            Chatbot Instructions & Brand Accent
          </h3>
          <p className="text-xs text-[var(--fg-muted)] mt-1">
            Configure system prompts, assistant name, and primary brand colors.
          </p>
        </div>
        <Link
          href="/chatbot"
          className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--fg)] text-[var(--fg)] rounded-[1px] inline-flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Bot className="w-3.5 h-3.5 text-[#E30613]" />
          <span>Configure Bot</span>
        </Link>
      </div>

      {/* Section 4: Danger Zone */}
      <div className="bg-[var(--surface)] border border-[#E30613]/30 p-6 md:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#E30613] mb-1">
          Danger Zone
        </p>
        <h2 className="text-base font-semibold text-[var(--fg)] mb-1">
          Delete Workspace
        </h2>
        <p className="text-xs text-[var(--fg-muted)] mb-4 max-w-xl leading-relaxed">
          Permanently delete this workspace along with its chatbot, document
          chunks, embeddings, and support tickets. This action cannot be
          reversed.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 text-xs font-medium uppercase tracking-[0.05em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors"
        >
          Delete Workspace
        </button>
      </div>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title={`Delete "${currentWorkspace.name}"?`}
        description="This will permanently delete all associated documents, chatbot configuration, and support tickets. You cannot undo this action."
        confirmLabel="Yes, Delete Workspace"
        isDestructive
        isConfirming={deleting}
        onConfirm={handleDeleteWorkspace}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}



