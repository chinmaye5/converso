"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { getTickets, updateTicketStatus } from "../../lib/api";
import type { SupportTicket, TicketStatus } from "../../lib/types";
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
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

export function TicketsInboxView() {
  const { getToken } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");

  // Selected ticket for side drawer
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
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

      // Keep selected ticket in sync if open
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load support tickets",
      );
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, getToken, selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    if (!currentWorkspace) return;

    try {
      setUpdatingStatus(true);
      setError(null);
      setActionSuccess(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const updated = await updateTicketStatus(
        token,
        currentWorkspace.id,
        ticketId,
        newStatus,
      );

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      setActionSuccess(`Ticket status updated to "${newStatus.replace("_", " ")}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Status update error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update ticket status",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Filtered list
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus =
        statusFilter === "all" ? true : t.status === statusFilter;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus;

      const matchesSearch =
        t.subject.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.customerName && t.customerName.toLowerCase().includes(query)) ||
        (t.customerEmail && t.customerEmail.toLowerCase().includes(query)) ||
        t.createdBy.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  // Metric counts
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

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
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
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

      {/* Metrics Row */}
      <StatRow stats={statItems} />

      {/* Search and Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto">
          {(
            [
              { id: "all", label: "All", count: tickets.length },
              { id: "open", label: "Open", count: openCount },
              { id: "in_progress", label: "In Progress", count: inProgressCount },
              { id: "resolved", label: "Resolved", count: resolvedCount },
            ] as const
          ).map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 font-medium transition-colors rounded-[1px] text-xs uppercase tracking-[0.04em] ${
                  isSelected
                    ? "bg-[var(--fg)] text-[var(--btn-text)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--hover)]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 font-mono text-[10px] tabular-nums opacity-80">
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, name, subject..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px]"
          />
        </div>
      </div>

      {/* Main Content Area: Table + Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ticket List Table */}
        <div
          className={`${
            selectedTicket ? "lg:col-span-7" : "lg:col-span-12"
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
                  {filteredTickets.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Ticket Detail Panel */}
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

            {/* Status Transition Control */}
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
                ).map((opt) => {
                  const isCurrent = selectedTicket.status === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={updatingStatus || isCurrent}
                      onClick={() =>
                        handleStatusChange(selectedTicket.id, opt.id)
                      }
                      className={`py-1.5 px-2 text-xs font-medium uppercase tracking-[0.04em] rounded-[1px] border transition-colors ${
                        isCurrent
                          ? "bg-[var(--fg)] text-[var(--btn-text)] border-[var(--fg)]"
                          : "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--fg)] hover:text-[var(--fg)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Details */}
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

            {/* Description */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1.5">
                Description / Question
              </p>
              <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--fg)] font-mono whitespace-pre-wrap leading-relaxed rounded-[1px]">
                {selectedTicket.description}
              </div>
            </div>

            {/* System Metadata */}
            <div className="pt-2 border-t border-[var(--border)] space-y-1.5 text-[11px] text-[var(--fg-muted)] font-mono">
              <div className="flex justify-between">
                <span>Ticket ID:</span>
                <span className="select-all">{selectedTicket.id.slice(0, 18)}...</span>
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
                <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



