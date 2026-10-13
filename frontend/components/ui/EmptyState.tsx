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
    <div className="border border-[#E5E5E5] bg-white p-8 md:p-10 text-left">
      {section && (
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373] mb-2">
          {section}
        </p>
      )}
      <h3 className="text-base md:text-lg font-semibold text-[#0A0A0A] mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-[#737373] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
