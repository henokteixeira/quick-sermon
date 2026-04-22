import {
  AlertTriangle,
  Bell,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users as UsersIcon,
  Youtube,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeShort } from "@/lib/stores/notifications-store";
import type { AppNotification, NotificationType } from "@/lib/types/notification";

const CONFIG: Record<
  NotificationType,
  {
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  clip_ready: {
    Icon: Sparkles,
    color: "text-qs-amber-bright",
    bg: "bg-[rgba(245,158,11,0.10)]",
  },
  publish: {
    Icon: Youtube,
    color: "text-[#ff6b6b]",
    bg: "bg-[rgba(248,113,113,0.10)]",
  },
  detection: {
    Icon: Zap,
    color: "text-qs-purple",
    bg: "bg-[rgba(167,139,250,0.12)]",
  },
  error: {
    Icon: AlertTriangle,
    color: "text-qs-danger",
    bg: "bg-[rgba(248,113,113,0.12)]",
  },
  member: {
    Icon: UsersIcon,
    color: "text-qs-ok",
    bg: "bg-[rgba(52,211,153,0.12)]",
  },
  processing: {
    Icon: RefreshCw,
    color: "text-qs-info",
    bg: "bg-[rgba(96,165,250,0.12)]",
  },
  quota: {
    Icon: TrendingUp,
    color: "text-qs-amber-bright",
    bg: "bg-[rgba(245,158,11,0.10)]",
  },
};

interface NotificationItemProps {
  notification: AppNotification;
  onRead?: (id: string) => void;
  className?: string;
}

export function NotificationItem({
  notification,
  onRead,
  className,
}: NotificationItemProps) {
  const { Icon, color, bg } = CONFIG[notification.type] ?? {
    Icon: Bell,
    color: "text-qs-fg-subtle",
    bg: "bg-qs-bg-elev-2",
  };
  const { title, body, createdAt, unread, id } = notification;

  return (
    <button
      type="button"
      onClick={() => onRead?.(id)}
      className={cn(
        "relative flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-qs-bg-subtle",
        unread && "border-l-2 border-qs-amber bg-[rgba(245,158,11,0.03)]",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          bg,
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px]",
              unread
                ? "font-semibold text-qs-fg"
                : "font-medium text-qs-fg-muted",
            )}
          >
            {title}
          </span>
          <span className="shrink-0 font-mono text-[10.5px] text-qs-fg-faint">
            {formatRelativeShort(createdAt)}
          </span>
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-[1.4] text-qs-fg-subtle">
          {body}
        </span>
      </span>
      {unread && (
        <span className="absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-qs-amber" />
      )}
    </button>
  );
}

interface NotificationGroupProps {
  label: string;
  children: React.ReactNode;
}

export function NotificationGroup({ label, children }: NotificationGroupProps) {
  return (
    <div className="py-2.5">
      <div className="px-5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[1.3px] text-qs-fg-faint">
        {label}
      </div>
      {children}
    </div>
  );
}
