// src/routes/search.route.ts
import { Router } from "express";
import type { Request, Response } from "express";
import { searchDocumentChunks } from "../utils/search.utils";
import type { SearchResultChunk } from "../utils/search.utils";

// Router with merged params to access :workspaceId from parent path
const router = Router({ mergeParams: true });

/**
 * POST /api/workspaces/:workspaceId/search
 * Body: { question: string, limit?: number }
 * Returns an array of the most similar document chunks within the workspace.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params as { workspaceId: string };
    const { question, limit } = req.body as { question: string; limit?: number };

    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required in URL path" });
    }
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question must be a non‑empty string" });
    }

    const results: SearchResultChunk[] = await searchDocumentChunks(
      question,
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
