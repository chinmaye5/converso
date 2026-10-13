"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  FileText,
  LifeBuoy,
  MessageSquare,
  Sparkles,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "../dashboard/WorkspaceSwitcher";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/knowledge-base", label: "Knowledge Base", icon: FileText },
  { href: "/tickets", label: "Support Tickets", icon: LifeBuoy },
  { href: "/playground", label: "AI Playground", icon: Sparkles },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  onNavClick?: () => void;
}

export function AppSidebar({ onNavClick }: AppSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <aside className="w-60 h-full bg-white border-r border-[#E5E5E5] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand header */}
        <div className="h-14 px-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <Link
            href="/"
            onClick={onNavClick}
            className="flex items-center gap-2 font-semibold text-sm tracking-tight text-[#0A0A0A]"
          >
            <span className="w-2 h-2 bg-[#E30613] rounded-[0.5px]" />
            <span className="tracking-swiss uppercase text-xs font-bold">
              Converso
            </span>
          </Link>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#737373] border border-[#E5E5E5] px-1 py-0.2 rounded-[1px]">
            v1.0
          </span>
        </div>

        {/* Workspace selector */}
        <div className="p-3 border-b border-[#E5E5E5] bg-[#FAFAFA]/50">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation links */}
        <nav className="py-2" aria-label="Main Navigation">
          <p className="px-5 pt-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#737373]">
            Navigation
          </p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavClick}
                    className={`relative flex items-center gap-3 px-5 py-2 text-xs transition-colors ${
                      isActive
                        ? "text-[#0A0A0A] font-medium bg-[#FAFAFA]"
                        : "text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E30613]" />
                    )}
                    <Icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer / Account */}
      <div className="border-t border-[#E5E5E5] p-3">
        <div className="flex items-center justify-between p-2 rounded-[1px] hover:bg-[#F5F5F5] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-6 h-6 rounded-[1px] bg-[#0A0A0A] text-white flex items-center justify-center text-[10px] font-medium shrink-0">
              {user?.firstName ? (
                user.firstName.charAt(0).toUpperCase()
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#0A0A0A] truncate leading-tight">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}
              </p>
              <p className="text-[10px] text-[#737373] truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/login" })}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-[#737373] hover:text-[#E30613] hover:bg-white border border-transparent hover:border-[#E5E5E5] rounded-[1px] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
