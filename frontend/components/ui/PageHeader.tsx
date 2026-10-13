import React, { type ReactNode } from "react";

interface PageHeaderProps {
  section?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  section,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="border-b border-[#E5E5E5] pb-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {section && (
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373] mb-1">
              {section}
            </p>
          )}
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#0A0A0A] leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#737373] mt-1.5 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
