import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-[#737373]">Loading sign in...</div>}>
        <SignIn forceRedirectUrl="/" />
      </Suspense>
    </div>
  );
}