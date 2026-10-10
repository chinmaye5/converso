import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignIn forceRedirectUrl="/profile" />
        </Suspense>
    );
}