import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-none">
      <div className="bg-[var(--surface)] border border-[var(--border)] max-w-md w-full p-6 shadow-sm rounded-[1px] animate-in fade-in duration-100">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-1.5">
          Confirmation Required
        </p>
        <h3 className="text-base font-semibold text-[var(--fg)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--fg-muted)] mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.04em] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--hover)] transition-colors rounded-[1px] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.04em] transition-colors rounded-[1px] disabled:opacity-50 ${
              isDestructive
                ? "bg-[#E30613] hover:bg-[#C50510] text-white"
                : "btn-primary"
            }`}
          >
            {isConfirming ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}



