"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { chatWithBot } from "../../lib/api";
import type { ChatMessage } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { EmptyState } from "../ui/EmptyState";
import { StatRow } from "../ui/StatCard";
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  ChevronRight,
  RotateCcw,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  X,
  ArrowLeft,
} from "lucide-react";

interface LocalSession {
  id: string;
  title: string;
  messageCount: number;
  startedAt: Date;
  messages: ChatMessage[];
  conversationId?: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export function ConversationsHistoryView() {
  const { getToken } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Local session list (stored in sessionStorage so it survives nav)
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  // Live chat state (for starting new session from this view)
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("converso_sessions");
      if (raw) setSessions(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist sessions to sessionStorage
  function persistSessions(updated: LocalSession[]) {
    setSessions(updated);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("converso_sessions", JSON.stringify(updated));
      } catch {
        /* ignore quota error */
      }
    }
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, sending]);

  function createNewSession(): string {
    const id = `session-${Date.now()}`;
    const newSession: LocalSession = {
      id,
      title: "New conversation",
      messageCount: 0,
      startedAt: new Date(),
      messages: [],
    };
    persistSessions([newSession, ...sessions]);
    setActiveSessionId(id);
    setExpandedSources({});
    setChatError(null);
    return id;
  }

  async function handleSend() {
    const question = input.trim();
    if (!question || !currentWorkspace || sending) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    setInput("");
    setChatError(null);

    const userMsg: ChatMessage = { role: "user", content: question };

    // Optimistically add user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              title: s.messages.length === 0 ? question.slice(0, 60) : s.title,
              messages: [...s.messages, userMsg],
              messageCount: s.messageCount + 1,
            }
          : s,
      ),
    );

    setSending(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const currentSession = sessions.find((s) => s.id === sessionId);

      const res = await chatWithBot(
        token,
        currentWorkspace.id,
        question,
        currentSession?.conversationId,
      );

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.answer || res.message || "No answer generated.",
        sources: res.sources,
        handoff: res.handoff,
        ticket: res.ticket,
      };

      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                conversationId: res.conversationId || s.conversationId,
                messages: [...s.messages, assistantMsg],
                messageCount: s.messageCount + 1,
              }
            : s,
        );
        // Persist after update
        if (typeof window !== "undefined") {
          try { sessionStorage.setItem("converso_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
        }
        return updated;
      });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to send");
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

  function deleteSession(id: string) {
    persistSessions(sessions.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  }

  function toggleSources(idx: number) {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const statItems = [
    {
      label: "Sessions This Visit",
      value: sessions.length,
      caption: "Stored in browser session",
    },
    {
      label: "Total Messages",
      value: sessions.reduce((n, s) => n + s.messageCount, 0),
      caption: "Across all sessions",
    },
    {
      label: "Active Session",
      value: activeSession ? "OPEN" : "NONE",
      caption: activeSession ? activeSession.title.slice(0, 30) : "Click a session or start one",
    },
    {
      label: "Workspace",
      value: currentWorkspace ? "LINKED" : "NONE",
      caption: currentWorkspace?.name || "Select a workspace",
    },
  ];

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="Conversations"
        title="No Workspace Selected"
        description="Select or create a workspace to start browsing conversation sessions."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        section="Conversation Browser"
        title="Sessions & History"
        description="Browse and replay chat sessions started in this browser. Each session links to your AI chatbot's conversation thread."
        actions={
          <button
            type="button"
            onClick={createNewSession}
            className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] btn-primary transition-colors rounded-[1px] inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            New Session
          </button>
        }
      />

      <StatRow stats={statItems} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* â”€â”€ Session list â”€â”€ */}
        <div className={`${activeSession ? "lg:col-span-4" : "lg:col-span-4"} space-y-1`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)]">
              Sessions ({sessions.length})
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-left">
              <Sparkles className="w-4 h-4 text-[var(--fg-muted)] mb-2" />
              <p className="text-xs font-medium text-[var(--fg)] mb-1">No sessions yet</p>
              <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                Click &ldquo;New Session&rdquo; or start chatting in the input below to create your first conversation.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setExpandedSources({});
                      setChatError(null);
                    }}
                    className={`group relative p-4 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-[var(--bg-subtle)]"
                        : "hover:bg-[var(--hover)]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E30613]" />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${isActive ? "text-[var(--fg)]" : "text-[var(--fg)]"}`}>
                          {session.title || "Untitled session"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[var(--fg-muted)] font-mono">
                            {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[#E5E5E5]">Â·</span>
                          <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(new Date(session.startedAt))}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--fg-muted)] hover:text-[#E30613] transition-all rounded-[1px]"
                        aria-label="Delete session"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* â”€â”€ Chat panel â”€â”€ */}
        <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--border)] flex flex-col" style={{ height: "580px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2">
              {activeSession && (
                <button
                  type="button"
                  onClick={() => setActiveSessionId(null)}
                  className="md:hidden p-1 text-[var(--fg-muted)] hover:text-[var(--fg)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)]">
                {activeSession ? activeSession.title.slice(0, 50) : "No session selected"}
              </p>
            </div>
            {activeSession && (
              <div className="flex items-center gap-2">
                {activeSession.conversationId && (
                  <span className="text-[10px] font-mono text-[var(--fg-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-[1px] hidden sm:block">
                    {activeSession.conversationId.slice(0, 12)}...
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === activeSession.id
                          ? { ...s, messages: [], messageCount: 0, conversationId: undefined }
                          : s,
                      ),
                    );
                    setExpandedSources({});
                  }}
                  className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] border border-transparent hover:border-[var(--border)] rounded-[1px] transition-colors"
                  title="Clear messages"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {!activeSession ? (
              <div className="h-full flex flex-col items-start justify-center max-w-md">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1">
                  No session open
                </p>
                <h3 className="text-sm font-semibold text-[var(--fg)] mb-2">
                  Select a session or start a new one
                </h3>
                <p className="text-xs text-[var(--fg-muted)] mb-5 leading-relaxed">
                  Conversations are saved locally in your browser session. Start typing below to create a new session instantly.
                </p>
                <button
                  type="button"
                  onClick={createNewSession}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-[0.05em] btn-primary rounded-[1px] inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Start new session
                </button>
              </div>
            ) : activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-start justify-center max-w-md">
                <Bot className="w-5 h-5 text-[var(--fg-muted)] mb-3" />
                <p className="text-xs font-semibold text-[var(--fg)] mb-1">Session ready</p>
                <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                  Ask a question about your knowledge base to begin. The AI will retrieve relevant document chunks and formulate an answer.
                </p>
              </div>
            ) : (
              activeSession.messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isExpanded = Boolean(expandedSources[idx]);
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wider mb-1">
                      {isUser ? "You" : "Converso AI"}
                    </span>
                    <div
                      className={`max-w-[85%] p-3.5 text-xs leading-relaxed border rounded-[1px] ${
                        isUser
                          ? "bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--fg)] font-mono"
                          : "bg-[var(--surface)] border-[var(--border)] text-[var(--fg)]"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.handoff && (
                        <div className="mt-3 pt-3 border-t border-[#E30613]/30 flex items-center gap-2 text-[11px] text-[#E30613] font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Human handoff ticket created</span>
                          {msg.ticket && (
                            <span className="ml-auto font-mono text-[10px] bg-[#E30613]/10 px-1.5 py-0.5 rounded-[1px]">
                              {msg.ticket.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-1.5 max-w-[85%] w-full">
                        <button
                          type="button"
                          onClick={() => toggleSources(idx)}
                          className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-[#E30613]" />
                          <span>{msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""} cited</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-1.5 border border-[var(--border)] bg-[var(--bg-subtle)] divide-y divide-[var(--border)] text-[11px]">
                            {msg.sources.map((src, si) => (
                              <div key={si} className="p-3 space-y-1">
                                <div className="flex items-center justify-between text-[var(--fg)] font-medium">
                                  <span className="truncate">[{si + 1}] {src.filename}</span>
                                  <span className="font-mono text-[10px] text-[#16A34A] tabular-nums shrink-0 ml-2">
                                    {(src.similarity * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <p className="text-[var(--fg-muted)] font-mono whitespace-pre-wrap line-clamp-3 bg-[var(--surface)] p-2 border border-[var(--border)]">
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

            {sending && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase mb-1">Converso AI</span>
                <div className="p-3 bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--fg-muted)] font-mono rounded-[1px] inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E30613] rounded-full animate-ping" />
                  Thinking...
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-3 border border-[#E30613]/30 bg-[#E30613]/5 text-xs text-[#E30613] font-medium rounded-[1px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {chatError}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-4 border-t border-[var(--border)] shrink-0 bg-[var(--surface)]">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder={
                  activeSession
                    ? "Continue this conversation... (Enter to send)"
                    : "Start typing to create a new session... (Enter to send)"
                }
                className="flex-1 p-2.5 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px] resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.05em] btn-primary transition-colors rounded-[1px] disabled:opacity-40 inline-flex items-center gap-1.5 shrink-0 h-11"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[var(--fg-muted)] font-mono mt-1.5">
              Workspace: {currentWorkspace.name} Â· RAG: Groq + Jina
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



