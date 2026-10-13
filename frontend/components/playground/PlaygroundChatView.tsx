"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { chatWithBot } from "../../lib/api";
import type { ChatMessage, ChatSource } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import {
  Send,
  RotateCcw,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
  Bot,
} from "lucide-react";

export function PlaygroundChatView() {
  const { getToken } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded sources state for each message index
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function handleReset() {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.focus();
  }

  async function handleSend(questionText?: string) {
    const question = (questionText || input).trim();
    if (!question || !currentWorkspace || sending) return;

    setInput("");
    setError(null);

    // Optimistically append user message
    const userMsg: ChatMessage = {
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await chatWithBot(
        token,
        currentWorkspace.id,
        question,
        conversationId || undefined,
      );

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.answer || response.message || "No answer generated.",
        sources: response.sources,
        handoff: response.handoff,
        ticket: response.ticket,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleSources(idx: number) {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="AI Playground"
        title="No Workspace Selected"
        description="Select or create a workspace before testing the AI chatbot."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        section="Assistant Testing"
        title="AI Playground"
        description={`Interactive test console for ${currentWorkspace.name}. Test document grounding, prompt instructions, and human escalation.`}
        actions={
          <button
            type="button"
            onClick={handleReset}
            disabled={messages.length === 0 && !conversationId}
            className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] bg-white border border-[#E5E5E5] text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors rounded-[1px] inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        }
      />

      {error && (
        <ErrorState
          title="Playground Error"
          message={error}
          onRetry={() => handleSend(messages[messages.length - 1]?.content)}
        />
      )}

      {/* Main Chat Frame */}
      <div className="bg-white border border-[#E5E5E5] flex flex-col h-[650px] rounded-[1px]">
        {/* Chat Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 divide-y divide-[#E5E5E5]/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-start max-w-lg">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373] mb-1">
                Assistant Ready
              </p>
              <h3 className="text-base font-semibold text-[#0A0A0A] mb-2">
                Begin testing your chatbot
              </h3>
              <p className="text-xs text-[#737373] mb-6 leading-relaxed">
                Queries will retrieve relevant chunks from your uploaded PDF
                knowledge base and formulate answers using Groq LLM.
              </p>

              <div className="space-y-2 w-full">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#737373]">
                  Quick Test Prompts
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What is your return policy and processing timeline?",
                    "How can I contact technical support?",
                    "I want to speak to a human agent",
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => handleSend(promptText)}
                      className="text-left text-xs px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] rounded-[1px] transition-colors"
                    >
                      &quot;{promptText}&quot;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isExpanded = Boolean(expandedSources[idx]);

              return (
                <div
                  key={idx}
                  className={`pt-5 first:pt-0 flex flex-col ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  {/* Role Header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                      {isUser ? "User / Customer" : "Assistant (Converso)"}
                    </span>
                  </div>

                  {/* Message Container per Swiss spec: hairline border, distinct alignment, no gradient bubbles */}
                  <div
                    className={`max-w-[85%] p-4 text-xs rounded-[1px] leading-relaxed border ${
                      isUser
                        ? "bg-[#FAFAFA] border-[#E5E5E5] text-[#0A0A0A] font-mono"
                        : "bg-white border-[#E5E5E5] text-[#0A0A0A]"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Human Handoff Notification if triggered */}
                    {msg.handoff && (
                      <div className="mt-3 pt-3 border-t border-[#E30613]/30 flex items-center justify-between text-[11px] text-[#E30613] font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Human Handoff Ticket Created
                        </span>
                        {msg.ticket && (
                          <span className="font-mono text-[10px] bg-[#E30613]/10 px-1.5 py-0.5 rounded-[1px]">
                            Status: {msg.ticket.status}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cited Document Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 max-w-[85%] w-full">
                      <button
                        type="button"
                        onClick={() => toggleSources(idx)}
                        className="text-[11px] text-[#737373] hover:text-[#0A0A0A] inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-[#E30613]" />
                        <span>
                          {msg.sources.length} Cited Source
                          {msg.sources.length === 1 ? "" : "s"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 border border-[#E5E5E5] bg-[#FAFAFA] divide-y divide-[#E5E5E5] text-[11px]">
                          {msg.sources.map((src, sIdx) => (
                            <div key={sIdx} className="p-3 space-y-1">
                              <div className="flex items-center justify-between text-[#0A0A0A] font-medium">
                                <span className="truncate">
                                  [{sIdx + 1}] {src.filename}
                                </span>
                                <span className="font-mono text-[10px] text-[#16A34A] tabular-nums">
                                  {(src.similarity * 100).toFixed(1)}% match
                                </span>
                              </div>
                              <p className="text-[#737373] font-mono whitespace-pre-wrap line-clamp-3 bg-white p-2 border border-[#E5E5E5]">
                                {src.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {sending && (
            <div className="pt-4 flex flex-col items-start">
              <span className="text-[10px] font-mono text-[#737373] uppercase mb-1">
                Assistant (Converso)
              </span>
              <div className="p-3 bg-white border border-[#E5E5E5] text-xs text-[#737373] font-mono rounded-[1px] inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E30613] rounded-full animate-ping" />
                <span>Searching knowledge chunks & formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E5E5E5]">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask a question about your business knowledge... (Enter to send, Shift+Enter for newline)"
              className="flex-1 p-2.5 text-xs bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#A3A3A3] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px] resize-none leading-relaxed"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.05em] bg-[#0A0A0A] hover:bg-[#262626] text-white transition-colors rounded-[1px] disabled:opacity-40 inline-flex items-center gap-2 shrink-0 h-11"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#737373] font-mono mt-2">
            <span>
              Session: {conversationId ? `${conversationId.slice(0, 16)}...` : "New session"}
            </span>
            <span>RAG Model: Groq + Jina Embeddings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
