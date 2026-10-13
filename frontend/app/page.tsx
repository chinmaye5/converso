import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingPage } from "../components/landing/LandingPage";

export const metadata = {
  title: "Converso — AI Customer Support Platform",
  description:
    "Deploy AI chatbots that resolve customer queries instantly using your business knowledge. Seamless human handoff when needed.",
};

// Separate async component so auth() runs inside <Suspense>,
// which is required when cacheComponents is enabled in next.config.
async function AuthGate() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return null;
}

export default function RootPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthGate />
      </Suspense>
      <LandingPage />
    </>
  );
}
