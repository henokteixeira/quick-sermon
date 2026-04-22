"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Settings as SettingsIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  groupByDate,
  useNotificationsStore,
} from "@/lib/stores/notifications-store";
import {
  NotificationGroup,
  NotificationItem,
} from "./notification-item";
import type {
  AppNotification,
  NotificationCategory,
} from "@/lib/types/notification";

type TabValue = "all" | NotificationCategory;

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "clips", label: "Clips" },
  { value: "system", label: "Sistema" },
  { value: "team", label: "Equipe" },
];

export function NotificationsDrawer() {
  const isOpen = useNotificationsStore((s) => s.isDrawerOpen);
  const closeDrawer = useNotificationsStore((s) => s.closeDrawer);
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);

  const [tab, setTab] = useState<TabValue>("all");

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeDrawer]);

  const counts = useMemo(() => {
    const c: Record<TabValue, number> = {
      all: notifications.length,
      clips: 0,
      system: 0,
      team: 0,
    };
    for (const n of notifications) c[n.category] += 1;
    return c;
  }, [notifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(() => {
    const arr = tab === "all" ? notifications : notifications.filter((n) => n.category === tab);
    return arr;
  }, [tab, notifications]);

  const groups = groupByDate(filtered);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Fechar notificações"
        onClick={closeDrawer}
        className="absolute inset-0 bg-[rgba(12,10,9,0.55)] backdrop-blur-[2px]"
      />
      {/* Drawer */}
      <aside
        className="absolute bottom-3 right-3 top-3 flex w-[400px] flex-col overflow-hidden rounded-xl border border-qs-line-strong bg-qs-bg-elev shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(245,158,11,0.08)]"
        role="dialog"
        aria-label="Notificações"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-qs-line px-5 pb-3.5 pt-4">
          <div className="relative">
            <Bell className="h-[18px] w-[18px] text-qs-amber-bright" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-qs-amber px-[3px] text-[9px] font-bold text-[#0c0a09]"
                style={{ border: "2px solid #171412" }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <h3 className="flex-1 font-serif text-[18px] tracking-[-0.3px] text-qs-fg">
            Notificações
          </h3>
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[11px] font-medium text-qs-fg-subtle transition-colors hover:text-qs-fg-muted disabled:opacity-40"
            disabled={unreadCount === 0}
          >
            Marcar todas
          </button>
          <span className="h-3.5 w-px bg-qs-line" />
          <Link
            href="/notifications"
            onClick={closeDrawer}
            className="rounded p-1 text-qs-fg-faint transition-colors hover:text-qs-fg-muted"
            title="Preferências"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded p-1 text-qs-fg-faint transition-colors hover:text-qs-fg-muted"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-qs-line px-4 py-2.5">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-md border px-3 text-[11.5px] font-medium transition-colors",
                  active
                    ? "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] text-qs-amber-bright"
                    : "border-transparent text-qs-fg-subtle hover:text-qs-fg-muted",
                )}
              >
                {t.label}
                <span className="font-mono text-[10px] opacity-60">
                  {counts[t.value]}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="qs-scroll flex-1 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-[12px] text-qs-fg-faint">
              Nenhuma notificação nesta aba.
            </div>
          ) : (
            <>
              <DateGroup label="Hoje" items={groups.today} onRead={markAsRead} />
              <DateGroup label="Ontem" items={groups.yesterday} onRead={markAsRead} />
              <DateGroup label="Esta semana" items={groups.thisWeek} onRead={markAsRead} />
              <DateGroup label="Anteriores" items={groups.older} onRead={markAsRead} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-qs-line bg-qs-bg-elev-2 px-5 py-3">
          <span className="text-[11px] text-qs-fg-faint">
            {notifications.length} notificações
            {unreadCount > 0 && ` · ${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`}
          </span>
          <Link
            href="/notifications"
            onClick={closeDrawer}
            className="text-[12px] font-semibold text-qs-amber-bright hover:text-qs-amber"
          >
            Ver tudo →
          </Link>
        </div>
      </aside>
    </div>
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
        <NotificationItem
          key={n.id}
          notification={n}
          onRead={onRead}
        />
      ))}
    </NotificationGroup>
  );
}
