// src/controllers/chat.controller.ts
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import {
  workspaces,
  conversations,
  messages,
  supportTickets,
} from "../db/schema";
import { runChat } from "../ai/chat.graph";
import { customerRequestsHuman } from "../ai/handoff.utils";

export async function chatWithBot(req: Request, res: Response) {
  try {
    // 1. Check the logged-in user.
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Please log in first" });
    }

    // 2. Workspace ID from URL (may be string or array)
    const workspaceIdParam = req.params.workspaceId;
    const workspaceId = Array.isArray(workspaceIdParam)
      ? workspaceIdParam[0]
      : workspaceIdParam;

    // After this check, TypeScript knows workspaceId is a plain string.
    if (!workspaceId) {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    const question = req.body.question;
    const requestedConversationId = req.body.conversationId;

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        message: "A question is required",
      });
    }

    if (
      requestedConversationId !== undefined &&
      (typeof requestedConversationId !== "string" ||
        !requestedConversationId.trim())
    ) {
      return res.status(400).json({
        message: "Invalid conversationId",
      });
    }

    const cleanQuestion = question.trim();

    // 3. Verify that the user owns the workspace.
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace || workspace.ownerId !== userId) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    // 4. Load an existing conversation or create a new one.
    let conversationId: string;

    if (requestedConversationId) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, requestedConversationId),
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

      conversationId = conversation.id;
    } else {
      const [conversation] = await db
        .insert(conversations)
        .values({
          workspaceId,
          userId,
          title: cleanQuestion.slice(0, 200),
        })
        .returning({ id: conversations.id });

      if (!conversation) {
        return res.status(500).json({
          message: "Could not create conversation",
        });
      }

      conversationId = conversation.id;
    }

    // Check if the customer is requesting human support.
    if (customerRequestsHuman(cleanQuestion)) {
      // Reuse the existing conversation, or create one if necessary.
      let handoffConversationId = conversationId;

      if (!handoffConversationId) {
        const [newConversation] = await db
          .insert(conversations)
          .values({
            workspaceId,
            userId,
            title: cleanQuestion.slice(0, 200),
          })
          .returning({ id: conversations.id });

        if (!newConversation) {
          return res.status(500).json({
            message: "Could not create conversation",
          });
        }

        handoffConversationId = newConversation.id;
      }

      // Save the customer's request.
      await db.insert(messages).values({
        conversationId: handoffConversationId,
        role: "user",
        content: cleanQuestion,
      });

      // Create the human-support ticket.
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          workspaceId,
          conversationId: handoffConversationId,
          createdBy: userId,
          subject: "Customer requested human support",
          description: cleanQuestion,
        })
        .returning();

      if (!ticket) {
        return res.status(500).json({
          message: "Could not create support ticket",
        });
      }

      return res.json({
        conversationId: handoffConversationId,
        handoff: true,
        message: "I've created a support ticket for human assistance.",
        ticket: {
          id: ticket.id,
          status: ticket.status,
        },
      });
    }

    // 5. Load the latest 10 previous messages.
    const previousMessages = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    // The database returns newest first; the model needs oldest first.
    const history = previousMessages.reverse();

    // 6. Generate the answer using LangGraph.
    const result = await runChat(cleanQuestion, workspaceId, history);

    // 7. Save the customer's question.
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: cleanQuestion,
    });

    // 8. Save the AI answer and its document sources.
    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: result.answer,
      sources: result.sources,
    });

    // 9. Update the conversation's last-updated time.
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return res.json({
      conversationId,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      message: "Failed to generate a response",
    });
  }
}