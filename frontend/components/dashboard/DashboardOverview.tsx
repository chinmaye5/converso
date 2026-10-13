"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { getChatbot, getTickets } from "../../lib/api";
import type { Chatbot, SupportTicket } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { StatRow } from "../ui/StatCard";
import { StatusBadge } from "../ui/StatusBadge";
import { PageLoadingSkeleton } from "../ui/LoadingState";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import {
  Bot,
  FileText,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  MessageSquare,
} from "lucide-react";


export function DashboardOverview() {
  const { getToken } = useAuth();
  const { currentWorkspace, loading: wsLoading, error: wsError } = useWorkspace();

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;

      const [botData, ticketsData] = await Promise.all([
        getChatbot(token, currentWorkspace.id),
        getTickets(token, currentWorkspace.id),
      ]);

      setChatbot(botData);
      setTickets(ticketsData);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (wsLoading || (loading && !chatbot && tickets.length === 0 && !error)) {
    return <PageLoadingSkeleton />;
  }

  if (wsError || error) {
    return (
      <div>
        <PageHeader
          section="Overview"
          title="Dashboard"
          description="Operational metrics and activity for your customer support assistant."
        />
        <ErrorState
          title="Data Loading Error"
          message={wsError || error || "Failed to load data"}
          onRetry={loadData}
        />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="Workspace Required"
        title="No Workspace Selected"
        description="Please create or select a workspace to view your assistant dashboard."
      />
    );
  }

  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;

  const statItems = [
    {
      label: "Chatbot Status",
      value: chatbot ? (chatbot.isActive ? "ACTIVE" : "INACTIVE") : "NOT SET",
      caption: chatbot ? chatbot.name : "Setup required in Chatbot page",
    },
    {
      label: "Open Tickets",
      value: openTickets,
      caption: `${inProgressTickets} currently in progress`,
    },
    {
      label: "Total Tickets",
      value: tickets.length,
      caption: "Escalated from chat & customers",
    },
    {
      label: "Knowledge Scope",
      value: "CONNECTED",
      caption: "Search & embedding vector index online",
    },
  ];

  // Checklist steps
  const hasChatbot = Boolean(chatbot);
  const hasTickets = tickets.length > 0;

  const checklist = [
    {
      title: "Workspace initialised",
      desc: `Active workspace: ${currentWorkspace.name}`,
      done: true,
      href: "/settings",
    },
    {
      title: "Configure AI Chatbot",
      desc: hasChatbot
        ? `Configured as "${chatbot?.name}"`
        : "Set assistant prompt instructions and branding",
      done: hasChatbot,
      href: "/chatbot",
    },
    {
      title: "Upload Knowledge Base PDFs",
      desc: "Provide company policies and FAQ context for accurate RAG answers",
      done: false,
      href: "/knowledge-base",
    },
    {
      title: "Test assistant in AI Playground",
      desc: "Simulate queries and verify source chunk citations",
      done: false,
      href: "/playground",
    },
  ];

  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        section="System Overview"
        title={currentWorkspace.name}
        description="Monitor automated customer support performance, knowledge base, and human escalation tickets."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/conversations"
              className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--hover)] transition-colors rounded-[1px] inline-flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Conversations</span>
            </Link>
            <Link
              href="/playground"
              className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] btn-primary transition-colors rounded-[1px] inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test Chatbot</span>
            </Link>
          </div>
        }
      />

      {/* Ruled Stat Row per Swiss Modernism Spec */}
      <StatRow stats={statItems} />

      {/* Quick Action Matrix */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link
            href="/chatbot"
            className="p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--fg)] transition-colors group flex flex-col justify-between"
          >
            <div>
              <Bot className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[#E30613] transition-colors mb-2.5" />
              <p className="text-xs font-semibold text-[var(--fg)]">
                Configure Chatbot
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Instructions, tone, and brand.
              </p>
            </div>
            <span className="text-[11px] text-[var(--fg)] font-medium mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Edit <ArrowRight className="w-3 h-3 text-[#E30613]" />
            </span>
          </Link>

          <Link
            href="/knowledge-base"
            className="p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--fg)] transition-colors group flex flex-col justify-between"
          >
            <div>
              <FileText className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[#E30613] transition-colors mb-2.5" />
              <p className="text-xs font-semibold text-[var(--fg)]">
                Knowledge Base
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Upload PDFs, test vector search.
              </p>
            </div>
            <span className="text-[11px] text-[var(--fg)] font-medium mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Upload <ArrowRight className="w-3 h-3 text-[#E30613]" />
            </span>
          </Link>

          <Link
            href="/tickets"
            className="p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--fg)] transition-colors group flex flex-col justify-between"
          >
            <div>
              <LifeBuoy className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[#E30613] transition-colors mb-2.5" />
              <p className="text-xs font-semibold text-[var(--fg)]">
                Support Tickets
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Manage human handoff escalations.
              </p>
            </div>
            <span className="text-[11px] text-[var(--fg)] font-medium mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Inbox <ArrowRight className="w-3 h-3 text-[#E30613]" />
            </span>
          </Link>

          <Link
            href="/playground"
            className="p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--fg)] transition-colors group flex flex-col justify-between"
          >
            <div>
              <Sparkles className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[#E30613] transition-colors mb-2.5" />
              <p className="text-xs font-semibold text-[var(--fg)]">
                AI Playground
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Chat and inspect source chunks.
              </p>
            </div>
            <span className="text-[11px] text-[var(--fg)] font-medium mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Launch <ArrowRight className="w-3 h-3 text-[#E30613]" />
            </span>
          </Link>

          <Link
            href="/conversations"
            className="p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--fg)] transition-colors group flex flex-col justify-between"
          >
            <div>
              <MessageSquare className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[#E30613] transition-colors mb-2.5" />
              <p className="text-xs font-semibold text-[var(--fg)]">
                Conversations
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Browse session history &amp; replay chats.
              </p>
            </div>
            <span className="text-[11px] text-[var(--fg)] font-medium mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Browse <ArrowRight className="w-3 h-3 text-[#E30613]" />
            </span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Checklist & Recent Tickets */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Getting Started Checklist */}
        <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1">
            Setup Checklist
          </p>
          <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">
            Deployment Readiness
          </h2>

          <div className="divide-y divide-[var(--border)]">
            {checklist.map((item, idx) => (
              <div key={idx} className="py-3 flex items-start gap-3">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--fg-faint)] shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-medium ${
                        item.done ? "text-[var(--fg)]" : "text-[var(--fg)]"
                      }`}
                    >
                      {item.title}
                    </p>
                    <Link
                      href={item.href}
                      className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] uppercase tracking-wider underline shrink-0"
                    >
                      {item.done ? "Manage" : "Action"}
                    </Link>
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tickets Section */}
        <div className="lg:col-span-7 border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-0.5">
                Activity
              </p>
              <h2 className="text-sm font-semibold text-[var(--fg)]">
                Recent Support Tickets
              </h2>
            </div>
            <Link
              href="/tickets"
              className="text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-1"
            >
              <span>View All ({tickets.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="py-8 text-left border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--fg)]">
                No support tickets yet
              </p>
              <p className="text-xs text-[var(--fg-muted)] mt-1">
                Tickets created by human handoffs will appear here.
              </p>
            </div>
          ) : (
            <div className="border-t border-[var(--border)] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--fg-muted)]">
                    <th className="py-2.5 pr-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                      Subject
                    </th>
                    <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                      Customer
                    </th>
                    <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                      Status
                    </th>
                    <th className="py-2.5 pl-4 font-medium uppercase tracking-[0.06em] text-[10px] text-right">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[var(--hover)] transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-medium text-[var(--fg)] max-w-[200px] truncate">
                        {ticket.subject}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--fg-muted)] max-w-[150px] truncate">
                        {ticket.customerName ||
                          ticket.customerEmail ||
                          ticket.createdBy}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-2.5 pl-4 text-right text-[var(--fg-muted)] font-mono text-[11px] tabular-nums">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



