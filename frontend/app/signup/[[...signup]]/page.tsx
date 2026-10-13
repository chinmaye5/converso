import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-[#737373]">Loading sign up...</div>}>
        <SignUp forceRedirectUrl="/" />
      </Suspense>
    </div>
  );
}