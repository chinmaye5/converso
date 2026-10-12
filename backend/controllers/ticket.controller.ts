import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import {
    workspaces,
    conversations,
    supportTickets,
} from "../db/schema";

const TICKET_STATUSES = ["open", "in_progress", "resolved"] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];

// Express can type route params as string | string[] | undefined.
// This turns them into string | undefined.
function getParam(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

export async function createTicket(req: Request, res: Response) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                message: "Please log in first",
            });
        }

        const workspaceId = getParam(req.params.workspaceId);

        if (!workspaceId) {
            return res.status(400).json({
                message: "Workspace ID is required",
            });
        }

        const { conversationId, subject, description } = req.body;

        if (
            typeof subject !== "string" ||
            !subject.trim() ||
            subject.trim().length > 200
        ) {
            return res.status(400).json({
                message: "Subject is required and must be 200 characters or fewer",
            });
        }

        if (
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Description is required",
            });
        }

        // Confirm that the user owns this workspace.
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
            return res.status(404).json({
                message: "Workspace not found",
            });
        }

        // If supplied, verify that the conversation belongs to this
        // workspace and user.
        if (conversationId !== undefined) {
            if (
                typeof conversationId !== "string" ||
                !conversationId.trim()
            ) {
                return res.status(400).json({
                    message: "Invalid conversationId",
                });
            }

            const [conversation] = await db
                .select({ id: conversations.id })
                .from(conversations)
                .where(
                    and(
                        eq(conversations.id, conversationId),
                        eq(conversations.workspaceId, workspaceId),
                        eq(conversations.userId, userId),
                    ),
                )
                .limit(1);

            if (!conversation) {
                return res.status(404).json({
                    message: "Conversation not found",
                });
            }
        }

        const [ticket] = await db
            .insert(supportTickets)
            .values({
                workspaceId,
                conversationId: conversationId ?? null,
                createdBy: userId,
                subject: subject.trim(),
                description: description.trim(),
            })
            .returning();

        return res.status(201).json({ ticket });
    } catch (error) {
        console.error("Create ticket error:", error);

        return res.status(500).json({
            message: "Failed to create support ticket",
        });
    }
}

export async function listTickets(req: Request, res: Response) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ message: "Please log in first" });
        }

        const workspaceId = getParam(req.params.workspaceId);

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required" });
        }

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
            return res.status(404).json({ message: "Workspace not found" });
        }

        const tickets = await db
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.workspaceId, workspaceId))
            .orderBy(desc(supportTickets.createdAt));

        return res.json({ tickets });
    } catch (error) {
        console.error("List tickets error:", error);
        return res.status(500).json({ message: "Failed to list tickets" });
    }
}

export async function updateTicketStatus(req: Request, res: Response) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ message: "Please log in first" });
        }

        const workspaceId = getParam(req.params.workspaceId);
        const ticketId = getParam(req.params.ticketId);

        if (!workspaceId || !ticketId) {
            return res.status(400).json({
                message: "Workspace ID and ticket ID are required",
            });
        }

        const { status } = req.body;

        if (
            typeof status !== "string" ||
            !TICKET_STATUSES.includes(status as TicketStatus)
        ) {
            return res.status(400).json({
                message: "Status must be open, in_progress, or resolved",
            });
        }

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
            return res.status(404).json({ message: "Workspace not found" });
        }

        const [ticket] = await db
            .update(supportTickets)
            .set({
                status: status as TicketStatus,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(supportTickets.id, ticketId),
                    eq(supportTickets.workspaceId, workspaceId),
                ),
            )
            .returning();

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        return res.json({ ticket });
    } catch (error) {
        console.error("Update ticket status error:", error);
        return res.status(500).json({ message: "Failed to update ticket" });
    }
}