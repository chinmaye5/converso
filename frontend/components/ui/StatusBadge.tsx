import React from "react";

type BadgeVariant =
  | "open"
  | "in_progress"
  | "resolved"
  | "pending"
  | "processed"
  | "failed"
  | "active"
  | "inactive"
  | "neutral";

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalized = status.toLowerCase() as BadgeVariant;
  const displayLabel = label || status.replace("_", " ");

  const styles: Record<BadgeVariant, { border: string; text: string; bg: string }> = {
    open: {
      border: "border-[#E30613]/40",
      text: "text-[#E30613]",
      bg: "bg-[#E30613]/5",
    },
    in_progress: {
      border: "border-[#D97706]/40",
      text: "text-[#D97706]",
      bg: "bg-[#D97706]/5",
    },
    resolved: {
      border: "border-[#16A34A]/40",
      text: "text-[#16A34A]",
      bg: "bg-[#16A34A]/5",
    },
    pending: {
      border: "border-[#D97706]/40",
      text: "text-[#D97706]",
      bg: "bg-[#D97706]/5",
    },
    processed: {
      border: "border-[#16A34A]/40",
      text: "text-[#16A34A]",
      bg: "bg-[#16A34A]/5",
    },
    failed: {
      border: "border-[#E30613]/40",
      text: "text-[#E30613]",
      bg: "bg-[#E30613]/5",
    },
    active: {
      border: "border-[#16A34A]/40",
      text: "text-[#16A34A]",
      bg: "bg-[#16A34A]/5",
    },
    inactive: {
      border: "border-[#737373]/40",
      text: "text-[#737373]",
      bg: "bg-[#737373]/5",
    },
    neutral: {
      border: "border-[#E5E5E5]",
      text: "text-[#737373]",
      bg: "bg-white",
    },
  };

  const current = styles[normalized] || styles.neutral;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.05em] border rounded-[1px] ${current.border} ${current.text} ${current.bg}`}
    >
      {displayLabel}
    </span>
  );
}
