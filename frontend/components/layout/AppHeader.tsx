"use client";

import React from "react";
import { Menu, X } from "lucide-react";
import { useWorkspace } from "../../lib/workspace-context";

interface AppHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function AppHeader({ onMenuToggle, isMenuOpen }: AppHeaderProps) {
  const { currentWorkspace } = useWorkspace();

  return (
    <header className="h-14 bg-white border-b border-[#E5E5E5] px-4 md:px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          className="md:hidden p-1.5 text-[#0A0A0A] hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded-[1px]"
        >
          {isMenuOpen ? (
            <X className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <Menu className="w-4 h-4 stroke-[1.5]" />
          )}
        </button>

        {/* Current workspace name / breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#737373]">
            Active
          </span>
          <span className="text-[#E5E5E5]">/</span>
          <span className="font-medium text-[#0A0A0A] truncate max-w-[200px] md:max-w-md">
            {currentWorkspace ? currentWorkspace.name : "Select Workspace"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.05em] text-[#737373]">
          <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full inline-block" />
          System Operational
        </span>
      </div>
    </header>
  );
}
