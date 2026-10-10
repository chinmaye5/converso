import type { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";

export async function getProfile(req: Request, res: Response) {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return res.status(401).json({
            error: "Please sign in first",
        });
    }

    try {
        const user = await clerkClient.users.getUser(userId);

        return res.json({
            name: user.fullName || user.firstName || "User",
            email: user.primaryEmailAddress?.emailAddress || "",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Could not load profile",
        });
    }
}
