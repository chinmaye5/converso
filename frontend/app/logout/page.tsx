
"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function LogoutPage() {
    const { signOut } = useClerk();

    useEffect(() => {
        signOut({ redirectUrl: "/login" });
    }, [signOut]);

    return <p>Logging out...</p>;
}
