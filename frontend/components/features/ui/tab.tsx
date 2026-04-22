"use client";

import { cn } from "@/lib/utils";

interface TabProps {
  active?: boolean;
  children: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
}

export function Tab({
  active,
  children,
  badge,
  onClick,
  className,
}: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-[14px] pb-3 pt-2.5 text-[13px] transition-colors",
        active
          ? "font-semibold text-qs-amber-bright"
          : "font-medium text-qs-fg-subtle hover:text-qs-fg-muted",
        className,
      )}
    >
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            "rounded px-1.5 py-[1px] font-mono text-[10px] font-semibold",
            active
              ? "bg-[rgba(245,158,11,0.15)] text-qs-amber-bright"
              : "bg-qs-bg-elev-2 text-qs-fg-faint",
          )}
        >
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute inset-x-2.5 -bottom-[1px] h-[2px] rounded-full bg-qs-amber" />
      )}
    </button>
  );
}
