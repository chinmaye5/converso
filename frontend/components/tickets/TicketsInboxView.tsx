
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { getTickets, updateTicketStatus, getTicketWithConversation } from "../../lib/api";
import type { SupportTicket, TicketStatus, ConversationMessage } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { StatRow } from "../ui/StatCard";
import { StatusBadge } from "../ui/StatusBadge";
import { TableSkeleton } from "../ui/LoadingState";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  User,
  CheckCircle,
  X,
  Bot,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

export function TicketsInboxView() {
  const { getToken } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | TicketStatus>("all");

  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) return;

      const data = await getTickets(token, currentWorkspace.id);
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load support tickets"
      );
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, getToken]);

  const fetchTicketMessages = useCallback(async (ticketId: string) => {
    if (!currentWorkspace) return;

    try {
      setLoadingMessages(true);
      setTicketMessages([]);

      const token = await getToken();
      if (!token) return;

      const data = await getTicketWithConversation(token, currentWorkspace.id, ticketId);
      setTicketMessages(data.messages);
    } catch (err) {
      console.error("Failed to fetch ticket messages:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load conversation messages"
      );
    } finally {
      setLoadingMessages(false);
    }
  }, [currentWorkspace, getToken]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Synchronize the selected ticket with fetched data.
  // This effect does not trigger another fetch.
  useEffect(() => {
    if (!selectedTicket) return;

    const updated = tickets.find(
      (ticket) => ticket.id === selectedTicket.id
    );

    if (
      updated &&
      (updated.status !== selectedTicket.status ||
        updated.subject !== selectedTicket.subject ||
        updated.description !== selectedTicket.description ||
        updated.customerName !== selectedTicket.customerName ||
        updated.customerEmail !== selectedTicket.customerEmail ||
        updated.customerPhone !== selectedTicket.customerPhone)
    ) {
      setSelectedTicket(updated);
    }
  }, [tickets, selectedTicket]);

  async function handleStatusChange(
    ticketId: string,
    newStatus: TicketStatus
  ) {
    if (!currentWorkspace || updatingStatus) return;

    try {
      setUpdatingStatus(true);
      setError(null);
      setActionSuccess(null);

      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      await updateTicketStatus(
        token,
        currentWorkspace.id,
        ticketId,
        newStatus
      );

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: newStatus }
            : ticket
        )
      );

      setSelectedTicket((prev) =>
        prev?.id === ticketId
          ? { ...prev, status: newStatus }
          : prev
      );

      setActionSuccess(
        `Ticket status updated to "${newStatus.replace("_", " ")}".`
      );

      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Status update error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update ticket status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const query = searchQuery.toLowerCase().trim();

      if (!query) return matchesStatus;

      const matchesSearch =
        ticket.subject.toLowerCase().includes(query) ||
        (ticket.description || "").toLowerCase().includes(query) ||
        (ticket.customerName || "").toLowerCase().includes(query) ||
        (ticket.customerEmail || "").toLowerCase().includes(query) ||
        ticket.createdBy.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  const openCount = tickets.filter(
    (ticket) => ticket.status === "open"
  ).length;

  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "in_progress"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "resolved"
  ).length;

  const statItems = [
    {
      label: "Open Tickets",
      value: openCount,
      caption: "Awaiting human agent response",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      caption: "Currently under review",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      caption: "Successfully concluded cases",
    },
    {
      label: "Total Tickets",
      value: tickets.length,
      caption: "All-time workspace escalations",
    },
  ];

  if (wsLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="Support Tickets"
        title="No Workspace Selected"
        description="Select or create a workspace to inspect customer support tickets."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        section="Support Operations"
        title="Tickets Inbox"
        description="Triage and resolve customer support escalations generated by automated chatbot handoffs."
        actions={
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.05em] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--hover)] transition-colors rounded-[1px] inline-flex items-center gap-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""
                }`}
            />
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <ErrorState
          title="Ticket Operation Error"
          message={error}
          onRetry={fetchTickets}
        />
      )}

      {actionSuccess && (
        <div className="p-3.5 border border-[#16A34A]/40 bg-[#16A34A]/5 rounded-[1px] flex items-center gap-2.5 text-xs text-[#16A34A] font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <StatRow stats={statItems} />

      {/* Search and status filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-1 text-xs overflow-x-auto">
          {(
            [
              { id: "all", label: "All", count: tickets.length },
              { id: "open", label: "Open", count: openCount },
              {
                id: "in_progress",
                label: "In Progress",
                count: inProgressCount,
              },
              { id: "resolved", label: "Resolved", count: resolvedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 font-medium transition-colors rounded-[1px] text-xs uppercase tracking-[0.04em] ${statusFilter === tab.id
                  ? "bg-[var(--fg)] text-[var(--btn-text)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--hover)]"
                }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 font-mono text-[10px] tabular-nums opacity-80">
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search email, name, subject..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px]"
          />
        </div>
      </div>

      {/* Ticket table and details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div
          className={`${selectedTicket ? "lg:col-span-7" : "lg:col-span-12"
            } transition-all`}
        >
          {loading && tickets.length === 0 ? (
            <TableSkeleton rows={5} />
          ) : filteredTickets.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] p-8 text-left">
              <p className="text-xs font-semibold text-[var(--fg)]">
                No matching support tickets
              </p>
              <p className="text-xs text-[var(--fg-muted)] mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Adjust search keywords or status filter to see other tickets."
                  : "When customers request human agents in chat, tickets appear here."}
              </p>
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
                    <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                      Subject
                    </th>
                    <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                      Customer
                    </th>
                    <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px]">
                      Status
                    </th>
                    <th className="py-2.5 px-4 font-medium uppercase tracking-[0.06em] text-[10px] text-right">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        if (ticket.conversationId) {
                          fetchTicketMessages(ticket.id);
                        } else {
                          setTicketMessages([]);
                        }
                      }}
                      className={`cursor-pointer transition-colors ${selectedTicket?.id === ticket.id
                          ? "bg-[var(--bg-subtle)] font-medium"
                          : "hover:bg-[var(--hover)]"
                        }`}
                    >
                      <td className="py-3 px-4 text-[var(--fg)]">
                        <p className="font-semibold text-xs truncate max-w-[220px]">
                          {ticket.subject}
                        </p>
                        <p className="text-[11px] text-[var(--fg-muted)] truncate max-w-[220px] font-normal">
                          {ticket.description}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[var(--fg-muted)]">
                        <p className="text-xs text-[var(--fg)] font-medium truncate max-w-[160px]">
                          {ticket.customerName || "Visitor"}
                        </p>
                        <p className="text-[11px] text-[var(--fg-muted)] truncate max-w-[160px] font-mono">
                          {ticket.customerEmail || ticket.createdBy}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--fg-muted)] font-mono text-[11px] tabular-nums whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedTicket && (
          <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] p-6 sticky top-6 space-y-6">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)]">
                  Ticket Details
                </p>
                <h3 className="text-sm font-semibold text-[var(--fg)] mt-0.5 leading-snug">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                aria-label="Close ticket details"
                className="p-1 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors rounded-[1px]"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-2">
                Update Status
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "open", label: "Open" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "resolved", label: "Resolved" },
                  ] as const
                ).map((option) => {
                  const isCurrent = selectedTicket.status === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={updatingStatus || isCurrent}
                      onClick={() =>
                        handleStatusChange(selectedTicket.id, option.id)
                      }
                      className={`py-1.5 px-2 text-xs font-medium uppercase tracking-[0.04em] rounded-[1px] border transition-colors ${isCurrent
                          ? "bg-[var(--fg)] text-[var(--btn-text)] border-[var(--fg)]"
                          : "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--fg)] hover:text-[var(--fg)]"
                        }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border)] space-y-2.5 text-xs">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1">
                Customer Information
              </p>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
                <span className="text-[var(--fg)] font-medium">
                  {selectedTicket.customerName || "Name not supplied"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
                <span className="text-[var(--fg)] font-mono select-all">
                  {selectedTicket.customerEmail || "Email not supplied"}
                </span>
              </div>
              {selectedTicket.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
                  <span className="text-[var(--fg)] font-mono select-all">
                    {selectedTicket.customerPhone}
                  </span>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1.5">
                Description / Question
              </p>
              <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--fg)] font-mono whitespace-pre-wrap leading-relaxed rounded-[1px]">
                {selectedTicket.description}
              </div>
            </div>

            {selectedTicket.conversationId && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Conversation History
                </p>
                {loadingMessages ? (
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border)] text-xs text-[var(--fg-muted)] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#E30613] rounded-full animate-ping" />
                    <span>Loading conversation...</span>
                  </div>
                ) : ticketMessages.length === 0 ? (
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border)] text-xs text-[var(--fg-muted)]">
                    No messages found in this conversation.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {ticketMessages.map((msg, idx) => {
                      const isUser = msg.role === "user";
                      const isExpanded = Boolean(expandedSources[idx]);
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wider mb-1">
                            {isUser ? "Customer" : "AI Assistant"}
                          </span>
                          <div
                            className={`max-w-[100%] p-3 text-xs leading-relaxed border rounded-[1px] ${
                              isUser
                                ? "bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--fg)] font-mono"
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--fg)]"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                  className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <FileText className="w-3 h-3 text-[#E30613]" />
                                  <span>{msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""} cited</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                                {isExpanded && (
                                  <div className="mt-1.5 border border-[var(--border)] bg-[var(--bg-subtle)] divide-y divide-[var(--border)] text-[11px]">
                                    {msg.sources.map((src, si) => (
                                      <div key={si} className="p-2.5 space-y-1">
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border)] space-y-1.5 text-[11px] text-[var(--fg-muted)] font-mono">
              <div className="flex justify-between">
                <span>Ticket ID:</span>
                <span className="select-all">
                  {selectedTicket.id.slice(0, 18)}...
                </span>
              </div>
              {selectedTicket.conversationId && (
                <div className="flex justify-between">
                  <span>Conversation ID:</span>
                  <span className="select-all">
                    {selectedTicket.conversationId.slice(0, 18)}...
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Created:</span>
                <span>
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
