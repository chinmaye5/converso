"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function LogoutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: "/login" });
  }, [signOut]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E5] p-6 text-center max-w-sm w-full rounded-[1px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373] mb-1">
          Session Terminating
        </p>
        <p className="text-xs font-mono text-[#0A0A0A]">
          Signing out of Converso...
        </p>
      </div>
    </div>
  );
}

