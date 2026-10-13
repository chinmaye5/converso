"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { AppShell } from "../../components/layout/AppShell";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { SkeletonBlock } from "../../components/ui/LoadingState";
import { User, LogOut } from "lucide-react";

type Profile = {
  name: string;
  email: string;
};

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        const token = await getToken();

        const response = await axios.get<Profile>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setProfile(response.data);
      } catch (err) {
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [isLoaded, isSignedIn, getToken, router]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          section="Account"
          title="Operator Profile"
          description="Credentials and authenticated session parameters for your Converso account."
        />

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <div className="bg-white border border-[#E5E5E5] p-6 space-y-4">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0A0A0A] text-white flex items-center justify-center rounded-[1px] font-semibold text-base">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0A0A0A]">
                  {profile?.name}
                </h3>
                <p className="text-xs text-[#737373] font-mono">
                  {profile?.email}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E5E5E5] pt-4 flex items-center justify-between">
              <span className="text-xs text-[#737373]">
                Managed by Clerk Authentication
              </span>
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/login" })}
                className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] text-[#E30613] hover:bg-[#E30613]/5 border border-[#E30613]/30 rounded-[1px] inline-flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

