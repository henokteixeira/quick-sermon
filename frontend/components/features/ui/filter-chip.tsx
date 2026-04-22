"use client";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  count?: number;
  className?: string;
}

export function FilterChip({
  active = false,
  onClick,
  children,
  count,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center whitespace-nowrap rounded-full border px-3 text-[12px] font-medium transition-colors",
        active
          ? "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.10)] text-qs-amber-bright"
          : "border-qs-line bg-transparent text-qs-fg-subtle hover:border-qs-line-strong hover:text-qs-fg-muted",
        className,
      )}
    >
      {children}
      {typeof count === "number" && (
        <span className="ml-1 opacity-50">{count}</span>
      )}
    </button>
  );
}
