import React from "react";

interface StatItemProps {
  label: string;
  value: string | number;
  caption?: string;
  isLast?: boolean;
}

export function StatItem({ label, value, caption, isLast }: StatItemProps) {
  return (
    <div
      className={`p-5 bg-white border-b md:border-b-0 ${
        !isLast ? "md:border-r border-[#E5E5E5]" : ""
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373] mb-2">
        {label}
      </p>
      <div className="text-[28px] font-semibold text-[#0A0A0A] tabular-nums leading-none tracking-tight">
        {value}
      </div>
      {caption && (
        <p className="text-xs text-[#737373] mt-2 font-normal">
          {caption}
        </p>
      )}
    </div>
  );
}

interface StatRowProps {
  stats: {
    label: string;
    value: string | number;
    caption?: string;
  }[];
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <div className="border border-[#E5E5E5] bg-white grid grid-cols-1 md:grid-cols-4 mb-8">
      {stats.map((stat, idx) => (
        <StatItem
          key={stat.label}
          label={stat.label}
          value={stat.value}
          caption={stat.caption}
          isLast={idx === stats.length - 1}
        />
      ))}
    </div>
  );
}
