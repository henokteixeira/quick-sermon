"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageTopbarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageTopbar({
  title,
  subtitle,
  action,
  className,
}: PageTopbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-4 -mt-4 mb-6 flex h-16 items-center gap-4 border-b border-qs-line px-4 backdrop-blur-md md:-mx-8 md:-mt-8 md:px-8",
        className,
      )}
      style={{ background: "rgba(12,10,9,0.6)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-serif text-[20px] leading-[1.1] tracking-[-0.3px] text-qs-fg">
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[12px] text-qs-fg-faint">
            {subtitle}
          </div>
        )}
      </div>
      {action}
      <div className="hidden h-[34px] w-[220px] items-center gap-2 rounded-lg border border-qs-line bg-qs-bg-elev px-3 text-[12px] text-qs-fg-faint md:flex">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <input
          type="search"
          disabled
          placeholder="Buscar vídeos, clips…"
          title="Em breve"
          className="w-full truncate bg-transparent text-[12px] text-qs-fg-faint placeholder:text-qs-fg-faint focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
