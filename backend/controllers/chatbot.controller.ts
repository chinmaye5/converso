
import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

import { db } from "../db";
import { workspaces, chatbots } from "../db/schema";

// Check who is signed in
function getUserId(req: Request, res: Response) {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        res.status(401).json({ error: "Please sign in first" });
        return null;
    }

    return userId;
}

// Check whether this workspace belongs to the signed-in user
async function ownsWorkspace(workspaceId: string, userId: string) {
    const [workspace] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(
            and(
                eq(workspaces.id, workspaceId),
                eq(workspaces.ownerId, userId),
            ),
        )
        .limit(1);

    return Boolean(workspace);
}

// CREATE chatbot
export async function createChatbot(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    const name =
        typeof req.body?.name === "string"
            ? req.body.name.trim()
            : "Support Assistant";

    if (!name || name.length > 100) {
        return res.status(400).json({
            error: "Name must contain 1–100 characters",
        });
    }

    try {
        if (!(await ownsWorkspace(workspaceId, userId))) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const [chatbot] = await db
            .insert(chatbots)
            .values({ workspaceId, name })
            .returning();

        return res.status(201).json({ chatbot });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Could not create chatbot. It may already exist.",
        });
    }
}

// READ chatbot
export async function getChatbot(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    try {
        if (!(await ownsWorkspace(workspaceId, userId))) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const [chatbot] = await db
            .select()
            .from(chatbots)
            .where(eq(chatbots.workspaceId, workspaceId))
            .limit(1);

        if (!chatbot) {
            return res.status(404).json({ error: "Chatbot not found" });
        }

        return res.json({ chatbot });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Could not load chatbot" });
    }
}

// UPDATE chatbot settings
export async function updateChatbot(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    const updates: {
        name?: string;
        systemPrompt?: string;
        primaryColor?: string;
        isActive?: boolean;
        updatedAt?: Date;
    } = {};

    if (req.body?.name !== undefined) {
        if (
            typeof req.body.name !== "string" ||
            !req.body.name.trim() ||
            req.body.name.trim().length > 100
        ) {
            return res.status(400).json({ error: "Invalid chatbot name" });
        }

        updates.name = req.body.name.trim();
    }

    if (req.body?.systemPrompt !== undefined) {
        if (
            typeof req.body.systemPrompt !== "string" ||
            req.body.systemPrompt.length > 10000
        ) {
            return res.status(400).json({ error: "Invalid system prompt" });
        }

        updates.systemPrompt = req.body.systemPrompt;
    }

    if (req.body?.primaryColor !== undefined) {
        if (
            typeof req.body.primaryColor !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(req.body.primaryColor)
        ) {
            return res.status(400).json({
                error: "Primary color must be a hex color like #2563eb",
            });
        }

        updates.primaryColor = req.body.primaryColor;
    }

    if (req.body?.isActive !== undefined) {
        if (typeof req.body.isActive !== "boolean") {
            return res.status(400).json({ error: "isActive must be true or false" });
        }

        updates.isActive = req.body.isActive;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields provided" });
    }

    updates.updatedAt = new Date();

    try {
        if (!(await ownsWorkspace(workspaceId, userId))) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const [chatbot] = await db
            .update(chatbots)
            .set(updates)
            .where(eq(chatbots.workspaceId, workspaceId))
            .returning();

        if (!chatbot) {
            return res.status(404).json({ error: "Chatbot not found" });
        }

        return res.json({ chatbot });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Could not update chatbot" });
    }
}

// DELETE chatbot
export async function deleteChatbot(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    try {
        if (!(await ownsWorkspace(workspaceId, userId))) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const [chatbot] = await db
            .delete(chatbots)
            .where(eq(chatbots.workspaceId, workspaceId))
            .returning({ id: chatbots.id });

        if (!chatbot) {
            return res.status(404).json({ error: "Chatbot not found" });
        }

        return res.json({ message: "Chatbot deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Could not delete chatbot" });
    }
}
