import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { workspaces } from "../db/schema";

function getUserId(req: Request, res: Response) {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    res.status(401).json({ error: "Please sign in first" });
    return null;
  }

  return userId;
}

// CREATE a workspace
export async function createWorkspace(req: Request, res: Response) {
  const userId = getUserId(req, res);
  if (!userId) return;

  const name =
    typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name || name.length > 100) {
    return res.status(400).json({
      error: "Name must contain 1–100 characters",
    });
  }

  try {
    const [workspace] = await db
      .insert(workspaces)
      .values({ name, ownerId: userId })
      .returning();

    return res.status(201).json({ workspace });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not create workspace" });
  }
}

// READ all workspaces owned by the signed-in user
export async function listWorkspaces(req: Request, res: Response) {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const result = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId));

    return res.json({ workspaces: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not load workspaces" });
  }
}

// READ one workspace
export async function getWorkspace(req: Request, res: Response) {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, req.params.id),
          eq(workspaces.ownerId, userId),
        ),
      )
      .limit(1);

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json({ workspace });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not load workspace" });
  }
}

// UPDATE a workspace
export async function updateWorkspace(req: Request, res: Response) {
  const userId = getUserId(req, res);
  if (!userId) return;

  const name =
    typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name || name.length > 100) {
    return res.status(400).json({
      error: "Name must contain 1–100 characters",
    });
  }

  try {
    const [workspace] = await db
      .update(workspaces)
      .set({ name, updatedAt: new Date() })
      .where(
        and(
          eq(workspaces.id, req.params.id),
          eq(workspaces.ownerId, userId),
        ),
      )
      .returning();

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json({ workspace });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not update workspace" });
  }
}

// DELETE a workspace
export async function deleteWorkspace(req: Request, res: Response) {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const [workspace] = await db
      .delete(workspaces)
      .where(
        and(
          eq(workspaces.id, req.params.id),
          eq(workspaces.ownerId, userId),
        ),
      )
      .returning({ id: workspaces.id });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not delete workspace" });
  }
}
