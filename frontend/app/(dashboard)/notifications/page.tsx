"use client";

import { useMemo, useState } from "react";
import { Check, Settings as SettingsIcon } from "lucide-react";
import { Btn } from "@/components/features/ui/btn";
import { FilterChip } from "@/components/features/ui/filter-chip";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import {
  NotificationGroup,
  NotificationItem,
} from "@/components/features/notifications/notification-item";
import {
  groupByDate,
  useNotificationsStore,
} from "@/lib/stores/notifications-store";
import type {
  AppNotification,
  NotificationCategory,
} from "@/lib/types/notification";

type FilterValue = "all" | "unread" | NotificationCategory;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "clips", label: "Clips" },
  { value: "system", label: "Sistema" },
  { value: "team", label: "Equipe" },
];

export default function NotificationsPage() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const [filter, setFilter] = useState<FilterValue>("all");

  const counts = useMemo(() => {
    const c: Record<FilterValue, number> = {
      all: notifications.length,
      unread: 0,
      clips: 0,
      system: 0,
      team: 0,
    };
    for (const n of notifications) {
      if (n.unread) c.unread += 1;
      c[n.category] += 1;
    }
    return c;
  }, [notifications]);

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => n.unread);
    return notifications.filter((n) => n.category === filter);
  }, [filter, notifications]);

  const groups = groupByDate(filtered);
  const unreadTodayCount = groups.today.filter((n) => n.unread).length;

  return (
    <>
      <PageTopbar
        title="Notificações"
        subtitle="Todas as atualizações da sua conta"
        action={
          <div className="flex items-center gap-2">
            <Btn
              size="sm"
              variant="ghost"
              icon={<Check className="h-3 w-3" />}
              onClick={markAllAsRead}
              disabled={counts.unread === 0}
            >
              Marcar todas como lidas
            </Btn>
            <Btn
              size="sm"
              variant="secondary"
              icon={<SettingsIcon className="h-3 w-3" />}
            >
              Preferências
            </Btn>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              active={filter === f.value}
              onClick={() => setFilter(f.value)}
              count={counts[f.value]}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qs-line bg-qs-bg-elev px-4 py-12 text-center text-[13px] text-qs-fg-faint">
            Nenhuma notificação nesta aba.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev">
            <DateGroup
              label={
                unreadTodayCount > 0
                  ? `Hoje · ${unreadTodayCount} não ${unreadTodayCount === 1 ? "lida" : "lidas"}`
                  : "Hoje"
              }
              items={groups.today}
              onRead={markAsRead}
            />
            <Divider show={groups.today.length > 0 && groups.yesterday.length > 0} />
            <DateGroup label="Ontem" items={groups.yesterday} onRead={markAsRead} />
            <Divider
              show={
                (groups.today.length > 0 || groups.yesterday.length > 0) &&
                groups.thisWeek.length > 0
              }
            />
            <DateGroup
              label="Esta semana"
              items={groups.thisWeek}
              onRead={markAsRead}
            />
            <Divider
              show={
                (groups.today.length + groups.yesterday.length + groups.thisWeek.length) > 0 &&
                groups.older.length > 0
              }
            />
            <DateGroup label="Anteriores" items={groups.older} onRead={markAsRead} />
          </div>
        )}
      </div>
    </>
  );
}

function DateGroup({
  label,
  items,
  onRead,
}: {
  label: string;
  items: AppNotification[];
  onRead: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <NotificationGroup label={label}>
      {items.map((n) => (
        <NotificationItem key={n.id} notification={n} onRead={onRead} />
      ))}
    </NotificationGroup>
  );
}

function Divider({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="h-px bg-qs-line" />;
}
