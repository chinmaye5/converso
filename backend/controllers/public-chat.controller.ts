import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import {
  chatbots,
  conversations,
  messages,
  supportTickets,
} from "../db/schema";
import { runChat } from "../ai/chat.graph";
import { customerRequestsHuman } from "../ai/handoff.utils";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function publicChat(req: Request, res: Response) {
  try {
    // 1. Validate the public chatbot ID from URL param.
    const chatbotId = getParam(req.params.chatbotId);

    if (!chatbotId) {
      return res.status(400).json({ message: "Chatbot ID is required" });
    }

    const {
      question,
      conversationId: requestedConversationId,
      sessionId: suppliedSessionId,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "A question is required" });
    }

    if (
      requestedConversationId !== undefined &&
      (typeof requestedConversationId !== "string" ||
        !requestedConversationId.trim())
    ) {
      return res.status(400).json({ message: "Invalid conversationId" });
    }

    const cleanQuestion = question.trim();

    // 2. Identify the active chatbot and verify it exists and is active.
    const [chatbot] = await db
      .select()
      .from(chatbots)
      .where(eq(chatbots.id, chatbotId))
      .limit(1);

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    if (!chatbot.isActive) {
      return res.status(400).json({ message: "Chatbot is currently inactive" });
    }

    // Create a new anonymous session on the first request.
    const sessionId = suppliedSessionId || randomUUID();

    // Accept only UUID-shaped session IDs.
    if (
      typeof sessionId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionId,
      )
    ) {
      return res.status(400).json({
        message: "Invalid session ID.",
      });
    }

    const publicUserId = `public:${chatbot.id}:${sessionId}`;

    // 3. Save or reload the anonymous conversation.
    let activeConversationId: string;

    if (requestedConversationId) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, requestedConversationId),
            eq(conversations.workspaceId, chatbot.workspaceId),
            eq(conversations.userId, publicUserId),
          ),
        )
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      activeConversationId = conversation.id;
    } else {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          workspaceId: chatbot.workspaceId,
          userId: publicUserId,
          title: cleanQuestion.slice(0, 200),
        })
        .returning({ id: conversations.id });

      if (!newConversation) {
        return res
          .status(500)
          .json({ message: "Could not create conversation" });
      }

      activeConversationId = newConversation.id;
    }

    // 4. Detect whether the visitor wants a human agent.
    if (customerRequestsHuman(cleanQuestion)) {
      // First request: ask the frontend to show the contact form.
      if (!customerName && !customerEmail && !customerPhone) {
        return res.json({
          sessionId,
          conversationId: activeConversationId,
          handoff: true,
          requiresContactDetails: true,
          message:
            "Would you like our support team to contact you? Please share your details.",
        });
      }

      // Name and email are required; phone is optional.
      if (
        typeof customerName !== "string" ||
        !customerName.trim() ||
        typeof customerEmail !== "string" ||
        !customerEmail.trim()
      ) {
        return res.status(400).json({
          sessionId,
          handoff: true,
          requiresContactDetails: true,
          message: "Please provide your name and email address.",
        });
      }

      // Basic email format validation.
      const email = customerEmail.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          sessionId,
          handoff: true,
          requiresContactDetails: true,
          message: "Please provide a valid email address.",
        });
      }

      // Save the customer's request.
      await db.insert(messages).values({
        conversationId: activeConversationId,
        role: "user",
        content: cleanQuestion,
      });

      // Create the human-support ticket with contact details.
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          workspaceId: chatbot.workspaceId,
          conversationId: activeConversationId,
          createdBy: publicUserId,
          subject: "Customer requested human support",
          description: cleanQuestion,
          customerName: customerName.trim(),
          customerEmail: email,
          customerPhone: customerPhone?.trim() || null,
        })
        .returning();

      if (!ticket) {
        return res.status(500).json({
          message: "Could not create support ticket",
        });
      }

      return res.json({
        sessionId,
        conversationId: activeConversationId,
        handoff: true,
        requiresContactDetails: false,
        message: "I've created a support ticket for human assistance.",
        ticket: {
          id: ticket.id,
          status: ticket.status,
          customerName: ticket.customerName,
          customerEmail: ticket.customerEmail,
          customerPhone: ticket.customerPhone,
        },
      });
    }

    // 5. Answer normal questions using existing RAG pipeline.
    const previousMessages = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, activeConversationId))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    const history = previousMessages.reverse();

    const result = await runChat(cleanQuestion, chatbot.workspaceId, history);

    // Save the customer's question.
    await db.insert(messages).values({
      conversationId: activeConversationId,
      role: "user",
      content: cleanQuestion,
    });

    // Save the AI answer and its sources.
    await db.insert(messages).values({
      conversationId: activeConversationId,
      role: "assistant",
      content: result.answer,
      sources: result.sources,
    });

    // Update the conversation's timestamp.
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, activeConversationId));

    return res.json({
      sessionId,
      conversationId: activeConversationId,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Public chat error:", error);
    return res.status(500).json({
      message: "Failed to generate a response",
    });
  }
}
