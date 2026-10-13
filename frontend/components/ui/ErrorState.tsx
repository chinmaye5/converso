import React from "react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Error",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="border border-[#E30613]/30 bg-[var(--surface)] p-6 md:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#E30613] mb-1.5">
        {title}
      </p>
      <p className="text-sm text-[var(--fg)] mb-4 max-w-xl leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.04em] btn-primary transition-colors rounded-[1px]"
        >
          Retry
        </button>
      )}
    </div>
  );
}


