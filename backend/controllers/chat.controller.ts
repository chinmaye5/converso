// src/controllers/chat.controller.ts
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { workspaces } from "../db/schema";
import { runChat } from "../ai/chat.graph";

/**
 * POST /api/workspaces/:workspaceId/chat
 * Body: { question: string }
 * Returns the generated answer and the source chunks used.
 */
export async function chatWithBot(req: Request, res: Response) {
  try {
    // 1. Authenticate via Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Please log in first" });
    }

    // 2. Workspace ID from URL
    const { workspaceId } = req.params as { workspaceId: string };

    // 3. Extract the user question
    const { question } = req.body as { question?: string };
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "A question is required" });
    }

    // 4. Verify workspace ownership
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace || workspace.ownerId !== userId) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // 5. Run the LangGraph workflow
    const result = await runChat(question.trim(), workspaceId);

    // 6. Respond with answer and sources
    return res.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ message: "Failed to generate a response" });
  }
}
