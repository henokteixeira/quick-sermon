"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/lib/stores/notifications-store";

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
  const toggleDrawer = useNotificationsStore((s) => s.toggleDrawer);
  const unreadCount = useNotificationsStore((s) =>
    s.notifications.filter((n) => n.unread).length,
  );
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
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 truncate">Buscar vídeos, clips…</span>
        <span className="rounded border border-qs-line bg-qs-bg-elev-2 px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </span>
      </div>
      <button
        type="button"
        onClick={toggleDrawer}
        aria-label="Notificações"
        className="relative hidden rounded p-1 text-qs-fg-subtle transition-colors hover:text-qs-fg-muted md:block"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span
            className="absolute right-[-2px] top-[-2px] h-[7px] w-[7px] rounded-full bg-qs-amber"
            style={{ border: "2px solid #0c0a09" }}
          />
        )}
      </button>
    </div>
  );
}
