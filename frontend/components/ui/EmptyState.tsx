import React, { type ReactNode } from "react";

interface EmptyStateProps {
  section?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  section,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10 text-left">
      {section && (
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-2">
          {section}
        </p>
      )}
      <h3 className="text-base md:text-lg font-semibold text-[var(--fg)] mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-[var(--fg-muted)] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}


