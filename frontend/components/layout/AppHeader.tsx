"use client";

import React from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useWorkspace } from "../../lib/workspace-context";
import { useTheme } from "../../lib/theme-context";

interface AppHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function AppHeader({ onMenuToggle, isMenuOpen }: AppHeaderProps) {
  const { currentWorkspace } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-[var(--surface)] border-b border-[var(--border)] px-4 md:px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          className="md:hidden p-1.5 text-[var(--fg)] hover:bg-[var(--hover)] border border-[var(--border)] rounded-[1px]"
        >
          {isMenuOpen ? (
            <X className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <Menu className="w-4 h-4 stroke-[1.5]" />
          )}
        </button>

        {/* Current workspace name / breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)]">
            Active
          </span>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="font-medium text-[var(--fg)] truncate max-w-[200px] md:max-w-md">
            {currentWorkspace ? currentWorkspace.name : "Select Workspace"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.05em] text-[var(--fg-muted)]">
          <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full inline-block" />
          System Operational
        </span>

        {/* Dark / Light toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--hover)] border border-[var(--border)] rounded-[1px] transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}


