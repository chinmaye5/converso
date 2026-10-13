"use client";

import React, { useState } from "react";
import { useWorkspace } from "../../lib/workspace-context";

export function OnboardingModal() {
  const { needsOnboarding, createAndSelectWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!needsOnboarding) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Workspace name is required");
      return;
    }
    if (trimmed.length > 100) {
      setError("Workspace name must be under 100 characters");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createAndSelectWorkspace(trimmed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workspace",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-none">
      <div className="bg-[var(--surface)] border border-[var(--border)] max-w-md w-full p-8 shadow-sm rounded-[1px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#E30613] mb-1.5">
          Workspace Onboarding
        </p>
        <h2 className="text-xl font-semibold text-[var(--fg)] tracking-tight mb-2">
          Create your first workspace
        </h2>
        <p className="text-sm text-[var(--fg-muted)] mb-6 leading-relaxed">
          Workspaces organize your knowledge documents, AI chatbot settings,
          and customer support tickets.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="workspace-name"
              className="block text-xs font-medium uppercase tracking-[0.05em] text-[var(--fg)] mb-1.5"
            >
              Workspace Name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Acme Support"
              maxLength={100}
              required
              disabled={submitting}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[#E30613] focus:border-[#E30613] rounded-[1px]"
            />
            {error && (
              <p className="text-xs text-[#E30613] mt-1.5 font-medium">
                {error}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-2.5 px-4 text-xs font-medium uppercase tracking-[0.06em] btn-primary transition-colors rounded-[1px] disabled:opacity-50"
            >
              {submitting ? "Creating Workspace..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



