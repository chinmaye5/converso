"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "../../lib/workspace-context";
import { ChevronDown, Plus, Check } from "lucide-react";

export function WorkspaceSwitcher() {
  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    createAndSelectWorkspace,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      setCreateError(null);
      await createAndSelectWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setShowCreateModal(false);
      setIsOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create workspace",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-left bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover)] transition-colors rounded-[1px] group"
        >
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)]">
              Workspace
            </p>
            <p className="text-xs font-semibold text-[var(--fg)] truncate">
              {currentWorkspace ? currentWorkspace.name : "No Workspace"}
            </p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-[1px] py-1 max-h-60 overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-[var(--border)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)]">
                Your Workspaces ({workspaces.length})
              </p>
            </div>
            {workspaces.map((w) => {
              const isSelected = w.id === currentWorkspace?.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    switchWorkspace(w.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[var(--hover)] transition-colors ${
                    isSelected ? "font-semibold text-[var(--fg)]" : "text-[var(--fg-muted)]"
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#E30613]" />}
                </button>
              );
            })}

            <div className="border-t border-[var(--border)] pt-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--fg)] hover:bg-[var(--hover)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#E30613]" />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-none">
          <div className="bg-[var(--surface)] border border-[var(--border)] max-w-sm w-full p-6 shadow-sm rounded-[1px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1.5">
              Workspaces
            </p>
            <h3 className="text-base font-semibold text-[var(--fg)] mb-3">
              Create new workspace
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="new-ws-name"
                  className="block text-xs font-medium uppercase tracking-[0.05em] text-[var(--fg)] mb-1.5"
                >
                  Workspace Name
                </label>
                <input
                  id="new-ws-name"
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Billing Support"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px]"
                />
                {createError && (
                  <p className="text-xs text-[#E30613] mt-1 font-medium">
                    {createError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-3 py-1.5 text-xs font-medium uppercase tracking-[0.04em] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--hover)] rounded-[1px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newWorkspaceName.trim()}
                  className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.04em] btn-primary rounded-[1px] disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}



