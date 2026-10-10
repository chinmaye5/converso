
"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

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

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            router.replace("/login");
            return;
        }

        async function loadProfile() {
            try {
                const token = await getToken();

                const response = await axios.get<Profile>(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log("token:", token)

                setProfile(response.data);
            } catch (err) {
                setError("Could not load your profile.");
            }
        }

        loadProfile();
    }, [isLoaded, isSignedIn, getToken, router]);

    if (!isLoaded || (!profile && !error)) {
        return <p>Loading profile...</p>;
    }

    if (error) return <p>{error}</p>;

    return (
        <main>
            <h1>My Profile</h1>

            <p>Name: {profile?.name}</p>
            <p>Email: {profile?.email}</p>

            <button onClick={() => router.push("/logout")}>
                Logout
            </button>
        </main>
    );
}
