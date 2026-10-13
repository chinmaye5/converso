"use client";

import React, { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { WorkspaceProvider } from "../../lib/workspace-context";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { OnboardingModal } from "../dashboard/OnboardingModal";
import { PageLoadingSkeleton } from "../ui/LoadingState";

export function AppShell({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  // Keep sidebar links pointing at /dashboard for Overview


  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <PageLoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <div className="min-h-screen flex bg-[#FAFAFA] text-[#0A0A0A]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block fixed inset-y-0 left-0 z-30">
          <AppSidebar />
        </div>

        {/* Mobile Slide-over Sidebar */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 max-w-[80vw] h-full bg-white shadow-xl">
              <AppSidebar onNavClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 md:pl-60 flex flex-col min-w-0 min-h-screen">
          <AppHeader
            isMenuOpen={mobileMenuOpen}
            onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          <main className="flex-1 p-6 md:p-10 max-w-[1200px] w-full">
            {children}
          </main>
        </div>

        {/* Onboarding Dialog if 0 workspaces exist */}
        <OnboardingModal />
      </div>
    </WorkspaceProvider>
  );
}
