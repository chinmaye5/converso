"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const FONT_STACK =
  '"Helvetica Neue", Helvetica, "Nimbus Sans", Arial, system-ui, sans-serif';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Source = { filename: string; content: string; similarity: number };

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; sources?: Source[] }
  | { role: "system"; content: string; isHandoff?: boolean };

type ChatbotMeta = {
  id: string;
  name: string;
  primaryColor: string;
  isActive: boolean;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Picks black or white text so it stays readable on the chatbot's color. */
function readableOn(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "#ffffff";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

/* ------------------------------------------------------------------ */
/* Markdown renderer                                                    */
/* ------------------------------------------------------------------ */

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-black">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="my-2 ml-4 list-disc space-y-1 text-sm">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2 ml-4 list-decimal space-y-1 text-sm">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        hr: () => (
          <hr className="my-3 border-t border-neutral-300" />
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className="block my-2 p-3 bg-neutral-100 border border-neutral-200 text-xs font-mono rounded-none overflow-x-auto whitespace-pre">
              {children}
            </code>
          ) : (
            <code className="px-1 py-0.5 bg-neutral-100 border border-neutral-200 text-xs font-mono rounded-none">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-neutral-300">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-neutral-100">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-neutral-200 even:bg-neutral-50">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold border-r last:border-r-0 border-neutral-300 text-neutral-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-r last:border-r-0 border-neutral-200">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 pl-3 border-l-4 border-[color:var(--accent)] text-neutral-600 italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

function ChatFallback() {
  return (
    <div
      className="flex h-dvh flex-col bg-white text-black antialiased"
      style={{ fontFamily: FONT_STACK }}
    >
      <div className="border-b-2 border-black">
        <div className="mx-auto w-full max-w-3xl px-6 pb-4 pt-6">
          <div className="h-8 w-48 bg-neutral-200" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-6 py-5 text-neutral-600">
        <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
        <span role="status">Loading chat</span>
      </div>
    </div>
  );
}

/** One message row: a narrow label column and a readable text column. */
function Row({
  label,
  marker,
  children,
}: {
  label: string;
  marker: "user" | "assistant" | "none";
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-x-4 border-b border-neutral-300 py-5 sm:grid-cols-[8rem_1fr]">
      <div className="flex h-[26px] items-center gap-2 text-sm font-medium">
        {marker !== "none" && (
          <span
            aria-hidden
            className={`block h-2 w-2 shrink-0 ${marker === "user" ? "bg-black" : "bg-[color:var(--accent)]"
              }`}
          />
        )}
        {label}
      </div>
      <div className="min-w-0 max-w-[65ch] text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact form shown after "I need a human" trigger                   */
/* ------------------------------------------------------------------ */

function Field({
  label,
  optional,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-sm font-medium">
        <span>{label}</span>
        {optional && (
          <span className="font-normal text-neutral-500">Optional</span>
        )}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-none border border-black bg-white px-3 py-2 text-base placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
      />
    </div>
  );
}

function ContactForm({
  onSubmit,
  loading,
}: {
  onSubmit: (name: string, email: string, phone: string) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(name, email, phone);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 border border-black bg-white p-5"
    >
      <div>
        <p className="text-base font-bold">Your contact details</p>
        <p className="text-sm text-neutral-600">
          A support agent will use these to follow up on your ticket.
        </p>
      </div>

      <Field
        label="Full name"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Field
        label="Email address"
        required
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label="Phone number"
        optional
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] disabled:opacity-50"
      >
        {loading && (
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
        )}
        Raise ticket
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Chat (reads route params, so it must sit inside <Suspense>)         */
/* ------------------------------------------------------------------ */

function ChatClient() {
  const params = useParams();
  const chatbotId = typeof params.chatbotId === "string" ? params.chatbotId : "";

  const [meta, setMeta] = useState<ChatbotMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  /* Handoff state */
  const [awaitingContact, setAwaitingContact] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [ticketCreated, setTicketCreated] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* Fetch real chatbot metadata from the backend. */
  useEffect(() => {
    if (!chatbotId) return;

    fetch(`${API_BASE}/api/public/chatbots/${chatbotId}/info`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.chatbot) {
          setMeta({
            id: data.chatbot.id,
            name: data.chatbot.name,
            primaryColor: data.chatbot.primaryColor,
            isActive: data.chatbot.isActive,
          });
        } else {
          setMetaError("Could not load chatbot. Please check the link.");
        }
      })
      .catch(() => {
        setMetaError("Could not load chatbot. Please check the link.");
      });
  }, [chatbotId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingContact, loading, ticketCreated]);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  async function sendMessage(
    question: string,
    contactInfo?: { customerName: string; customerEmail: string; customerPhone?: string }
  ) {
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        question,
        ...(sessionId && { sessionId }),
        ...(conversationId && { conversationId }),
        ...(contactInfo && {
          customerName: contactInfo.customerName,
          customerEmail: contactInfo.customerEmail,
          customerPhone: contactInfo.customerPhone || undefined,
        }),
      };

      const res = await fetch(
        `${API_BASE}/api/public/chatbots/${chatbotId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        addMessage({
          role: "system",
          content: data.message || "Something went wrong. Please try again.",
        });
        return;
      }

      /* Persist session/conversation for subsequent messages */
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.conversationId) setConversationId(data.conversationId);

      if (data.handoff) {
        if (data.requiresContactDetails) {
          /* Backend wants contact info — show form */
          addMessage({
            role: "system",
            content: data.message,
            isHandoff: true,
          });
          setPendingQuestion(question);
          setAwaitingContact(true);
        } else {
          /* Ticket created successfully */
          addMessage({
            role: "assistant",
            content: data.message,
          });
          if (data.ticket) {
            setTicketCreated(true);
          }
          setAwaitingContact(false);
          setPendingQuestion(null);
        }
      } else {
        /* Normal AI answer */
        addMessage({
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        });
      }
    } catch {
      addMessage({
        role: "system",
        content: "Network error. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    addMessage({ role: "user", content: q });
    await sendMessage(q);
  }

  async function handleContactSubmit(name: string, email: string, phone: string) {
    if (!pendingQuestion) return;
    setAwaitingContact(false);
    await sendMessage(pendingQuestion, {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
    });
  }

  if (metaError) {
    return (
      <div
        className="flex h-dvh flex-col bg-white text-black antialiased"
        style={{ fontFamily: FONT_STACK }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-start gap-3 px-6 pt-10">
          <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-2xl font-bold tracking-tight">Chat unavailable</p>
            <p className="mt-1 text-neutral-600">{metaError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!meta) return <ChatFallback />;

  const primary = meta.primaryColor;
  const onPrimary = readableOn(primary);
  const inputDisabled = loading || awaitingContact || !meta.isActive;

  return (
    <div
      className="flex h-dvh flex-col bg-white text-black antialiased"
      style={{ fontFamily: FONT_STACK, "--accent": primary } as React.CSSProperties}
    >
      {/* Header */}
      <header className="shrink-0 border-b-2 border-black">
        <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-6 px-6 pb-4 pt-6">
          <h1 className="text-2xl font-bold leading-none tracking-tight sm:text-3xl">
            {meta.name}
          </h1>
          <p className="flex items-center gap-2 pb-0.5 text-sm text-neutral-600">
            <span
              aria-hidden
              className={`block h-2 w-2 ${meta.isActive
                  ? "bg-[color:var(--accent)]"
                  : "border border-neutral-500"
                }`}
            />
            {meta.isActive ? "Online" : "Offline"}
          </p>
        </div>
      </header>

      {/* Messages */}
      <main
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-6">
          {messages.length === 0 && (
            <Row label={meta.name} marker="assistant">
              <p>
                Ask a question about this business. To reach a person, type
                &ldquo;I need a human&rdquo; and we&apos;ll raise a support ticket.
              </p>
            </Row>
          )}

          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <Row key={i} label="You" marker="user">
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </Row>
              );
            }

            if (msg.role === "system") {
              return (
                <Row
                  key={i}
                  label={msg.isHandoff ? meta.name : "Notice"}
                  marker={msg.isHandoff ? "assistant" : "none"}
                >
                  {msg.isHandoff ? (
                    <>
                      <MarkdownContent content={msg.content} />
                      {awaitingContact && (
                        <ContactForm
                          onSubmit={handleContactSubmit}
                          loading={loading}
                        />
                      )}
                    </>
                  ) : (
                    <p className="flex items-start gap-2 font-medium">
                      <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                      <span>{msg.content}</span>
                    </p>
                  )}
                </Row>
              );
            }

            /* assistant message */
            return (
              <Row key={i} label={meta.name} marker="assistant">
                <MarkdownContent content={msg.content} />
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                    <span>Sources</span>
                    {msg.sources.slice(0, 3).map((s, si) => (
                      <span
                        key={si}
                        title={s.content}
                        className="inline-flex items-center gap-1 border border-neutral-400 px-2 py-0.5 text-xs text-black"
                      >
                        <FileText className="h-3 w-3" aria-hidden />
                        {s.filename}
                      </span>
                    ))}
                  </div>
                )}
              </Row>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <Row label={meta.name} marker="assistant">
              <span
                role="status"
                aria-label="Assistant is typing"
                className="flex h-[26px] items-center gap-1.5"
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="block h-2 w-2 bg-black motion-safe:animate-pulse"
                    style={{ animationDelay: `${d * 0.2}s` }}
                  />
                ))}
              </span>
            </Row>
          )}

          {/* Ticket success */}
          {ticketCreated && (
            <div
              role="status"
              className="my-5 flex items-start gap-3 border border-black border-l-[6px] border-l-[color:var(--accent)] p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">Ticket raised</p>
                <p className="text-neutral-700">
                  A support agent will reach out to you shortly.
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <div className="shrink-0 border-t-2 border-black focus-within:border-[color:var(--accent)]">
        <form
          onSubmit={handleSend}
          className="mx-auto flex w-full max-w-3xl items-center gap-4 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Your message"
            placeholder={
              awaitingContact
                ? "Complete the form above to continue"
                : "Type your message"
            }
            disabled={inputDisabled}
            className="min-w-0 flex-1 bg-transparent py-3 text-base placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || inputDisabled}
            className="flex h-12 shrink-0 items-center gap-2 px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-40"
            style={{ backgroundColor: primary, color: onPrimary }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Send
          </button>
        </form>

        {!meta.isActive && (
          <p className="mx-auto w-full max-w-3xl px-6 pb-3 text-sm text-neutral-600">
            This chatbot is offline. Check back later.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PublicChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatClient />
    </Suspense>
  );
}