// src/routes/chat.route.ts
import { Router } from "express";
import { chatWithBot } from "../controllers/chat.controller";

// Merge URL params (workspaceId) from parent router
const router = Router({ mergeParams: true });

// POST /api/workspaces/:workspaceId/chat
router.post("/", chatWithBot);

export default router;
