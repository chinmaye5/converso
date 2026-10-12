// src/routes/search.route.ts
import { Router } from "express";
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { workspaces } from "../db/schema";
import { searchDocumentChunks } from "../utils/search.utils";
import type { SearchResultChunk } from "../utils/search.utils";

// Router with merged params to access :workspaceId from parent path
const router = Router({ mergeParams: true });

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * POST /api/workspaces/:workspaceId/search
 * Body: { question: string, limit?: number }
 * Returns an array of the most similar document chunks within the workspace.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // 1. Authenticate user via Clerk session.
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: "Please sign in first" });
    }

    // 2. Validate workspaceId from route params.
    const workspaceId = getParam(req.params.workspaceId);

    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required in URL path" });
    }

    // 3. Confirm that the user owns this workspace.
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

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // 4. Validate question input.
    const { question, limit } = req.body as { question: string; limit?: number };

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question must be a non-empty string" });
    }

    // 5. Perform semantic vector search.
    const results: SearchResultChunk[] = await searchDocumentChunks(
      question.trim(),
      workspaceId,
      limit ?? 5,
    );

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
